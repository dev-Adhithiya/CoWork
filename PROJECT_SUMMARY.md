# Co-Work - Project Summary & Architecture Reference

## 🌟 Executive Summary

**Co-Work** is an intelligent, full-stack collaboration platform and AI Chief of Staff. It brings together daily executive briefings, intelligent task scheduling, real-time team channels with presence, automated daily standups with blocker resolution, live meeting transcript intelligence, and note synchronization.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion |
| **Full-Stack Server** | Node.js, Express, Vite middleware (Port 3000) |
| **AI Intelligence** | Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash |
| **Realtime Engine** | WebSockets & Server-Sent Events (room presence, live channels) |
| **Data & Auth** | Firebase Firestore, Firebase Authentication, in-memory resilient stores |
| **Build & Deploy** | Vite, esbuild, Cloud Run container compatible |

---

## 📦 Functional Modules

### 1. Executive Briefing & Chief of Staff
- Morning briefing synthesizing today's schedule, priority messages, and overdue tasks.
- Proactive suggestions for upcoming meetings and conflict resolution.
- Conversational chat assistant powered by Gemini 2.5.

### 2. Team Workspaces & Real-Time Collaboration
- Multi-workspace architecture supporting personal and shared team contexts.
- Threaded channel communications with user mentions (`@user`) and unread indicators.
- Live room presence tracking with active occupant heartbeat detection.
- GitHub repository linking for tracking codebases directly inside workspace channels.

### 3. Asynchronous Standups & Blocker Auto-Extraction
- Daily standup reporting: What was done, planned work, and blocking issues.
- Automatic AI extraction of blockers from standup texts.
- Blocker action-item assignment, prioritization, and resolution workflow.

### 4. Meeting Intelligence & Rolling Transcripts
- Real-time ingestion of live meeting audio transcripts and notes.
- Rolling chunk summarization for on-the-fly meeting context.
- Final comprehensive meeting synthesis with key decisions and assigned action items.

### 5. Smart Calendar & Multi-Attendee Scheduling
- Visual daily agenda with conflict detection.
- Automated suggestion engine finding optimal meeting times across multiple attendees.
- Deep work and focus window optimization.

### 6. Actionable Tasks & Tagged Notes
- Complete task management with due dates, workspace assignment, and status filters.
- Multi-tag knowledge notes system with search and optional Google Drive synchronization.
- Interactive email draft console with smart tone adjustment.

---

## 📁 Repository Structure

```
/
├── src/
│   ├── components/
│   │   ├── auth/                # LoginPage, UserProfile
│   │   ├── chat/                # ChatInterface, MessageList, InputBar
│   │   ├── collaboration/       # WorkspaceManager, ChannelView, RoomPresence
│   │   ├── features/            # BriefingPanel, CalendarPanel, TasksPanel, NotesPanel, EmailDraftConsole
│   │   ├── layout/              # Sidebar, Header, MeshGradient
│   │   └── ui/                  # CoWorkLogo, GlassPanel, GlassButton, GlassInput
│   ├── contexts/                # AuthContext, ChatContext, VoiceContext, SettingsContext, WorkspaceContext
│   ├── types/                   # Shared TypeScript models and interfaces
│   ├── lib/                     # Firebase and utility clients
│   ├── App.tsx                  # Main application container
│   └── main.tsx                 # React entry point
├── server.ts                    # Unified Express full-stack server & API routes
├── package.json                 # Project dependencies & build scripts
├── metadata.json                # AI Studio application metadata
└── README.md                    # Main documentation entry point
```
