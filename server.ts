import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { findCandidateMeetingSlots, SchedulingParticipant } from "./src/lib/scheduling";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const PORT = 3000;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const currentUser = {
  user_id: "user_cowork_1",
  email: "askadhithiya@gmail.com",
  name: "Adhithiya",
  picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  settings: { theme: "dark", voice_enabled: true, notifications: true },
  timezone: "UTC",
  created_at: now(),
  last_login: now(),
};

type AppUser = typeof currentUser;
const users = new Map<string, AppUser>([[currentUser.user_id, currentUser]]);
const authTokens = new Map<string, string>();

function userIdForEmail(email: string) {
  return `user_${Buffer.from(email.trim().toLowerCase()).toString("base64url").slice(0, 32)}`;
}

function upsertUser(email: string, name: string, picture?: string): AppUser {
  const normalizedEmail = email.trim().toLowerCase() || currentUser.email;
  const userId = normalizedEmail === currentUser.email ? currentUser.user_id : userIdForEmail(normalizedEmail);
  const existing = users.get(userId);
  const user: AppUser = {
    ...(existing || currentUser),
    user_id: userId,
    email: normalizedEmail,
    name: name.trim() || existing?.name || normalizedEmail.split("@")[0],
    picture: picture || existing?.picture || currentUser.picture,
    last_login: now(),
  };
  users.set(userId, user);
  return user;
}

function userFromToken(token: string | undefined): AppUser | undefined {
  const userId = token ? authTokens.get(token) : undefined;
  return userId ? users.get(userId) : undefined;
}

type WorkspaceRole = "owner" | "admin" | "member";
type MentionType = "user" | "github";

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
}

interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  createdBy: string;
  linkedGithubRepo: string | null;
}

interface ChannelMember {
  channelId: string;
  userId: string;
  joinedAt: string;
}

interface Room {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
}

interface RoomPresence {
  roomId: string;
  userId: string;
  userName: string;
  userPicture?: string;
  enteredAt: string;
  socketIds: string[];
}

interface GithubConnection {
  workspaceId: string;
  encryptedToken: string;
  updatedAt: string;
}

interface GithubMentionData {
  repo: string;
  number: number;
  title?: string;
  state?: "open" | "closed" | "merged";
  author?: string;
  labels?: string[];
  url?: string;
  kind?: "issue" | "pull_request";
  resolved: boolean;
  error?: "invalid_repo" | "rate_limited" | "not_found_or_private" | "unlinked_repo" | "github_error";
  hint?: string;
}

interface MessageMention {
  type: MentionType;
  value: string;
  data?: GithubMentionData;
}

interface TeamMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  mentions: MessageMention[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  images?: Array<{ id: string; src: string; filename?: string }>;
  tool_proposal?: any;
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  workspaceId: string;
}

interface MeetingTranscriptChunk {
  speaker: string;
  text: string;
  timestamp: string;
}

interface MeetingSummaryVersion {
  id: string;
  generatedAt: string;
  summary: string;
  sourceChunkCount: number;
  status: "ai-generated" | "fallback";
}

interface MeetingTranscript {
  id: string;
  workspaceId: string;
  meetingId: string;
  chunks: MeetingTranscriptChunk[];
  startedAt: string;
  endedAt: string | null;
  summaries: MeetingSummaryVersion[];
  lastSummarizedChunkIndex: number;
}

interface StandupEntry {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  date: string;
  content: string;
  createdAt: string;
}

interface StandupDigest {
  id: string;
  workspaceId: string;
  date: string;
  mergedSummary: string;
  generatedAt: string;
  status: "ai-generated" | "fallback";
}

interface Blocker {
  id: string;
  workspaceId: string;
  sourceStandupEntryId: string;
  description: string;
  mentionedBy: string;
  severity: "blocking" | "at-risk" | "fyi" | "unclassified";
  relatedTo: string | null;
  status: "active" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
}

interface ActionItem {
  id: string;
  workspaceId: string;
  description: string;
  suggestedOwnerId: string | null;
  confirmedOwnerId: string | null;
  sourceType: "meeting" | "standup";
  sourceId: string;
  status: "suggested" | "confirmed" | "done";
  createdAt: string;
}

interface AuthRequest extends Request {
  user?: AppUser;
  workspace?: Workspace;
}

interface MeetingRequest {
  id: string;
  workspaceId: string;
  requesterId: string;
  requesterName: string;
  recipient: string;
  reason: string;
  durationMinutes: number;
  proposedStart: string;
  proposedEnd: string;
  status: "pending" | "accepted" | "rejected";
  comment: string;
  createdAt: string;
  meet_link?: string;
}

const defaultWorkspaceId = `ws_personal_${currentUser.user_id}`;
const defaultChannelId = "chan_general_personal";

let workspaces: Workspace[] = [{ id: defaultWorkspaceId, name: "Personal", createdAt: now(), ownerId: currentUser.user_id }];
let workspaceMembers: WorkspaceMember[] = [{ workspaceId: defaultWorkspaceId, userId: currentUser.user_id, role: "owner", joinedAt: now() }];
let channels: Channel[] = [{ id: defaultChannelId, workspaceId: defaultWorkspaceId, name: "general", createdAt: now(), createdBy: currentUser.user_id, linkedGithubRepo: null }];
let channelMembers: ChannelMember[] = [{ channelId: defaultChannelId, userId: currentUser.user_id, joinedAt: now() }];
let rooms: Room[] = [
  { id: "room_design_personal", workspaceId: defaultWorkspaceId, name: "Design", createdAt: now() },
  { id: "room_standup_personal", workspaceId: defaultWorkspaceId, name: "Standup", createdAt: now() },
  { id: "room_focus_personal", workspaceId: defaultWorkspaceId, name: "Focus", createdAt: now() },
];
let githubConnections: GithubConnection[] = [];
let teamMessages: TeamMessage[] = [];
const roomPresence = new Map<string, RoomPresence[]>();
const disconnectGraceTimers = new Map<string, NodeJS.Timeout>();
let meetingTranscripts: MeetingTranscript[] = [];
let standupEntries: StandupEntry[] = [];
let standupDigests: StandupDigest[] = [];
let blockers: Blocker[] = [];
let actionItems: ActionItem[] = [];
let meetingRequests: MeetingRequest[] = [];
const sessions: Map<string, ChatSession> = new Map();
const githubCache = new Map<string, { expiresAt: number; data: GithubMentionData }>();

let events = [
  { id: "evt_1", summary: "Executive Sprint Review & Product Sync", start: new Date(Date.now() + 7200000).toISOString(), end: new Date(Date.now() + 10800000).toISOString(), location: "Google Meet", description: "Review sprint deliverables, architectural progress, and AI assistant enhancements.", meet_link: "https://meet.google.com/zen-ith-meet", attendees: ["askadhithiya@gmail.com", "sarah.chen@techcorp.io"], workspaceId: defaultWorkspaceId },
  { id: "evt_2", summary: "AI Architecture & Latency Benchmark Sync", start: new Date(Date.now() + 18000000).toISOString(), end: new Date(Date.now() + 21600000).toISOString(), location: "Room 402 / Virtual", description: "Discussion on multi-modal tool routing and token caching strategies.", meet_link: "https://meet.google.com/arch-sync-now", attendees: ["askadhithiya@gmail.com"], workspaceId: defaultWorkspaceId },
];

let tasks = [
  { id: "task_1", title: "Review Q3 product roadmap & milestones", notes: "Ensure all deliverables have assigned leads and risk mitigations documented.", due: new Date(Date.now() + 28800000).toISOString(), is_completed: false, created_at: now(), workspaceId: defaultWorkspaceId },
  { id: "task_2", title: "Reply to Sarah regarding marketing proposal", notes: "Approve budget reallocation for developer summit sponsorship.", due: new Date(Date.now() + 43200000).toISOString(), is_completed: false, created_at: now(), workspaceId: defaultWorkspaceId },
];

let notes = [
  { note_id: "note_1", title: "Co-Work Architecture Notes", content: "Co-Work operates as a proactive Chief of Staff with calendar, task, search, notes, and Gemini-driven reasoning.", tags: ["architecture", "ai"], source: "cowork_core", created_at: now(), updated_at: now(), workspaceId: defaultWorkspaceId },
  { note_id: "note_2", title: "Sprint 14 Takeaways", content: "Prioritize response latency, keyboard navigation, and dark glassmorphic styling.", tags: ["meeting", "sprint"], source: "calendar_prep", created_at: now(), updated_at: now(), workspaceId: defaultWorkspaceId },
];

let emails = [
  { id: "mail_1", from: "Sarah Chen <sarah.chen@techcorp.io>", subject: "Urgent: Feedback on Q3 Product Roadmap before 3 PM", snippet: "Please take a look at the attached roadmap revisions.", body_text: "Please take a look at the roadmap revisions.", body_html: "<p>Please take a look at the roadmap revisions.</p>", is_unread: true, date: now(), workspaceId: defaultWorkspaceId },
  { id: "mail_2", from: "Alex Dev <alex.dev@techcorp.io>", subject: "Sprint Review prep notes & agenda", snippet: "Agenda for today's review is ready.", body_text: "Agenda for today's review is ready.", body_html: "<p>Agenda for today's review is ready.</p>", is_unread: true, date: now(), workspaceId: defaultWorkspaceId },
];

