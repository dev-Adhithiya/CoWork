import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ─── Lazy Gemini Client ────────────────────────────────────────────────────────
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// ─── In-Memory Data Stores ─────────────────────────────────────────────────────

const currentUser = {
  user_id: "user_cowork_1",
  email: "askadhithiya@gmail.com",
  name: "Adhithiya",
  picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  settings: {
    theme: "dark",
    voice_enabled: true,
    notifications: true,
  },
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  images?: Array<{ id: string; src: string; filename?: string }>;
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

const sessions: Map<string, ChatSession> = new Map();

// Seed initial session
const defaultSessionId = "session_welcome";
sessions.set(defaultSessionId, {
  session_id: defaultSessionId,
  title: "Morning Briefing & Calendar Review",
  created_at: new Date(Date.now() - 3600000).toISOString(),
  updated_at: new Date().toISOString(),
  messages: [
    {
      role: "assistant",
      content:
        "Hello Adhithiya! I am Co-Work, your Chief of Staff and workspace assistant. Your workspace is synced with Google Calendar, Gmail, Tasks, and Notes. How can I help streamline your day?",
      timestamp: new Date().toISOString(),
    },
  ],
});

let events = [
  {
    id: "evt_1",
    summary: "Executive Sprint Review & Product Sync",
    start: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    location: "Google Meet",
    description: "Review sprint deliverables, architectural progress, and AI assistant enhancements.",
    meet_link: "https://meet.google.com/zen-ith-meet",
    attendees: ["askadhithiya@gmail.com", "sarah.chen@techcorp.io", "alex.dev@techcorp.io"],
  },
  {
    id: "evt_2",
    summary: "AI Architecture & Latency Benchmark Sync",
    start: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    location: "Room 402 / Virtual",
    description: "Discussion on multi-modal tool routing and token caching strategies.",
    meet_link: "https://meet.google.com/arch-sync-now",
    attendees: ["askadhithiya@gmail.com", "elena.rostova@cloud.io"],
  },
  {
    id: "evt_3",
    summary: "Quarterly Strategy & Goal Alignment",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    location: "Conference Hall A",
    description: "Review quarterly objectives, user satisfaction metrics, and upcoming milestones.",
    meet_link: "",
    attendees: ["askadhithiya@gmail.com", "leadership@techcorp.io"],
  },
];

let tasks = [
  {
    id: "task_1",
    title: "Review Q3 product roadmap & milestones",
    notes: "Ensure all deliverables have assigned leads and risk mitigations documented.",
    due: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "task_2",
    title: "Reply to Sarah regarding marketing proposal",
    notes: "Approve budget reallocation for developer summit sponsorship.",
    due: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "task_3",
    title: "Review Co-Work latency test results",
    notes: "Assess TTFT and cache hit rates across mobile and web clients.",
    due: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "task_4",
    title: "Update security compliance checklist",
    notes: "Verify OAuth token rotation policies.",
    due: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    is_completed: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let notes = [
  {
    note_id: "note_1",
    title: "Co-Work Architecture Notes",
    content:
      "Co-Work operates as a proactive Chief of Staff. Key modules include Calendar synchronization, Task management, intelligent Priority feed, unified workspace search, and Gemini-driven conversational reasoning.",
    tags: ["architecture", "ai", "roadmap"],
    source: "cowork_core",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    note_id: "note_2",
    title: "Key Meeting Takeaways - Sprint 14",
    content:
      "Prioritize response latency and local responsiveness. All UI controls should support keyboard navigation and dark glassmorphic styling.",
    tags: ["meeting", "sprint"],
    source: "calendar_prep",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let emails = [
  {
    id: "mail_1",
    from: "Sarah Chen <sarah.chen@techcorp.io>",
    subject: "Urgent: Feedback on Q3 Product Roadmap before 3 PM",
    snippet: "Hi Adhithiya, could you please take a look at the attached roadmap revisions? We need your sign-off by 3 PM today.",
    body_text:
      "Hi Adhithiya,\n\nCould you please take a look at the attached roadmap revisions? We need your sign-off before 3 PM today to finalize the executive presentation.\n\nKey highlights:\n- Launch date set for October 15th\n- Additional engineering capacity assigned to assistant integrations\n\nThanks!\nSarah",
    body_html:
      "<p>Hi Adhithiya,</p><p>Could you please take a look at the attached roadmap revisions? We need your sign-off before 3 PM today to finalize the executive presentation.</p><ul><li>Launch date set for October 15th</li><li>Additional engineering capacity assigned to assistant integrations</li></ul><p>Thanks!<br>Sarah</p>",
    is_unread: true,
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "mail_2",
    from: "Google Cloud Notifications <notifications@cloud.google.com>",
    subject: "Cloud Run Service Deployed: Co-Work Production",
    snippet: "Your revision cowork-app-00042 has completed rollout with 100% traffic allocation.",
    body_text:
      "Your Cloud Run service cowork-app has been successfully updated to revision cowork-app-00042.\nAll health checks passed in region asia-east1.",
    body_html:
      "<p>Your Cloud Run service <strong>cowork-app</strong> has been successfully updated to revision <code>cowork-app-00042</code>.</p><p>All health checks passed in region asia-east1.</p>",
    is_unread: false,
    date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "mail_3",
    from: "Alex Dev <alex.dev@techcorp.io>",
    subject: "Sprint Review prep notes & agenda",
    snippet: "Agenda for today's review is ready. Please let me know if you want to add any items.",
    body_text:
      "Hi Adhithiya,\n\nThe agenda for today's sprint review has been posted. Looking forward to showing off the new glassmorphic UI.\n\nBest,\nAlex",
    body_html:
      "<p>Hi Adhithiya,</p><p>The agenda for today's sprint review has been posted. Looking forward to showing off the new glassmorphic UI.</p><p>Best,<br>Alex</p>",
    is_unread: true,
    date: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

let userPreferences = {
  preferred_meeting_times: ["09:00 - 12:00", "14:00 - 17:00"],
  frequent_contacts: ["sarah.chen@techcorp.io", "alex.dev@techcorp.io", "elena.rostova@cloud.io"],
  email_tone: "professional_concise",
  custom_rules: ["Flag urgent emails immediately", "Auto-draft meeting preparation notes"],
  working_hours: {
    start: "09:00",
    end: "17:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  timezone: "UTC",
  notification_preferences: {
    daily_briefing: true,
    email_alerts: true,
    task_reminders: true,
  },
  updated_at: new Date().toISOString(),
};

// ─── API Routes ────────────────────────────────────────────────────────────────

// Health
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Auth
const handleLogin = (req: Request, res: Response) => {
  const token = `cowork_token_${Date.now()}`;
  const email = (req.body?.email as string) || (req.query?.email as string) || currentUser.email;
  const name = (req.body?.name as string) || (req.query?.name as string) || currentUser.name;

  const user = {
    ...currentUser,
    email,
    name,
    last_login: new Date().toISOString(),
  };

  const userJson = encodeURIComponent(JSON.stringify(user));
  const authorization_url = `/?auth_success=true#access_token=${token}&user=${userJson}`;

  res.json({
    success: true,
    token,
    user,
    authorization_url,
    state: "cowork_active_state",
  });
};

app.get("/auth/login", handleLogin);
app.post("/auth/login", handleLogin);

app.get("/auth/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader || req.query.token) {
    return res.json(currentUser);
  }
  // If no auth header, return user by default so user can directly use workspace
  res.json(currentUser);
});

app.post("/auth/logout", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Sessions
app.post("/sessions", (_req: Request, res: Response) => {
  const sessionId = `session_${Date.now()}`;
  const newSession: ChatSession = {
    session_id: sessionId,
    title: "New Conversation",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: [
      {
        role: "assistant",
        content: "Hello! I am Co-Work. How can I assist you with your schedule, tasks, or emails?",
        timestamp: new Date().toISOString(),
      },
    ],
  };
  sessions.set(sessionId, newSession);
  res.json({ session_id: sessionId });
});

app.get("/sessions", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const sessionList = Array.from(sessions.values())
    .map((s) => ({
      session_id: s.session_id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      last_message: s.messages[s.messages.length - 1]?.content || "",
    }))
    .reverse()
    .slice(0, limit);

  res.json({
    sessions: sessionList,
    count: sessionList.length,
  });
});

app.delete("/sessions/:id", (req: Request, res: Response) => {
  sessions.delete(req.params.id);
  res.json({ result: "ok", message: "Session deleted" });
});

app.get("/chat/sessions/:id", (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.json({
      session_id: req.params.id,
      messages: [],
      count: 0,
    });
  }
  res.json({
    session_id: session.session_id,
    messages: session.messages,
    count: session.messages.length,
  });
});

// Chat POST (handles multipart/form-data with upload.any() or JSON)
app.post("/chat", upload.any(), async (req: Request, res: Response) => {
  try {
    const message = req.body.message || "";
    let sessionId = req.body.session_id;

    if (!sessionId || !sessions.has(sessionId)) {
      sessionId = `session_${Date.now()}`;
      sessions.set(sessionId, {
        session_id: sessionId,
        title: message ? message.slice(0, 30) + (message.length > 30 ? "..." : "") : "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      });
    }

    const session = sessions.get(sessionId)!;

    // Add user message
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    });
    session.updated_at = new Date().toISOString();

    let replyText = "";
    const ai = getGemini();

    if (ai) {
      try {
        const promptContext = `You are Co-Work, an elite proactive Chief of Staff and workspace assistant.
The user's current environment has:
- ${events.length} calendar events today: ${events.map((e) => `"${e.summary}" at ${new Date(e.start).toLocaleTimeString()}`).join(", ")}
- ${tasks.filter((t) => !t.is_completed).length} pending tasks: ${tasks.filter((t) => !t.is_completed).map((t) => `"${t.title}"`).join(", ")}
- ${emails.filter((e) => e.is_unread).length} unread emails: ${emails.filter((e) => e.is_unread).map((e) => `from ${e.from}: "${e.subject}"`).join("; ")}

Be proactive, concise, articulate, and helpful. Suggest concrete next steps or actions when relevant.`;

        const chatHistoryForGemini = session.messages.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const result = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: chatHistoryForGemini,
          config: {
            systemInstruction: promptContext,
          },
        });

        replyText = result.text || "I have received your request and processed it across your workspace.";
      } catch (err) {
        console.error("Gemini API call failed:", err);
        replyText = "Error: Failed to generate a response from the AI model. Please check your API key and model availability.";
      }
    }

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: replyText,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(assistantMsg);

    res.json({
      response: replyText,
      session_id: sessionId,
      suggestions: [
        "Review today's schedule",
        "Check unread emails",
        "Add a high-priority task",
      ],
      execution_success: true,
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Calendar
app.get("/calendar/events", (req: Request, res: Response) => {
  const query = req.query.query as string | undefined;
  let filtered = events;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.summary.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }
  res.json({ events: filtered, count: filtered.length });
});

app.post("/calendar/events", (req: Request, res: Response) => {
  const newEvent = {
    id: `evt_${Date.now()}`,
    summary: req.body.summary || "New Meeting",
    start: req.body.start_time || req.body.start || new Date().toISOString(),
    end: req.body.end_time || req.body.end || new Date(Date.now() + 3600000).toISOString(),
    location: req.body.location || (req.body.add_google_meet ? "Google Meet" : "Virtual"),
    description: req.body.description || "",
    meet_link: req.body.add_google_meet ? "https://meet.google.com/zen-meet-new" : "",
    attendees: req.body.attendees || ["askadhithiya@gmail.com"],
  };
  events.unshift(newEvent);
  res.json(newEvent);
});

app.post("/calendar/quick-add", (req: Request, res: Response) => {
  const text = req.body.text || "Meeting";
  const newEvent = {
    id: `evt_${Date.now()}`,
    summary: text,
    start: new Date(Date.now() + 3600000).toISOString(),
    end: new Date(Date.now() + 7200000).toISOString(),
    location: "Google Meet",
    description: `Quick added: "${text}"`,
    meet_link: "https://meet.google.com/zen-meet-quick",
    attendees: ["askadhithiya@gmail.com"],
  };
  events.unshift(newEvent);
  res.json(newEvent);
});

// Tasks
app.get("/tasks", (req: Request, res: Response) => {
  const showCompleted = req.query.show_completed === "true";
  const filtered = showCompleted ? tasks : tasks.filter((t) => !t.is_completed);
  res.json({ tasks: filtered, count: filtered.length });
});

app.post("/tasks", (req: Request, res: Response) => {
  const newTask = {
    id: `task_${Date.now()}`,
    title: req.body.title || "Untitled Task",
    notes: req.body.notes || "",
    due: req.body.due_date || req.body.due || new Date(Date.now() + 86400000).toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  };
  tasks.unshift(newTask);
  res.json(newTask);
});

app.patch("/tasks/:id/complete", (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (task) {
    task.is_completed = true;
  }
  res.json(task || {});
});

app.patch("/tasks/:id/uncomplete", (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (task) {
    task.is_completed = false;
  }
  res.json(task || {});
});

app.post("/tasks/reminder", (req: Request, res: Response) => {
  const newTask = {
    id: `task_${Date.now()}`,
    title: req.body.title || "Reminder",
    notes: req.body.notes || "",
    due: req.body.remind_at || new Date().toISOString(),
    is_completed: false,
    created_at: new Date().toISOString(),
  };
  tasks.unshift(newTask);
  res.json(newTask);
});

app.post("/tasks/edit", (req: Request, res: Response) => {
  res.json({
    status: "success",
    task_payload: {
      title: req.body.title,
      description: req.body.description || null,
      due: req.body.due || null,
    },
  });
});

// Notes
app.get("/notes", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const source = req.query.source as string;
  let filtered = notes;
  if (source) {
    filtered = filtered.filter((n) => n.source === source);
  }
  res.json({ notes: filtered.slice(0, limit), count: filtered.length });
});

app.post("/notes", (req: Request, res: Response) => {
  const newNote = {
    note_id: `note_${Date.now()}`,
    title: req.body.title || "Untitled Note",
    content: req.body.content || "",
    tags: req.body.tags || ["general"],
    source: req.body.source || "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notes.unshift(newNote);
  res.json(newNote);
});

app.post("/notes/search", (req: Request, res: Response) => {
  const q = (req.body.query || "").toLowerCase();
  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t: string) => t.toLowerCase().includes(q))
  );
  res.json({ notes: filtered, count: filtered.length });
});

// Gmail
app.get("/gmail/messages", (req: Request, res: Response) => {
  const maxResults = parseInt(req.query.max_results as string) || 10;
  const q = req.query.query as string | undefined;
  let filtered = emails;
  if (q) {
    const term = q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.subject.toLowerCase().includes(term) ||
        e.from.toLowerCase().includes(term) ||
        e.snippet.toLowerCase().includes(term)
    );
  }
  res.json({ emails: filtered.slice(0, maxResults), count: filtered.length });
});

app.get("/gmail/messages/:id", (req: Request, res: Response) => {
  const email = emails.find((e) => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ error: "Email not found" });
  }
  res.json(email);
});

app.post("/gmail/send", (req: Request, res: Response) => {
  const newMail = {
    id: `mail_${Date.now()}`,
    from: `${currentUser.name} <${currentUser.email}>`,
    subject: req.body.subject || "No Subject",
    snippet: (req.body.body || "").slice(0, 80),
    body_text: req.body.body || "",
    body_html: req.body.html_body || `<p>${req.body.body || ""}</p>`,
    is_unread: false,
    date: new Date().toISOString(),
  };
  emails.unshift(newMail);
  res.json({ status: "sent", id: newMail.id });
});

// Briefing
app.get("/agent/briefing", (_req: Request, res: Response) => {
  const pendingTasks = tasks.filter((t) => !t.is_completed).length;
  const todayEvents = events.length;
  const unreadMails = emails.filter((e) => e.is_unread).length;
  res.json({
    status: "ready",
    title: "Daily Catch-Up Briefing",
    content: `Good morning! You have ${todayEvents} events on your schedule today, ${pendingTasks} active tasks, and ${unreadMails} unread messages requiring attention. Key highlight: Executive Sprint Review is coming up, and Sarah requested feedback on the product roadmap before 3 PM.`,
    metadata: {
      task_count: pendingTasks,
      event_count: todayEvents,
      unread_count: unreadMails,
      last_updated: new Date().toISOString(),
    },
  });
});

// Preferences
app.get("/preferences", (_req: Request, res: Response) => {
  res.json({ preferences: userPreferences, updated_at: userPreferences.updated_at });
});

app.patch("/preferences", (req: Request, res: Response) => {
  userPreferences = {
    ...userPreferences,
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  res.json({ preferences: userPreferences, updated_at: userPreferences.updated_at });
});

// Priority Feed
app.get("/insights/priority-feed", (_req: Request, res: Response) => {
  const priorityItems = [
    {
      id: "feed_1",
      type: "email_action",
      action_type: "reply",
      ui_actions: ["reply", "task", "ignore"],
      title: "Action Required: Q3 Product Roadmap Feedback",
      from: "Sarah Chen <sarah.chen@techcorp.io>",
      summary: "Sarah needs your input and approval on the Q3 Product Roadmap revisions by 3:00 PM today.",
      reason: "High priority client deliverable due today",
      draft_reply:
        "Hi Sarah,\n\nI reviewed the roadmap and the scope allocations look accurate. Proceed with the current plan.\n\nBest regards,\nAdhithiya",
      task_payload: {
        title: "Review Q3 Product Roadmap",
        description: "Provide sign-off before 3 PM",
        due: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
      },
    },
    {
      id: "feed_2",
      type: "meeting_prep",
      status: "ready",
      title: "Prep for Executive Sprint Review",
      summary: "Review key progress deliverables, API performance benchmarks, and user adoption stats.",
      reason: "Upcoming event at 2:00 PM today",
      prep: {
        risks: ["Timeline dependencies on third-party OAuth approvals", "Latency optimizations under load"],
        talking_points: ["Discuss multi-modal model transitions", "Review assistant satisfaction rating"],
      },
    },
  ];

  res.json({
    status: "ready",
    items: priorityItems,
    metadata: {
      total: priorityItems.length,
      generated_at: new Date().toISOString(),
    },
  });
});

// Search
app.get("/search", (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").toLowerCase();
  const type = (req.query.type as string) || "all";
  const limit = parseInt(req.query.limit as string) || 20;

  const results: any[] = [];

  if (type === "all" || type === "notes") {
    notes.forEach((n) => {
      if (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push({
          type: "note",
          id: n.note_id,
          score: 1.0,
          title: n.title,
          content: n.content,
          tags: n.tags,
        });
      }
    });
  }

  if (type === "all" || type === "tasks") {
    tasks.forEach((t) => {
      if (!q || t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))) {
        results.push({
          type: "task",
          id: t.id,
          score: 0.9,
          title: t.title,
          notes: t.notes,
          is_completed: t.is_completed,
          due: t.due,
        });
      }
    });
  }

  if (type === "all" || type === "events") {
    events.forEach((e) => {
      if (!q || e.summary.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))) {
        results.push({
          type: "event",
          id: e.id,
          score: 0.8,
          summary: e.summary,
          description: e.description,
          location: e.location,
          start: e.start,
          end: e.end,
        });
      }
    });
  }

  if (type === "all" || type === "emails") {
    emails.forEach((em) => {
      if (!q || em.subject.toLowerCase().includes(q) || em.snippet.toLowerCase().includes(q) || em.from.toLowerCase().includes(q)) {
        results.push({
          type: "email",
          id: em.id,
          score: 0.7,
          subject: em.subject,
          from_addr: em.from,
          snippet: em.snippet,
          is_unread: em.is_unread,
          date: em.date,
        });
      }
    });
  }

  res.json({
    available: true,
    query: q,
    total: results.length,
    results: results.slice(0, limit),
    message: "Search completed successfully",
  });
});

app.get("/search/health", (_req: Request, res: Response) => {
  res.json({
    available: true,
    status: "ok",
    message: "Unified memory search engine is ready",
  });
});

// ─── Vite Middleware & Static Serving ──────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Co-Work running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
