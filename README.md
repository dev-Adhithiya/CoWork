# Co-Work - AI Chief of Staff & Team Collaboration Workspace

> **Next-Generation Intelligent AI Workspace Assistant, Real-Time Collaboration & Chief of Staff**

Co-Work is a proactive, context-aware collaboration workspace that orchestrates your daily productivity. It connects seamlessly across daily schedules, tasks, team communications, automated standups, live meeting transcripts, and project repositories. Built with a unified full-stack architecture powered by Google Gemini, Express, Vite, React, and Firebase.

---

## 🌟 Key Capabilities

### 🤖 Intelligent AI Chief of Staff
- **Proactive Executive Briefings**: Daily morning catch-up synthesizing calendar events, incoming priority messages, active blockers, and overdue tasks.
- **Context-Aware Intent Classification**: Automatically classifies incoming natural language requests into calendar adjustments, task assignments, draft responses, or team notes.
- **Deep Workspace Search**: Unified instant search across conversations, notes, calendar events, tasks, and team messages.

### 👥 Real-Time Team Collaboration & Channels
- **Multi-Tenant Workspaces**: Personal and team workspaces with role-based member management.
- **Channels & Threaded Discussions**: Topic-based team channels with user mentions, unread tracking, and real-time updates.
- **Live Room Presence**: Real-time occupant tracking and activity status indicators across team rooms.
- **GitHub Repository Linking**: Link GitHub repositories (e.g. `owner/repo`) directly into workspace contexts to reference code and pull requests.

### 🚀 Automated Standups & Blocker Extraction
- **Asynchronous Daily Standups**: Team members post what was completed, planned work, and blocking obstacles.
- **AI-Powered Blocker Extraction**: Automatically identifies and tracks impediments from standup entries and channels.
- **Action Item Assignment & Resolution**: Convert blockers into actionable tasks with assigned owners, priority tracking, and one-click resolution.

### 🎙️ Meeting Intelligence & Rolling Transcripts
- **Real-Time Transcript Ingestion**: Stream meeting audio transcripts or notes in real-time chunks.
- **Rolling Chunk Summarization**: Immediate incremental summaries of key discussion points during ongoing calls.
- **Final Meeting Synthesis**: Comprehensive meeting wrap-up including decisions made, action items assigned, and attendees noted.

### 📅 Smart Calendar & Multi-Attendee Scheduling
- **Visual Agenda & Conflict Alerts**: Interactive timeline with instant conflict detection.
- **AI Schedule Optimizer**: Search available time windows across multiple team attendees with timezone normalization.
- **Focus Time Optimization**: Suggests contiguous blocks for uninterrupted deep work.

### 📋 Actionable Tasks & Notes Knowledge Base
- **Scoped Tasks System**: Create, assign, filter, and track tasks scoped by workspace and project.
- **Tagged Workspace Notes**: Rich notes system with multi-tagging, search, and Google Drive synchronization.
- **Email Draft Console**: Smart email drafting with customizable tones (concise, formal, casual).

### 🔐 Resilient Authentication
- **Dual Authentication**: Seamless Google OAuth via Firebase with automatic fallback to workspace session authentication inside preview/sandboxed iframe environments.
- **Zero-Friction Access**: Automatic recovery from domain or popup restrictions so your workflow is never interrupted.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 CO-WORK UNIFIED ARCHITECTURE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client Layer (React 18 + TypeScript + Vite + Tailwind)   │
│   ├── Executive Briefing & Daily Dashboard                  │
│   ├── Real-Time Collaboration & Channels                    │
│   ├── AI Standups & Blocker Resolution                      │
│   ├── Live Meeting Transcripts & Summaries                  │
│   └── Calendar, Tasks, Notes & Email Console                │
│                              ↕                              │
│   Unified Server Layer (Express on Node.js - Port 3000)     │
│   ├── Vite SPA Middleware (Dev & Production)                │
│   ├── REST API & WebSockets / Real-Time Event Stream        │
│   ├── Google GenAI SDK (@google/genai - Gemini 2.5)         │
│   └── Firebase Authentication & Firestore Datastore         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion animations
- **Backend**: Express on Node.js running unified on Port 3000
- **AI Engine**: Google GenAI SDK (`@google/genai`) using Gemini 2.5 Flash
- **Database & Auth**: Firebase Firestore, Firebase Authentication, in-memory resilient datastores
- **Real-time Engine**: WebSocket / Server-Sent Events for room presence and channel messaging

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js 18+** installed (`node -v`)
- **npm** or **bun** package manager

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
# Required for Gemini AI capabilities
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Server Port (default: 3000)
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Launch Development Server
```bash
npm run dev
```

Open your browser at **http://localhost:3000**. The unified Express server boots with Vite middleware handling client hot reloads and server-side endpoints simultaneously.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 📡 API Reference Overview

All API endpoints are hosted on port 3000:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health`, `/api/health` | `GET` | Service health status and timestamp |
| `/auth/login` | `POST` | Authenticate workspace user & issue token |
| `/api/workspaces` | `GET`, `POST` | List and create workspaces |
| `/api/channels` | `GET`, `POST` | Workspace communication channels |
| `/api/channels/:id/messages` | `GET`, `POST` | Channel messages and mentions |
| `/api/standups` | `GET`, `POST` | Submit daily standups and generate digest |
| `/api/blockers` | `GET` | List active workspace blockers |
| `/api/action-items` | `GET`, `POST`, `PUT` | Manage blocker action items |
| `/api/meeting/transcript` | `POST` | Stream meeting audio/notes chunks & summarize |
| `/api/scheduling/suggestions` | `POST` | AI-assisted multi-attendee meeting times |
| `/tasks` | `GET`, `POST`, `PUT`, `DELETE` | Task management operations |
| `/notes` | `GET`, `POST`, `PUT`, `DELETE` | Workspace notes and sync status |
| `/calendar/events` | `GET`, `POST` | Calendar events & schedule timeline |
| `/gmail/messages` | `GET`, `POST` | Incoming priority emails and drafts |
| `/chat` | `POST` | AI Chief of Staff conversational assistant |
| `/search` | `GET` | Unified cross-workspace search |

---

## 📄 License
MIT License. Built for modern productive teams.