let userPreferences = {
  preferred_meeting_times: ["09:00 - 12:00", "14:00 - 17:00"],
  frequent_contacts: ["sarah.chen@techcorp.io", "alex.dev@techcorp.io"],
  email_tone: "professional_concise",
  custom_rules: ["Flag urgent emails immediately", "Auto-draft meeting preparation notes"],
  working_hours: { start: "09:00", end: "17:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  timezone: "UTC",
  notification_preferences: { daily_briefing: true, email_alerts: true, task_reminders: true },
  updated_at: now(),
};

sessions.set("session_welcome", {
  session_id: "session_welcome",
  title: "Morning Briefing & Calendar Review",
  created_at: now(),
  updated_at: now(),
  workspaceId: defaultWorkspaceId,
  messages: [{ role: "assistant", content: "Hello Adhithiya! I am Co-Work, your Chief of Staff and workspace assistant.", timestamp: now() }],
});

function encryptToken(token: string) {
  return Buffer.from(token, "utf8").toString("base64");
}

function decryptToken(encryptedToken: string) {
  return Buffer.from(encryptedToken, "base64").toString("utf8");
}

function isValidRole(role: string): role is WorkspaceRole {
  return ["owner", "admin", "member"].includes(role);
}

function isValidRepo(repo: string) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function resolveWorkspace(req: AuthRequest) {
  const workspaceId = (req.headers["x-workspace-id"] as string) || (req.query.workspaceId as string);
  const memberWorkspaceIds = workspaceMembers.filter((m) => m.userId === req.user?.user_id).map((m) => m.workspaceId);
  const selected = workspaces.find((w) => w.id === workspaceId && memberWorkspaceIds.includes(w.id));
  return selected || workspaces.find((w) => memberWorkspaceIds.includes(w.id)) || workspaces.find((w) => w.id === defaultWorkspaceId)!;
}

const authMiddleware = (req: AuthRequest, res: Response, next: express.NextFunction) => {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  const user = userFromToken(token);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  req.user = user;
  req.workspace = resolveWorkspace(req);
  next();
};

function requireWorkspaceMembership(req: AuthRequest, res: Response, workspaceId = req.params.workspaceId || req.params.id) {
  if (!workspaceMembers.some((m) => m.workspaceId === workspaceId && m.userId === req.user?.user_id)) {
    res.status(403).json({ error: "Not a member of this workspace" });
    return false;
  }
  return true;
}

function getWorkspaceScoped<T extends { workspaceId: string }>(items: T[], req: AuthRequest) {
  return items.filter((item) => item.workspaceId === req.workspace?.id);
}

function channelForRequest(req: AuthRequest, res: Response) {
  const channel = channels.find((c) => c.id === req.params.channelId);
  if (!channel || channel.workspaceId !== req.workspace?.id) {
    res.status(404).json({ error: "Channel not found in workspace" });
    return null;
  }
  return channel;
}

function roomForRequest(req: AuthRequest, res: Response) {
  const room = rooms.find((r) => r.id === req.params.roomId);
  if (!room || room.workspaceId !== req.workspace?.id) {
    res.status(404).json({ error: "Room not found in workspace" });
    return null;
  }
  return room;
}

function roomSnapshot(workspaceId: string) {
  return rooms
    .filter((room) => room.workspaceId === workspaceId)
    .map((room) => ({
      ...room,
      occupants: roomPresence.get(room.id) || [],
    }));
}

function broadcastRoomPresence(workspaceId: string, roomId: string, event: "enter" | "leave" | "snapshot") {
  const room = rooms.find((candidate) => candidate.id === roomId);
  if (!room) return;
  io.to(`workspace:${workspaceId}`).emit("room:presence", {
    event,
    roomId,
    occupants: roomPresence.get(roomId) || [],
    rooms: roomSnapshot(workspaceId),
  });
}

function removeSocketFromPresence(socketId: string, workspaceId: string, broadcast = true) {
  for (const [roomId, occupants] of roomPresence.entries()) {
    const next = occupants
      .map((occupant) => ({ ...occupant, socketIds: occupant.socketIds.filter((id) => id !== socketId) }))
      .filter((occupant) => occupant.socketIds.length > 0);
    if (next.length !== occupants.length || next.some((occupant, index) => occupant.socketIds.length !== occupants[index]?.socketIds.length)) {
      roomPresence.set(roomId, next);
      if (broadcast) broadcastRoomPresence(workspaceId, roomId, "leave");
    }
  }
}

function enterRoom(socketId: string, workspaceId: string, roomId: string, user: AppUser) {
  const room = rooms.find((candidate) => candidate.id === roomId && candidate.workspaceId === workspaceId);
  if (!room) return null;
  removeSocketFromPresence(socketId, workspaceId, false);
  const occupants = roomPresence.get(roomId) || [];
  const existing = occupants.find((occupant) => occupant.userId === user.user_id);
  if (existing) {
    existing.socketIds = Array.from(new Set([...existing.socketIds, socketId]));
  } else {
    occupants.push({
      roomId,
      userId: user.user_id,
      userName: user.name,
      userPicture: user.picture,
      enteredAt: now(),
      socketIds: [socketId],
    });
  }
  roomPresence.set(roomId, occupants);
  broadcastRoomPresence(workspaceId, roomId, "enter");
  return occupants;
}

function leaveRoom(socketId: string, workspaceId: string, roomId: string) {
  const occupants = roomPresence.get(roomId) || [];
  const next = occupants
    .map((occupant) => ({ ...occupant, socketIds: occupant.socketIds.filter((id) => id !== socketId) }))
    .filter((occupant) => occupant.socketIds.length > 0);
  roomPresence.set(roomId, next);
  broadcastRoomPresence(workspaceId, roomId, "leave");
}

async function resolveGithubMention(repo: string, number: number, workspaceId: string): Promise<GithubMentionData> {
  if (!isValidRepo(repo)) {
    return { repo, number, resolved: false, error: "invalid_repo", hint: "Use owner/repo#123." };
  }

  const cacheKey = `${workspaceId}:${repo}#${number}`;
  const cached = githubCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const connection = githubConnections.find((c) => c.workspaceId === workspaceId);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Co-Work",
  };
  if (connection) headers.Authorization = `Bearer ${decryptToken(connection.encryptedToken)}`;

  try {
    const [owner, repoName] = repo.split("/");
    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues/${number}`, { headers });
    if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
      return { repo, number, resolved: false, error: "rate_limited", hint: "GitHub rate limit reached. Add a workspace token or try again later." };
    }
    if (response.status === 404) {
      return { repo, number, resolved: false, error: "not_found_or_private", hint: "Issue/PR was not found, or the token cannot access this repo." };
    }
    if (!response.ok) {
      return { repo, number, resolved: false, error: "github_error", hint: `GitHub returned ${response.status}.` };
    }

    const issue = await response.json();
    const data: GithubMentionData = {
      repo,
      number: issue.number,
      title: issue.title,
      state: issue.pull_request?.merged_at ? "merged" : issue.state,
      author: issue.user?.login,
      labels: Array.isArray(issue.labels) ? issue.labels.map((label: any) => label.name).filter(Boolean) : [],
      url: issue.html_url,
      kind: issue.pull_request ? "pull_request" : "issue",
      resolved: true,
    };
    githubCache.set(cacheKey, { expiresAt: Date.now() + 60000, data });
    return data;
  } catch {
    return { repo, number, resolved: false, error: "github_error", hint: "Could not reach GitHub from the server." };
  }
}

async function parseMentions(content: string, channel: Channel): Promise<MessageMention[]> {
  const mentions: MessageMention[] = [];
  const seenGithub = new Set<string>();

  for (const match of content.matchAll(/@github\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)/g)) {
    const repo = match[1];
    const number = Number(match[2]);
    const key = `${repo}#${number}`;
    if (seenGithub.has(key)) continue;
    seenGithub.add(key);
    mentions.push({ type: "github", value: key, data: await resolveGithubMention(repo, number, channel.workspaceId) });
  }

  for (const match of content.matchAll(/(^|[\s(])#(\d+)\b/g)) {
    const number = Number(match[2]);
    if (!channel.linkedGithubRepo) {
      mentions.push({ type: "github", value: `#${number}`, data: { repo: "", number, resolved: false, error: "unlinked_repo", hint: "Link a repo to resolve #123." } });
      continue;
    }
    const key = `${channel.linkedGithubRepo}#${number}`;
    if (seenGithub.has(key)) continue;
    seenGithub.add(key);
    mentions.push({ type: "github", value: key, data: await resolveGithubMention(channel.linkedGithubRepo, number, channel.workspaceId) });
  }

  for (const match of content.matchAll(/@([A-Za-z][A-Za-z0-9_.-]{1,40})/g)) {
    if (match[0] !== "@github") mentions.push({ type: "user", value: match[1] });
  }

  return mentions;
}

type MeetingWebhookPayload = {
  eventType: "chunk" | "end";
  workspaceId: string;
  meetingId: string;
  speaker?: string;
  text?: string;
  timestamp?: string;
};

function validateMeetingWebhookPayload(body: any): { ok: true; payload: MeetingWebhookPayload } | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "Payload must be an object" };
  if (body.eventType !== "chunk" && body.eventType !== "end") return { ok: false, reason: "eventType must be chunk or end" };
  if (typeof body.workspaceId !== "string" || !body.workspaceId.trim()) return { ok: false, reason: "workspaceId is required" };
  if (typeof body.meetingId !== "string" || !body.meetingId.trim()) return { ok: false, reason: "meetingId is required" };
  if (body.eventType === "chunk") {
    if (typeof body.speaker !== "string" || !body.speaker.trim()) return { ok: false, reason: "speaker is required for chunks" };
    if (typeof body.text !== "string" || !body.text.trim()) return { ok: false, reason: "text is required for chunks" };
    if (typeof body.timestamp !== "string" || Number.isNaN(Date.parse(body.timestamp))) return { ok: false, reason: "timestamp must be an ISO date string" };
  }
  return { ok: true, payload: body };
}

