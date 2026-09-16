# Co-Work - Startup & Operations Guide

Comprehensive guide for starting, configuring, and maintaining the Co-Work workspace.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configuration](#configuration)
3. [Starting the Application](#starting-the-application)
4. [Unified Port 3000 Architecture](#unified-port-3000-architecture)
5. [Core Service Endpoints](#core-service-endpoints)
6. [Troubleshooting & Support](#troubleshooting--support)

---

## 1. Prerequisites

Before running Co-Work, ensure your system has:
- **Node.js 18 or higher** (`node -v`)
- **npm** (bundled with Node.js) or **bun**
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

## 2. Configuration

Create or update `.env` in the project root:

```env
# Gemini API Key (Server-side secret, do not commit to version control)
GEMINI_API_KEY=AIzaSy...

# Optional Port override (Container port defaults to 3000)
PORT=3000
```

---

## 3. Starting the Application

### Development Mode
Runs the unified Express server with Vite middleware on port 3000:
```bash
npm run dev
```

### Production Build & Launch
Compiles the React frontend to `dist/` and bundles the backend server to `dist/server.cjs`:
```bash
npm run build
npm start
```

---

## 4. Unified Port 3000 Architecture

Co-Work operates as a single unified service on **port 3000**:
- **Port 3000 (HTTP/WS)**: Handles all REST API routes (`/api/*`, `/chat`, `/tasks`, etc.), WebSocket realtime connections, and serves the Vite React single-page application.
- There are no separate backend ports (such as 8000 or 5173). Everything is reverse-proxied and routed through port 3000.

---

## 5. Core Service Endpoints

| Resource | Path | Method | Function |
| :--- | :--- | :--- | :--- |
| Health Check | `/api/health` | `GET` | Service liveness and version |
| Workspace Auth | `/auth/login` | `POST` | Exchange user identity for auth token |
| Workspaces | `/api/workspaces` | `GET`, `POST` | Manage team and personal workspaces |
| Channels | `/api/channels` | `GET`, `POST` | Team communication streams |
| Standups | `/api/standups` | `GET`, `POST` | Daily standup submissions & digests |
| Blockers | `/api/blockers` | `GET` | Active obstacles requiring resolution |
| Meeting Transcripts | `/api/meeting/transcript` | `POST` | Real-time transcript processing |
| Scheduling | `/api/scheduling/suggestions` | `POST` | AI-suggested meeting time windows |
| Tasks | `/tasks` | `GET`, `POST`, `PUT` | Workspace task tracking |
| Notes | `/notes` | `GET`, `POST`, `PUT` | Knowledge base notes |
| Calendar | `/calendar/events` | `GET`, `POST` | Daily schedule and calendar sync |
| Chat | `/chat` | `POST` | AI Chief of Staff assistant |

---

## 6. Troubleshooting & Support

If you encounter sign-in issues in embedded iframe environments or sandbox previews, Co-Work provides automatic fallback to workspace accounts. For full troubleshooting procedures, see `TROUBLESHOOTING.md`.