function getOrCreateTranscript(workspaceId: string, meetingId: string) {
  let transcript = meetingTranscripts.find((item) => item.workspaceId === workspaceId && item.meetingId === meetingId);
  if (!transcript) {
    transcript = {
      id: makeId("meeting"),
      workspaceId,
      meetingId,
      chunks: [],
      startedAt: now(),
      endedAt: null,
      summaries: [],
      lastSummarizedChunkIndex: 0,
    };
    meetingTranscripts.push(transcript);
  }
  return transcript;
}

function validateMeetingSummaryJson(value: any): value is { summary: string } {
  return !!value && typeof value === "object" && typeof value.summary === "string" && value.summary.trim().length > 0;
}

async function summarizeTranscript(transcript: MeetingTranscript, force = false) {
  const newChunks = transcript.chunks.slice(transcript.lastSummarizedChunkIndex);
  if (!force && newChunks.length < 2) return null;
  if (newChunks.length === 0 && transcript.summaries.length > 0) return transcript.summaries.at(-1) || null;

  const previousSummary = transcript.summaries.at(-1)?.summary || "";
  const chunkText = newChunks.map((chunk) => `[${chunk.timestamp}] ${chunk.speaker}: ${chunk.text}`).join("\n");
  const schema = `{ "summary": "string" }`;
  const ai = getGemini();
  let summary = "";
  let status: MeetingSummaryVersion["status"] = "ai-generated";

  if (ai) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{
          role: "user",
          parts: [{ text: `Return only valid JSON matching this schema: ${schema}\nPrior running summary:\n${previousSummary || "(none)"}\nNew transcript chunks:\n${chunkText}\nProduce a concise running meeting summary that incorporates the new chunks without re-summarizing from scratch.` }],
        }],
      });
      const parsed = JSON.parse(result.text || "{}");
      if (validateMeetingSummaryJson(parsed)) summary = parsed.summary.trim();
    } catch (error) {
      console.error("Meeting summarization failed; storing fallback summary", error);
    }
  }

  if (!summary) {
    status = "fallback";
    const additions = newChunks.map((chunk) => `${chunk.speaker}: ${chunk.text}`).join(" ");
    summary = [previousSummary, additions].filter(Boolean).join("\n").slice(0, 1800) || "No transcript content summarized yet.";
  }

  const version: MeetingSummaryVersion = {
    id: makeId("summary"),
    generatedAt: now(),
    summary,
    sourceChunkCount: transcript.chunks.length,
    status,
  };
  transcript.summaries.push(version);
  transcript.lastSummarizedChunkIndex = transcript.chunks.length;
  await extractActionItemsFromText(transcript.workspaceId, "meeting", transcript.id, summary);
  io.to(`workspace:${transcript.workspaceId}`).emit("meeting:summary", { transcript, version });
  return version;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateDigestJson(value: any): value is { mergedSummary: string } {
  return !!value && typeof value === "object" && typeof value.mergedSummary === "string" && value.mergedSummary.trim().length > 0;
}

function validateBlockerJson(value: any): value is { blockers: Array<{ description: string; mentionedBy: string; severity: "blocking" | "at-risk" | "fyi"; relatedTo: string | null }> } {
  return !!value && typeof value === "object" && Array.isArray(value.blockers) && value.blockers.every((blocker: any) =>
    blocker && typeof blocker.description === "string" &&
    typeof blocker.mentionedBy === "string" &&
    ["blocking", "at-risk", "fyi"].includes(blocker.severity) &&
    (blocker.relatedTo === null || typeof blocker.relatedTo === "string")
  );
}

function validateActionItemJson(value: any): value is { actionItems: Array<{ description: string; ownerName: string | null }> } {
  return !!value && typeof value === "object" && Array.isArray(value.actionItems) && value.actionItems.every((item: any) =>
    item && typeof item.description === "string" && (item.ownerName === null || typeof item.ownerName === "string")
  );
}

function memberNameForUser(workspaceId: string, userId: string) {
  return users.get(userId)?.name || userId;
}

function matchWorkspaceMemberByName(workspaceId: string, ownerName: string | null) {
  if (!ownerName) return null;
  const normalized = ownerName.toLowerCase();
  const members = workspaceMembers.filter((member) => member.workspaceId === workspaceId);
  const match = members.find((member) => member.userId.toLowerCase() === normalized || memberNameForUser(workspaceId, member.userId).toLowerCase().includes(normalized));
  if (match) return match.userId;
  return Array.from(users.values()).find((user) => user.email.toLowerCase() === normalized || user.name.toLowerCase().includes(normalized))?.user_id || null;
}

async function generateJsonWithRetry<T>(prompt: string, validate: (value: any) => value is T) {
  const ai = getGemini();
  if (!ai) return null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const parsed = JSON.parse(result.text || "{}");
      if (validate(parsed)) return parsed;
    } catch (error) {
      console.error("Structured Gemini JSON generation failed", error);
    }
  }
  return null;
}

async function extractBlockersForStandup(entry: StandupEntry) {
  const prompt = `Return only valid JSON matching this exact schema: { "blockers": [{ "description": "string", "mentionedBy": "string", "severity": "blocking" | "at-risk" | "fyi", "relatedTo": "string or null" }] }\nExtract zero or more discrete blockers from this standup. This is best-effort NLP classification; do not invent blockers. mentionedBy must be ${entry.userName}.\nStandup text:\n${entry.content}`;
  const parsed = await generateJsonWithRetry(prompt, validateBlockerJson);
  const extracted = parsed?.blockers.length ? parsed.blockers : [{ description: entry.content, mentionedBy: entry.userName, severity: "unclassified" as const, relatedTo: null }];
  const stored = extracted.map((blocker) => ({
    id: makeId("blocker"),
    workspaceId: entry.workspaceId,
    sourceStandupEntryId: entry.id,
    description: blocker.description,
    mentionedBy: blocker.mentionedBy,
    severity: blocker.severity,
    relatedTo: blocker.relatedTo,
    status: "active" as const,
    createdAt: now(),
    resolvedAt: null,
  }));
  blockers.push(...stored);
  return stored;
}

async function extractActionItemsFromText(workspaceId: string, sourceType: "meeting" | "standup", sourceId: string, text: string) {
  const memberList = workspaceMembers.filter((member) => member.workspaceId === workspaceId).map((member) => `${memberNameForUser(workspaceId, member.userId)} (${member.userId})`).join(", ");
  const prompt = `Return only valid JSON matching this exact schema: { "actionItems": [{ "description": "string", "ownerName": "string or null" }] }\nExtract concrete action items. If the text names a specific owner, set ownerName to that name; otherwise null. Never guess an owner. Workspace members: ${memberList || "none"}.\nText:\n${text}`;
  const parsed = await generateJsonWithRetry(prompt, validateActionItemJson);
  const fallbackItems = () => text
    .split(/[.!?\n]/)
    .map((part) => part.trim())
    .filter((part) => /\b(will|follow up|need to|needs to|todo|action)\b/i.test(part))
    .slice(0, 5)
    .map((description) => ({
      description,
      ownerName: description.toLowerCase().includes(currentUser.name.toLowerCase()) ? currentUser.name : null,
    }));
  const actionSource = parsed?.actionItems.length ? parsed.actionItems : fallbackItems();
  const existingKeys = new Set(actionItems.map((item) => `${item.sourceType}:${item.sourceId}:${item.description}`));
  const stored = actionSource
    .filter((item) => item.description.trim())
    .filter((item) => !existingKeys.has(`${sourceType}:${sourceId}:${item.description}`))
    .map((item) => ({
      id: makeId("action"),
      workspaceId,
      description: item.description,
      suggestedOwnerId: matchWorkspaceMemberByName(workspaceId, item.ownerName),
      confirmedOwnerId: null,
      sourceType,
      sourceId,
      status: "suggested" as const,
      createdAt: now(),
    }));
  actionItems.push(...stored);
  return stored;
}

async function generateStandupDigest(workspaceId: string, date: string) {
  const entries = standupEntries.filter((entry) => entry.workspaceId === workspaceId && entry.date === date);
  if (entries.length === 0) return null;

  const schema = `{ "mergedSummary": "string" }`;
  const entryText = entries.map((entry) => `- ${entry.userName} (${entry.userId}): ${entry.content}`).join("\n");
  const ai = getGemini();
  let mergedSummary = "";
  let status: StandupDigest["status"] = "ai-generated";

  if (ai) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{
          role: "user",
          parts: [{ text: `Return only valid JSON matching this schema: ${schema}\nMerge these standup updates into one coherent digest grouped by theme/project. Preserve attribution explicitly: every claim, blocker, or next step must name who said it.\nStandup entries:\n${entryText}` }],
        }],
      });
      const parsed = JSON.parse(result.text || "{}");
      if (validateDigestJson(parsed)) mergedSummary = parsed.mergedSummary.trim();
    } catch (error) {
      console.error("Standup digest generation failed; storing fallback digest", error);
    }
  }

  if (!mergedSummary) {
    status = "fallback";
    mergedSummary = entries.map((entry) => `${entry.userName}: ${entry.content}`).join("\n");
  }

  const digest: StandupDigest = {
    id: makeId("standup_digest"),
    workspaceId,
    date,
    mergedSummary,
    generatedAt: now(),
    status,
  };
  standupDigests = standupDigests.filter((item) => !(item.workspaceId === workspaceId && item.date === date));
  standupDigests.push(digest);
  await extractActionItemsFromText(workspaceId, "standup", digest.id, mergedSummary);
  io.to(`workspace:${workspaceId}`).emit("standup:digest", { digest });
  return digest;
}

function githubContextForWorkspace(workspaceId: string) {
  return teamMessages
    .filter((m) => channels.find((c) => c.id === m.channelId)?.workspaceId === workspaceId)
    .flatMap((m) => m.mentions.filter((mention) => mention.type === "github" && mention.data?.resolved).map((mention) => mention.data!))
    .slice(-8);
}

io.on("connection", (socket) => {
  const token = String(socket.handshake.auth?.token || socket.handshake.query.token || "");
  const user = userFromToken(token);
  if (!user) {
    socket.disconnect(true);
    return;
  }
  const workspaceId = String(socket.handshake.query.workspaceId || defaultWorkspaceId);
  if (!workspaceMembers.some((member) => member.workspaceId === workspaceId && member.userId === user.user_id)) {
    socket.disconnect(true);
    return;
  }
  socket.join(`workspace:${workspaceId}`);
  socket.emit("presence:join", { workspaceId, userId: user.user_id });
  socket.emit("room:presence", { event: "snapshot", rooms: roomSnapshot(workspaceId) });

  socket.on("channel:join", (channelId: string) => socket.join(`channel:${channelId}`));
  socket.on("channel:leave", (channelId: string) => socket.leave(`channel:${channelId}`));
  socket.on("typing:start", (payload) => socket.to(`channel:${payload.channelId}`).emit("typing:start", { ...payload, userId: user.user_id }));
  socket.on("typing:stop", (payload) => socket.to(`channel:${payload.channelId}`).emit("typing:stop", { ...payload, userId: user.user_id }));
  socket.on("room:enter", ({ roomId }: { roomId: string }) => enterRoom(socket.id, workspaceId, roomId, user));
  socket.on("room:leave", ({ roomId }: { roomId: string }) => leaveRoom(socket.id, workspaceId, roomId));
  socket.on("disconnect", () => {
    io.to(`workspace:${workspaceId}`).emit("presence:leave", { workspaceId, userId: user.user_id });
    const timerKey = `${workspaceId}:${socket.id}`;
    disconnectGraceTimers.set(timerKey, setTimeout(() => {
      removeSocketFromPresence(socket.id, workspaceId);
      disconnectGraceTimers.delete(timerKey);
    }, 10000));
  });
});

// Public health check routes
app.get(["/health", "/api/health"], (_req, res) => res.json({ status: "ok", version: "1.0.0", timestamp: now() }));

app.use(["/api", "/tasks", "/notes", "/calendar", "/gmail", "/sessions", "/chat"], authMiddleware);

app.get("/api/workspaces", (req: AuthRequest, res) => {
  const ids = workspaceMembers.filter((m) => m.userId === req.user?.user_id).map((m) => m.workspaceId);
  res.json(workspaces.filter((w) => ids.includes(w.id)));
});

app.post("/api/workspaces", (req: AuthRequest, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  const workspace: Workspace = { id: makeId("ws"), name, createdAt: now(), ownerId: req.user!.user_id };
  const channel: Channel = { id: makeId("chan"), workspaceId: workspace.id, name: "general", createdAt: now(), createdBy: req.user!.user_id, linkedGithubRepo: null };
  workspaces.push(workspace);
  workspaceMembers.push({ workspaceId: workspace.id, userId: req.user!.user_id, role: "owner", joinedAt: now() });
  channels.push(channel);
  channelMembers.push({ channelId: channel.id, userId: req.user!.user_id, joinedAt: now() });
  rooms.push(
    { id: makeId("room"), workspaceId: workspace.id, name: "Design", createdAt: now() },
    { id: makeId("room"), workspaceId: workspace.id, name: "Standup", createdAt: now() },
    { id: makeId("room"), workspaceId: workspace.id, name: "Focus", createdAt: now() },
  );
  res.status(201).json({ workspace, defaultChannel: channel });
});

app.patch("/api/workspaces/:id", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const workspace = workspaces.find((w) => w.id === req.params.id)!;
  workspace.name = String(req.body.name || workspace.name).trim();
  res.json(workspace);
});

app.delete("/api/workspaces/:id", (req: AuthRequest, res) => {
  const workspace = workspaces.find((w) => w.id === req.params.id);
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  if (workspace.ownerId !== req.user?.user_id) return res.status(403).json({ error: "Only owners can delete workspaces" });
  if (workspace.id === defaultWorkspaceId) return res.status(400).json({ error: "Personal workspace cannot be deleted" });
  workspaces = workspaces.filter((w) => w.id !== workspace.id);
  workspaceMembers = workspaceMembers.filter((m) => m.workspaceId !== workspace.id);
  const removedChannels = channels.filter((c) => c.workspaceId === workspace.id).map((c) => c.id);
  const removedRooms = rooms.filter((r) => r.workspaceId === workspace.id).map((r) => r.id);
  channels = channels.filter((c) => c.workspaceId !== workspace.id);
  rooms = rooms.filter((r) => r.workspaceId !== workspace.id);
  channelMembers = channelMembers.filter((m) => !removedChannels.includes(m.channelId));
  teamMessages = teamMessages.filter((m) => !removedChannels.includes(m.channelId));
  removedRooms.forEach((roomId) => roomPresence.delete(roomId));
  res.json({ result: "ok" });
});

app.get("/api/workspaces/:id/rooms", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json(rooms.filter((room) => room.workspaceId === req.params.id));
});

app.post("/api/workspaces/:id/rooms", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  const room: Room = { id: makeId("room"), workspaceId: req.params.id, name, createdAt: now() };
  rooms.push(room);
  res.status(201).json(room);
});

app.patch("/api/rooms/:roomId", (req: AuthRequest, res) => {
  const room = roomForRequest(req, res);
  if (!room) return;
  room.name = String(req.body.name || room.name).trim();
  res.json(room);
});

app.delete("/api/rooms/:roomId", (req: AuthRequest, res) => {
  const room = roomForRequest(req, res);
  if (!room) return;
  rooms = rooms.filter((candidate) => candidate.id !== room.id);
  roomPresence.delete(room.id);
  broadcastRoomPresence(room.workspaceId, room.id, "leave");
  res.json({ result: "ok" });
});

app.get("/api/workspaces/:id/presence/rooms", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json({ rooms: roomSnapshot(req.params.id), generatedAt: now() });
});

/*
Meeting transcript webhook contract.
External bot/service POSTs JSON to /api/webhooks/meeting-transcript:
{
  "eventType": "chunk",
  "workspaceId": "ws_123",
  "meetingId": "meet_2026_09_16_design",
  "speaker": "Raj",
  "text": "I can follow up on the API contract today.",
  "timestamp": "2026-09-16T10:32:00.000Z"
}
To end a meeting, send { "eventType": "end", "workspaceId": "...", "meetingId": "..." }.
Audio capture, bot auth, and speech-to-text are intentionally out of scope here.
*/
app.post("/api/webhooks/meeting-transcript", async (req: Request, res: Response) => {
  const validation = validateMeetingWebhookPayload(req.body);
  if (!validation.ok) {
    console.warn("Skipped malformed meeting webhook payload:", validation.reason, req.body);
    return res.status(202).json({ accepted: false, skipped: true, reason: validation.reason });
  }

  const { payload } = validation;
  if (!workspaceMembers.some((member) => member.workspaceId === payload.workspaceId)) {
    console.warn("Skipped meeting webhook for unknown workspace:", payload.workspaceId);
    return res.status(202).json({ accepted: false, skipped: true, reason: "Unknown workspace" });
  }

  const transcript = getOrCreateTranscript(payload.workspaceId, payload.meetingId);
  if (payload.eventType === "chunk") {
    transcript.chunks.push({ speaker: payload.speaker!, text: payload.text!, timestamp: payload.timestamp! });
    const version = await summarizeTranscript(transcript);
    io.to(`workspace:${payload.workspaceId}`).emit("meeting:chunk", { transcript });
    return res.status(202).json({ accepted: true, transcriptId: transcript.id, summarized: !!version });
  }

  transcript.endedAt = transcript.endedAt || now();
  const version = await summarizeTranscript(transcript, true);
  return res.status(202).json({ accepted: true, transcriptId: transcript.id, ended: true, summarized: !!version });
});

app.get("/api/workspaces/:id/meeting-transcripts", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json({
    transcripts: meetingTranscripts.filter((transcript) => transcript.workspaceId === req.params.id),
  });
});

app.get("/api/meeting-transcripts/:transcriptId", (req: AuthRequest, res) => {
  const transcript = meetingTranscripts.find((item) => item.id === req.params.transcriptId && item.workspaceId === req.workspace?.id);
  if (!transcript) return res.status(404).json({ error: "Meeting transcript not found" });
  res.json(transcript);
});

app.post("/api/workspaces/:id/standup-entries", async (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const content = String(req.body.content || "").trim();
  const date = String(req.body.date || todayIsoDate()).slice(0, 10);
  if (!content) return res.status(400).json({ error: "Content is required" });
  const entry: StandupEntry = {
    id: makeId("standup"),
    workspaceId: req.params.id,
    userId: req.user!.user_id,
    userName: req.user!.name,
    date,
    content,
    createdAt: now(),
  };
  standupEntries.push(entry);
  // Best-effort NLP classification: false negatives/positives are expected, and UI labels this as inferred.
  const extractedBlockers = await extractBlockersForStandup(entry);
  io.to(`workspace:${req.params.id}`).emit("standup:entry", { entry });
  res.status(201).json({ ...entry, extractedBlockers });
});

app.get("/api/workspaces/:id/standup-entries", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const date = String(req.query.date || todayIsoDate()).slice(0, 10);
  const entries = standupEntries.filter((entry) => entry.workspaceId === req.params.id && entry.date === date);
  res.json({ entries, count: entries.length });
});

app.post("/api/workspaces/:id/standup-digests", async (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const date = String(req.body.date || todayIsoDate()).slice(0, 10);
  const digest = await generateStandupDigest(req.params.id, date);
  if (!digest) return res.status(404).json({ error: "No standup entries found for date" });
  res.status(201).json(digest);
});

app.get("/api/workspaces/:id/standup-digests", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const date = req.query.date ? String(req.query.date).slice(0, 10) : null;
  const digests = standupDigests.filter((digest) => digest.workspaceId === req.params.id && (!date || digest.date === date));
  res.json({ digests });
});

app.get("/api/workspaces/:id/blockers", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const rank = { blocking: 0, "at-risk": 1, unclassified: 2, fyi: 3 };
  const includeResolved = req.query.includeResolved === "true";
  const items = blockers
    .filter((blocker) => blocker.workspaceId === req.params.id && (includeResolved || blocker.status === "active"))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || a.createdAt.localeCompare(b.createdAt));
  res.json({ blockers: items });
});

app.patch("/api/blockers/:blockerId/resolve", (req: AuthRequest, res) => {
  const blocker = blockers.find((item) => item.id === req.params.blockerId && item.workspaceId === req.workspace?.id);
  if (!blocker) return res.status(404).json({ error: "Blocker not found" });
  blocker.status = "resolved";
  blocker.resolvedAt = now();
  res.json(blocker);
});

app.get("/api/workspaces/:id/action-items", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json({ actionItems: actionItems.filter((item) => item.workspaceId === req.params.id) });
});

app.patch("/api/action-items/:actionItemId/confirm", (req: AuthRequest, res) => {
  const item = actionItems.find((candidate) => candidate.id === req.params.actionItemId && candidate.workspaceId === req.workspace?.id);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  item.confirmedOwnerId = req.user!.user_id;
  item.status = "confirmed";
  res.json(item);
});

app.patch("/api/action-items/:actionItemId/reassign", (req: AuthRequest, res) => {
  const item = actionItems.find((candidate) => candidate.id === req.params.actionItemId && candidate.workspaceId === req.workspace?.id);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  const userId = String(req.body.userId || "").trim();
  if (!workspaceMembers.some((member) => member.workspaceId === item.workspaceId && member.userId === userId)) return res.status(400).json({ error: "New owner must be a workspace member" });
  item.suggestedOwnerId = userId;
  item.confirmedOwnerId = null;
  item.status = "suggested";
  res.json(item);
});

app.patch("/api/action-items/:actionItemId/status", (req: AuthRequest, res) => {
  const item = actionItems.find((candidate) => candidate.id === req.params.actionItemId && candidate.workspaceId === req.workspace?.id);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  const status = String(req.body.status || "");
  if (status === "done" && !item.confirmedOwnerId) return res.status(409).json({ error: "A human must confirm ownership before an item can be marked done" });
  if (status !== "done" && status !== "confirmed" && status !== "suggested") return res.status(400).json({ error: "Invalid status" });
  if (status === "confirmed" && !item.confirmedOwnerId) return res.status(409).json({ error: "Use confirm endpoint to confirm human ownership" });
  item.status = status as ActionItem["status"];
  res.json(item);
});

app.patch("/api/users/me/timezone", (req: AuthRequest, res) => {
  const timezone = String(req.body.timezone || "").trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    return res.status(400).json({ error: "Invalid IANA timezone" });
  }
  req.user!.timezone = timezone;
  userPreferences.timezone = timezone;
  userPreferences.updated_at = now();
  res.json({ user: req.user, timezone });
});

app.post("/api/workspaces/:id/schedule/suggestions", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const durationMinutes = Math.max(15, Math.min(480, Number(req.body.durationMinutes || 30)));
  const requestedParticipants = Array.isArray(req.body.participantIds) && req.body.participantIds.length ? req.body.participantIds.map(String) : [req.user!.user_id];
  const members = workspaceMembers.filter((member) => member.workspaceId === req.params.id && requestedParticipants.includes(member.userId));
  const participants: SchedulingParticipant[] = members.map((member) => {
    const isCurrent = member.userId === req.user!.user_id;
    return {
      userId: member.userId,
      timezone: isCurrent ? (req.user!.timezone || userPreferences.timezone || "UTC") : "UTC",
      workingHours: userPreferences.working_hours,
      busyRanges: isCurrent ? getWorkspaceScoped(events, req).map((event) => ({ start: event.start, end: event.end })) : [],
    };
  });
  const suggestions = findCandidateMeetingSlots(participants, durationMinutes, {
    searchStart: req.body.searchStart || now(),
    days: Number(req.body.days || 7),
    stepMinutes: 30,
  });
  res.json({ suggestions, participants });
});

app.get("/api/workspaces/:id/meeting-requests", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json({ requests: meetingRequests.filter((request) => request.workspaceId === req.params.id).reverse() });
});

app.post("/api/workspaces/:id/meeting-requests", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const recipient = String(req.body.recipient || "").trim();
  const reason = String(req.body.reason || "").trim();
  const proposedStart = String(req.body.proposedStart || "").trim();
  const proposedEnd = String(req.body.proposedEnd || "").trim();
  const durationMinutes = Number(req.body.durationMinutes || 30);
  if (!recipient || !reason || !proposedStart || !proposedEnd) return res.status(400).json({ error: "Recipient, reason, and proposed time are required" });
  const request: MeetingRequest = {
    id: makeId("meeting_request"),
    workspaceId: req.params.id,
    requesterId: req.user!.user_id,
    requesterName: req.user!.name,
    recipient,
    reason,
    durationMinutes,
    proposedStart,
    proposedEnd,
    status: "pending",
    comment: "",
    createdAt: now(),
  };
  meetingRequests.push(request);
  res.status(201).json(request);
});

app.patch("/api/meeting-requests/:id", (req: AuthRequest, res) => {
  const request = meetingRequests.find((candidate) => candidate.id === req.params.id && candidate.workspaceId === req.workspace?.id);
  if (!request) return res.status(404).json({ error: "Meeting request not found" });
  const status = String(req.body.status || request.status);
  if (!["pending", "accepted", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid request status" });
  request.status = status as MeetingRequest["status"];
  if (req.body.comment !== undefined) request.comment = String(req.body.comment).trim();

  // Create Google Meet link and calendar event automatically when accepted
  if (status === "accepted" && !request.meet_link) {
    const meetCode = `${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
    const meetLink = `https://meet.google.com/${meetCode}`;
    request.meet_link = meetLink;
    const event = {
      id: makeId("evt"),
      summary: `Meeting: ${request.reason || "Team Sync"}`,
      start: request.proposedStart || now(),
      end: request.proposedEnd || new Date(new Date(request.proposedStart || now()).getTime() + (request.durationMinutes || 30) * 60000).toISOString(),
      location: "Google Meet",
      description: `Accepted meeting request with ${request.recipient}. Reason: ${request.reason}`,
      meet_link: meetLink,
      attendees: [currentUser.email, request.recipient],
      workspaceId: req.workspace!.id,
    };
    events.unshift(event);
  }

  res.json(request);
});

app.get("/api/workspaces/:id/members", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json(workspaceMembers.filter((m) => m.workspaceId === req.params.id));
});

app.post("/api/workspaces/:id/members", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const userId = String(req.body.userId || "").trim();
  const role = String(req.body.role || "member");
  if (!userId || !isValidRole(role)) return res.status(400).json({ error: "Valid userId and role are required" });
  if (workspaceMembers.some((m) => m.workspaceId === req.params.id && m.userId === userId)) return res.status(409).json({ error: "Member already exists" });
  const member: WorkspaceMember = { workspaceId: req.params.id, userId, role, joinedAt: now() };
  workspaceMembers.push(member);
  res.status(201).json(member);
});

app.patch("/api/workspaces/:id/members/:userId", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const role = String(req.body.role || "");
  if (!isValidRole(role)) return res.status(400).json({ error: "Valid role is required" });
  const member = workspaceMembers.find((m) => m.workspaceId === req.params.id && m.userId === req.params.userId);
  if (!member) return res.status(404).json({ error: "Member not found" });
  member.role = role;
  res.json(member);
});

app.delete("/api/workspaces/:id/members/:userId", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  workspaceMembers = workspaceMembers.filter((m) => !(m.workspaceId === req.params.id && m.userId === req.params.userId));
  res.json({ result: "ok" });
});

app.get("/api/workspaces/:id/channels", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  res.json(channels.filter((c) => c.workspaceId === req.params.id));
});

app.post("/api/workspaces/:id/channels", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  const linkedGithubRepo = req.body.linkedGithubRepo ? String(req.body.linkedGithubRepo).trim() : null;
  if (linkedGithubRepo && !isValidRepo(linkedGithubRepo)) return res.status(400).json({ error: "linkedGithubRepo must be owner/repo" });
  const channel: Channel = { id: makeId("chan"), workspaceId: req.params.id, name, createdAt: now(), createdBy: req.user!.user_id, linkedGithubRepo };
  channels.push(channel);
  channelMembers.push({ channelId: channel.id, userId: req.user!.user_id, joinedAt: now() });
  res.status(201).json(channel);
});

app.patch("/api/channels/:channelId", (req: AuthRequest, res) => {
  const channel = channelForRequest(req, res);
  if (!channel) return;
  if (req.body.name !== undefined) channel.name = String(req.body.name).trim() || channel.name;
  if (req.body.linkedGithubRepo !== undefined) {
    const repo = String(req.body.linkedGithubRepo || "").trim();
    if (repo && !isValidRepo(repo)) return res.status(400).json({ error: "linkedGithubRepo must be owner/repo" });
    channel.linkedGithubRepo = repo || null;
  }
  res.json(channel);
});

app.delete("/api/channels/:channelId", (req: AuthRequest, res) => {
  const channel = channelForRequest(req, res);
  if (!channel) return;
  channels = channels.filter((c) => c.id !== channel.id);
  channelMembers = channelMembers.filter((m) => m.channelId !== channel.id);
  teamMessages = teamMessages.filter((m) => m.channelId !== channel.id);
  res.json({ result: "ok" });
});

app.get("/api/channels/:channelId/members", (req: AuthRequest, res) => {
  if (!channelForRequest(req, res)) return;
  res.json(channelMembers.filter((m) => m.channelId === req.params.channelId));
});

app.post("/api/channels/:channelId/members", (req: AuthRequest, res) => {
  if (!channelForRequest(req, res)) return;
  const userId = String(req.body.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (channelMembers.some((m) => m.channelId === req.params.channelId && m.userId === userId)) return res.status(409).json({ error: "Channel member already exists" });
  const member: ChannelMember = { channelId: req.params.channelId, userId, joinedAt: now() };
  channelMembers.push(member);
  res.status(201).json(member);
});

app.delete("/api/channels/:channelId/members/:userId", (req: AuthRequest, res) => {
  if (!channelForRequest(req, res)) return;
  channelMembers = channelMembers.filter((m) => !(m.channelId === req.params.channelId && m.userId === req.params.userId));
  res.json({ result: "ok" });
});

app.get("/api/channels/:channelId/messages", (req: AuthRequest, res) => {
  if (!channelForRequest(req, res)) return;
  const limit = Math.min(parseInt(String(req.query.limit || "50"), 10), 100);
  const before = req.query.before ? Date.parse(String(req.query.before)) : Number.POSITIVE_INFINITY;
  const messages = teamMessages.filter((m) => m.channelId === req.params.channelId && Date.parse(m.createdAt) < before).slice(-limit);
  res.json({ messages, count: messages.length });
});

app.post("/api/channels/:channelId/messages", async (req: AuthRequest, res) => {
  const channel = channelForRequest(req, res);
  if (!channel) return;
  const content = String(req.body.content || "").trim();
  if (!content) return res.status(400).json({ error: "Content is required" });
  const message: TeamMessage = {
    id: makeId("msg"),
    channelId: channel.id,
    authorId: req.user!.user_id,
    authorName: req.user!.name,
    content,
    createdAt: now(),
    editedAt: null,
    mentions: await parseMentions(content, channel),
  };
  teamMessages.push(message);
  io.to(`channel:${channel.id}`).emit("message:new", message);
  res.status(201).json(message);
});

app.patch("/api/channels/:channelId/messages/:messageId", async (req: AuthRequest, res) => {
  const channel = channelForRequest(req, res);
  if (!channel) return;
  const message = teamMessages.find((m) => m.id === req.params.messageId && m.channelId === channel.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (message.authorId !== req.user?.user_id) return res.status(403).json({ error: "Only the author can edit this message" });
  message.content = String(req.body.content || message.content).trim();
  message.editedAt = now();
  message.mentions = await parseMentions(message.content, channel);
  io.to(`channel:${channel.id}`).emit("message:edit", message);
  res.json(message);
});

app.delete("/api/channels/:channelId/messages/:messageId", (req: AuthRequest, res) => {
  const channel = channelForRequest(req, res);
  if (!channel) return;
  const message = teamMessages.find((m) => m.id === req.params.messageId && m.channelId === channel.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (message.authorId !== req.user?.user_id) return res.status(403).json({ error: "Only the author can delete this message" });
  teamMessages = teamMessages.filter((m) => m.id !== message.id);
  io.to(`channel:${channel.id}`).emit("message:delete", { id: message.id, channelId: channel.id });
  res.json({ result: "ok" });
});

app.get("/api/workspaces/:id/github", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const connection = githubConnections.find((c) => c.workspaceId === req.params.id);
  res.json({ connected: !!connection, updatedAt: connection?.updatedAt || null });
});

app.put("/api/workspaces/:id/github", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  const token = String(req.body.token || "").trim();
  if (!token) return res.status(400).json({ error: "GitHub token is required" });
  githubConnections = githubConnections.filter((c) => c.workspaceId !== req.params.id);
  githubConnections.push({ workspaceId: req.params.id, encryptedToken: encryptToken(token), updatedAt: now() });
  res.json({ connected: true, updatedAt: now() });
});

app.delete("/api/workspaces/:id/github", (req: AuthRequest, res) => {
  if (!requireWorkspaceMembership(req, res)) return;
  githubConnections = githubConnections.filter((c) => c.workspaceId !== req.params.id);
  res.json({ connected: false });
});

const handleLogin = (req: Request, res: Response) => {
  const token = `cowork_token_${Date.now()}`;
  const email = (req.body?.email as string) || (req.query?.email as string) || currentUser.email;
  const name = (req.body?.name as string) || (req.query?.name as string) || currentUser.name;
  const user = upsertUser(email, name);
  if (!workspaceMembers.some((member) => member.workspaceId === defaultWorkspaceId && member.userId === user.user_id)) {
    workspaceMembers.push({ workspaceId: defaultWorkspaceId, userId: user.user_id, role: "member", joinedAt: now() });
    channelMembers.push({ channelId: defaultChannelId, userId: user.user_id, joinedAt: now() });
  }
  authTokens.set(token, user.user_id);
  res.json({ success: true, token, user, authorization_url: `/?auth_success=true#access_token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`, state: "cowork_active_state" });
};

app.get("/auth/login", handleLogin);
app.post("/auth/login", handleLogin);
app.get("/auth/me", (req, res) => {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  const user = userFromToken(token);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  res.json(user);
});
app.post("/auth/logout", (req, res) => {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  if (token) authTokens.delete(token);
  res.json({ status: "ok" });
});

app.post("/sessions", (req: AuthRequest, res) => {
  const sessionId = makeId("session");
  const session: ChatSession = { session_id: sessionId, title: "New Conversation", created_at: now(), updated_at: now(), messages: [{ role: "assistant", content: "Hello! I am Co-Work. How can I assist?", timestamp: now() }], workspaceId: req.workspace!.id };
  sessions.set(sessionId, session);
  res.json({ session_id: sessionId });
});

app.get("/sessions", (req: AuthRequest, res) => {
  const limit = parseInt(String(req.query.limit || "10"), 10);
  const sessionList = Array.from(sessions.values()).filter((s) => s.workspaceId === req.workspace?.id).map((s) => ({ session_id: s.session_id, title: s.title, created_at: s.created_at, updated_at: s.updated_at, last_message: s.messages.at(-1)?.content || "" })).reverse().slice(0, limit);
  res.json({ sessions: sessionList, count: sessionList.length });
});

app.delete("/sessions/:id", (req: AuthRequest, res) => {
  const session = sessions.get(req.params.id);
  if (session?.workspaceId === req.workspace?.id) sessions.delete(req.params.id);
  res.json({ result: "ok", message: "Session deleted" });
});

app.get("/chat/sessions/:id", (req: AuthRequest, res) => {
  const session = sessions.get(req.params.id);
  if (!session || session.workspaceId !== req.workspace?.id) return res.json({ session_id: req.params.id, messages: [], count: 0 });
  res.json({ session_id: session.session_id, messages: session.messages, count: session.messages.length });
});

const geminiTools = [
  {
    functionDeclarations: [
      {
        name: "send_email",
        description: "Draft and prepare to send an email via Gmail. Requires user confirmation before sending.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            to: { type: "STRING" as const, description: "Recipient email address(es)" },
            subject: { type: "STRING" as const, description: "Email subject line" },
            body: { type: "STRING" as const, description: "Email body content" },
            cc: { type: "STRING" as const, description: "Optional CC email addresses" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "create_calendar_event",
        description: "Schedule a calendar event or meeting with an optional Google Meet link. Requires user confirmation before creation.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            summary: { type: "STRING" as const, description: "Title of the calendar event or meeting" },
            start_time: { type: "STRING" as const, description: "Start time (ISO string or readable date/time)" },
            end_time: { type: "STRING" as const, description: "End time (ISO string or readable date/time)" },
            description: { type: "STRING" as const, description: "Meeting description or agenda" },
            attendees: { type: "ARRAY" as const, items: { type: "STRING" as const }, description: "Attendee email addresses" },
            add_google_meet: { type: "BOOLEAN" as const, description: "Whether to create a Google Meet conference link (default true)" },
          },
          required: ["summary", "start_time"],
        },
      },
    ],
  },
];

function extractActionIntent(text: string): { tool: string; args: any } | null {
  const lower = text.toLowerCase();

  // 1. Email detection
  const isEmailIntent =
    lower.includes("send email") ||
    lower.includes("send an email") ||
    lower.startsWith("email ") ||
    lower.includes("compose email") ||
    lower.includes("write an email");

  if (isEmailIntent) {
    const directEmailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const personMatch = text.match(/(?:to|emailing)\s+([A-Za-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    let to = directEmailMatch ? directEmailMatch[1] : (personMatch ? personMatch[1].trim() : "sarah.chen@techcorp.io");
    if (!to.includes("@")) to = `${to.toLowerCase().replace(/\s+/g, ".")}@techcorp.io`;

    let subject = "Workspace Update & Follow-up";
    if (lower.includes("about ")) {
      const parts = text.split(/about /i)[1]?.split(/[.\n,;]/);
      if (parts && parts[0]?.trim()) subject = parts[0].trim();
    } else if (lower.includes("subject: ")) {
      subject = text.split(/subject:\s*/i)[1]?.split(/[.\n]/)[0]?.trim() || subject;
    }

    let body = "Hi,\n\nFollowing up regarding our workspace discussions.\n\nBest,\nAdhithiya";
    if (lower.includes("saying ")) {
      body = text.split(/saying /i)[1]?.trim() || body;
    } else if (lower.includes("that ")) {
      body = text.split(/that /i)[1]?.trim() || body;
    }

    return {
      tool: "send_email",
      args: { to, subject, body },
    };
  }

  // 2. Calendar / Google Meet detection
  const isCalendarIntent =
    lower.includes("schedule") ||
    lower.includes("meeting") ||
    lower.includes("calendar event") ||
    lower.includes("google meet") ||
    lower.includes("meet link") ||
    lower.includes("set up a sync") ||
    lower.includes("sync with");

  if (isCalendarIntent) {
    let summary = "Executive Sync & Review";
    if (lower.includes("standup")) summary = "Daily Team Standup";
    else if (lower.includes("sprint")) summary = "Sprint Planning & Review";
    else if (lower.includes("design")) summary = "Design System Review";
    else if (lower.includes("sync with")) {
      const match = text.match(/sync with\s+([A-Za-z0-9\s]+?)(?:\s+at|\s+tomorrow|\s+today|\.|$)/i);
      if (match) summary = `Sync with ${match[1].trim()}`;
    }

    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const personMatch = text.match(/(?:with|invite)\s+([A-Za-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    let attendee = emailMatch ? emailMatch[1] : (personMatch ? personMatch[1].trim() : "sarah.chen@techcorp.io");
    if (!attendee.includes("@")) attendee = `${attendee.toLowerCase().replace(/\s+/g, ".")}@techcorp.io`;

    let start = new Date(Date.now() + 86400000);
    start.setHours(10, 0, 0, 0);
    if (lower.includes("today")) {
      start = new Date(Date.now() + 7200000);
    }
    const end = new Date(start.getTime() + 30 * 60000);

    return {
      tool: "create_calendar_event",
      args: {
        summary,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        description: `Scheduled via Co-Work AI Assistant with ${attendee}. Google Meet video conference attached.`,
        attendees: [currentUser.email, attendee],
        add_google_meet: true,
      },
    };
  }

  return null;
}

app.post("/chat", upload.any(), async (req: AuthRequest, res) => {
  const message = req.body.message || "";
  let sessionId = req.body.session_id;
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = makeId("session");
    sessions.set(sessionId, { session_id: sessionId, title: message ? message.slice(0, 30) : "New Conversation", created_at: now(), updated_at: now(), messages: [], workspaceId: req.workspace!.id });
  }
  const session = sessions.get(sessionId)!;
  session.messages.push({ role: "user", content: message, timestamp: now() });
  session.updated_at = now();
  const githubContext = githubContextForWorkspace(req.workspace!.id);

  let replyText = "I have received your request and processed it across your workspace.";
  let toolProposal: any = null;

  const ai = getGemini();
  if (ai) {
    try {
      const promptContext = `You are Co-Work, a proactive Chief of Staff AI assistant. Current workspace: ${req.workspace!.name}. Recent resolved GitHub mentions: ${JSON.stringify(githubContext)}. Pending tasks: ${getWorkspaceScoped(tasks, req).filter((t) => !t.is_completed).map((t) => t.title).join(", ")}. When the user wants to send an email or schedule a meeting/calendar event with Google Meet, call the corresponding tool.`;
      const contents = session.messages.slice(-8).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: promptContext,
          tools: geminiTools,
        },
      });

      const calls = (result as any).functionCalls;
      if (calls && calls.length > 0) {
        const call = calls[0];
        toolProposal = {
          id: makeId("tool"),
          tool: call.name,
          args: call.args,
          status: "pending",
          integration: "mock_demo_mode",
        };
        if (call.name === "send_email") {
          replyText = `I have drafted an email for **${call.args.to}**. Please review the details below and confirm to send.`;
        } else if (call.name === "create_calendar_event") {
          replyText = `I have set up the calendar event **${call.args.summary}** with a Google Meet conference link. Please review the details below and confirm.`;
        }
      } else {
        replyText = result.text || replyText;
      }
    } catch (err) {
      console.error("Gemini API call failed, using intelligent fallback parser:", err);
    }
  }

  // Fallback intent extraction if Gemini was not available or didn't return a function call
  if (!toolProposal) {
    const detected = extractActionIntent(message);
    if (detected) {
      toolProposal = {
        id: makeId("tool"),
        tool: detected.tool,
        args: detected.args,
        status: "pending",
        integration: "mock_demo_mode",
      };
      if (detected.tool === "send_email") {
        replyText = `I have prepared the email draft to **${detected.args.to}**. Please review the confirmation preview below before sending.`;
      } else if (detected.tool === "create_calendar_event") {
        replyText = `I have prepared the meeting invitation for **${detected.args.summary}** with Google Meet attached. Please confirm below to schedule.`;
      }
    }
  }

  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: replyText,
    timestamp: now(),
    metadata: { githubContext },
    tool_proposal: toolProposal,
  };
  session.messages.push(assistantMsg);

  res.json({
    response: replyText,
    session_id: sessionId,
    tool_proposal: toolProposal,
    requires_confirmation: !!toolProposal,
    suggestions: ["Review today's schedule", "Check unread emails", "Add a high-priority task"],
    execution_success: true,
  });
});

app.post("/chat/confirm-tool", (req: AuthRequest, res) => {
  const { session_id, tool_id, action, tool, args } = req.body;
  const session = session_id ? sessions.get(session_id) : undefined;

  if (action === "cancel") {
    if (session) {
      session.messages.push({
        role: "assistant",
        content: `Action cancelled by user. No emails or calendar events were created.`,
        timestamp: now(),
      });
    }
    return res.json({ status: "cancelled", message: "Action cancelled by user." });
  }

  if (action === "confirm") {
    let result: any = {};

    if (tool === "send_email") {
      const recipients = Array.isArray(args.to) ? args.to : [String(args.to || currentUser.email)];
      const email = {
        id: makeId("mail"),
        from: `${currentUser.name} <${currentUser.email}>`,
        subject: args.subject || "No Subject",
        snippet: String(args.body || "").slice(0, 80),
        body_text: args.body || "",
        body_html: `<p>${String(args.body || "").replace(/\n/g, "<br/>")}</p>`,
        is_unread: false,
        date: now(),
        workspaceId: req.workspace!.id,
      };
      emails.unshift(email);
      result = {
        id: email.id,
        to: recipients,
        subject: email.subject,
        message: `Email sent to ${recipients.join(", ")} successfully! (Workspace Simulation Mode)`,
      };
      if (session) {
        session.messages.push({
          role: "assistant",
          content: `✅ **Email Sent**: Successfully sent "${email.subject}" to ${recipients.join(", ")}.`,
          timestamp: now(),
        });
      }
    } else if (tool === "create_calendar_event" || tool === "schedule_meeting_with_meet") {
      const meetCode = `${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
      const meetLink = `https://meet.google.com/${meetCode}`;
      const summary = args.summary || args.title || "Team Meeting";
      const start = args.start_time || now();
      const end = args.end_time || new Date(new Date(start).getTime() + 30 * 60000).toISOString();
      const attendees = args.attendees || (args.recipient ? [currentUser.email, args.recipient] : [currentUser.email]);

      const event = {
        id: makeId("evt"),
        summary,
        start,
        end,
        location: "Google Meet",
        description: args.description || args.reason || "Scheduled via Co-Work AI Assistant",
        meet_link: meetLink,
        attendees: Array.isArray(attendees) ? attendees : [attendees],
        workspaceId: req.workspace!.id,
      };
      events.unshift(event);
      result = {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        meet_link: meetLink,
        attendees: event.attendees,
        message: `Meeting "${event.summary}" scheduled with Google Meet link: ${meetLink}`,
      };
      if (session) {
        session.messages.push({
          role: "assistant",
          content: `✅ **Calendar Event Created**: "${event.summary}" scheduled for ${new Date(event.start).toLocaleString()}.\n\n📹 **Google Meet**: [${meetLink}](${meetLink})`,
          timestamp: now(),
        });
      }
    }

    return res.json({ status: "executed", tool, result });
  }

  res.status(400).json({ error: "Invalid action type" });
});

app.get("/calendar/events", (req: AuthRequest, res) => {
  const query = String(req.query.query || "").toLowerCase();
  let filtered = getWorkspaceScoped(events, req);
  if (query) filtered = filtered.filter((e) => e.summary.toLowerCase().includes(query) || e.description.toLowerCase().includes(query));
  res.json({ events: filtered, count: filtered.length });
});

app.post("/calendar/events", (req: AuthRequest, res) => {
  const event = { id: makeId("evt"), summary: req.body.summary || "New Meeting", start: req.body.start_time || req.body.start || now(), end: req.body.end_time || req.body.end || new Date(Date.now() + 3600000).toISOString(), location: req.body.location || "Virtual", description: req.body.description || "", meet_link: req.body.add_google_meet ? "https://meet.google.com/zen-meet-new" : "", attendees: req.body.attendees || [currentUser.email], workspaceId: req.workspace!.id };
  events.unshift(event);
  res.json(event);
});

app.post("/calendar/quick-add", (req: AuthRequest, res) => {
  const event = { id: makeId("evt"), summary: req.body.text || "Meeting", start: new Date(Date.now() + 3600000).toISOString(), end: new Date(Date.now() + 7200000).toISOString(), location: "Google Meet", description: `Quick added: "${req.body.text || "Meeting"}"`, meet_link: "https://meet.google.com/zen-meet-quick", attendees: [currentUser.email], workspaceId: req.workspace!.id };
  events.unshift(event);
  res.json(event);
});

app.get("/tasks", (req: AuthRequest, res) => {
  const showCompleted = req.query.show_completed === "true";
  const filtered = getWorkspaceScoped(tasks, req).filter((t) => showCompleted || !t.is_completed);
  res.json({ tasks: filtered, count: filtered.length });
});

app.post("/tasks", (req: AuthRequest, res) => {
  const task = { id: makeId("task"), title: req.body.title || "Untitled Task", notes: req.body.notes || "", due: req.body.due_date || req.body.due || new Date(Date.now() + 86400000).toISOString(), is_completed: false, created_at: now(), workspaceId: req.workspace!.id };
  tasks.unshift(task);
  res.json(task);
});

app.patch("/tasks/:id/complete", (req: AuthRequest, res) => {
  const task = getWorkspaceScoped(tasks, req).find((t) => t.id === req.params.id);
  if (task) task.is_completed = true;
  res.json(task || {});
});

app.patch("/tasks/:id/uncomplete", (req: AuthRequest, res) => {
  const task = getWorkspaceScoped(tasks, req).find((t) => t.id === req.params.id);
  if (task) task.is_completed = false;
  res.json(task || {});
});

app.post("/tasks/reminder", (req: AuthRequest, res) => {
  const task = { id: makeId("task"), title: req.body.title || "Reminder", notes: req.body.notes || "", due: req.body.remind_at || now(), is_completed: false, created_at: now(), workspaceId: req.workspace!.id };
  tasks.unshift(task);
  res.json(task);
});

app.post("/tasks/edit", (req, res) => res.json({ status: "success", task_payload: { title: req.body.title, description: req.body.description || null, due: req.body.due || null } }));

app.get("/notes", (req: AuthRequest, res) => {
  const limit = parseInt(String(req.query.limit || "20"), 10);
  const source = req.query.source as string;
  let filtered = getWorkspaceScoped(notes, req);
  if (source) filtered = filtered.filter((n) => n.source === source);
  res.json({ notes: filtered.slice(0, limit), count: filtered.length });
});

app.post("/notes", (req: AuthRequest, res) => {
  const note = { note_id: makeId("note"), title: req.body.title || "Untitled Note", content: req.body.content || "", tags: req.body.tags || ["general"], source: req.body.source || "user", created_at: now(), updated_at: now(), workspaceId: req.workspace!.id };
  notes.unshift(note);
  res.json(note);
});

app.post("/notes/search", (req: AuthRequest, res) => {
  const q = String(req.body.query || "").toLowerCase();
  const filtered = getWorkspaceScoped(notes, req).filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)));
  res.json({ notes: filtered, count: filtered.length });
});

app.get("/gmail/messages", (req: AuthRequest, res) => {
  const maxResults = parseInt(String(req.query.max_results || "10"), 10);
  const q = String(req.query.query || "").toLowerCase();
  let filtered = getWorkspaceScoped(emails, req);
  if (q) filtered = filtered.filter((e) => e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q));
  res.json({ emails: filtered.slice(0, maxResults), count: filtered.length });
});

app.get("/gmail/messages/:id", (req: AuthRequest, res) => {
  const email = getWorkspaceScoped(emails, req).find((e) => e.id === req.params.id);
  if (!email) return res.status(404).json({ error: "Email not found" });
  res.json(email);
});

app.post("/gmail/send", (req: AuthRequest, res) => {
  const email = { id: makeId("mail"), from: `${currentUser.name} <${currentUser.email}>`, subject: req.body.subject || "No Subject", snippet: String(req.body.body || "").slice(0, 80), body_text: req.body.body || "", body_html: req.body.html_body || `<p>${req.body.body || ""}</p>`, is_unread: false, date: now(), workspaceId: req.workspace!.id };
  emails.unshift(email);
  res.json({ status: "sent", id: email.id });
});

app.get("/agent/briefing", (req: AuthRequest, res) => {
  const scopedTasks = getWorkspaceScoped(tasks, req);
  const scopedEvents = getWorkspaceScoped(events, req);
  const scopedEmails = getWorkspaceScoped(emails, req);
  res.json({ status: "ready", title: "Daily Catch-Up Briefing", content: `Good morning! You have ${scopedEvents.length} events, ${scopedTasks.filter((t) => !t.is_completed).length} active tasks, and ${scopedEmails.filter((e) => e.is_unread).length} unread messages.`, metadata: { task_count: scopedTasks.length, event_count: scopedEvents.length, unread_count: scopedEmails.filter((e) => e.is_unread).length, last_updated: now() } });
});

app.get("/preferences", (_req, res) => res.json({ preferences: userPreferences, updated_at: userPreferences.updated_at }));
app.patch("/preferences", (req, res) => {
  userPreferences = { ...userPreferences, ...req.body, updated_at: now() };
  res.json({ preferences: userPreferences, updated_at: userPreferences.updated_at });
});

app.get("/insights/priority-feed", (_req, res) => {
  res.json({ status: "ready", items: [{ id: "feed_1", type: "email_action", action_type: "reply", ui_actions: ["reply", "task", "ignore"], title: "Action Required: Q3 Product Roadmap Feedback", from: "Sarah Chen <sarah.chen@techcorp.io>", summary: "Sarah needs your input before 3:00 PM today.", reason: "High priority deliverable", draft_reply: "Hi Sarah,\n\nI reviewed the roadmap and the scope allocations look accurate.\n\nBest,\nAdhithiya" }], metadata: { total: 1, generated_at: now() } });
});

app.get("/search", (req: AuthRequest, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const results: any[] = [];
  getWorkspaceScoped(notes, req).forEach((n) => { if (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) results.push({ type: "note", id: n.note_id, title: n.title, content: n.content, tags: n.tags }); });
  getWorkspaceScoped(tasks, req).forEach((t) => { if (!q || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)) results.push({ type: "task", id: t.id, title: t.title, notes: t.notes, is_completed: t.is_completed, due: t.due }); });
  res.json({ available: true, query: q, total: results.length, results: results.slice(0, Number(req.query.limit || 20)), message: "Search completed successfully" });
});
app.get("/search/health", (_req, res) => res.json({ available: true, status: "ok", message: "Unified memory search engine is ready" }));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  httpServer.listen(PORT, "0.0.0.0", () => console.log(`Co-Work running on http://0.0.0.0:${PORT}`));
}

startServer();
