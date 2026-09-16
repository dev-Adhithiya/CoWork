# Co-Work - Quick Start Checklist

Follow this checklist to get Co-Work running in minutes.

---

## ✅ Phase 1: Prerequisites
- [ ] **Node.js 18+** installed (`node -v`)
- [ ] **npm** or **bun** package manager installed
- [ ] Google Gemini API key obtained from [Google AI Studio](https://aistudio.google.com/)

---

## ✅ Phase 2: Environment Setup
- [ ] Copy environment template:
  ```bash
  cp .env.example .env
  ```
- [ ] Open `.env` and set your key:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

---

## ✅ Phase 3: Launch
- [ ] Install project dependencies:
  ```bash
  npm install
  ```
- [ ] Launch full-stack development server:
  ```bash
  npm run dev
  ```
- [ ] Open browser at: **http://localhost:3000**

---

## ✅ Phase 4: Feature Verification
- [ ] **Authentication**: Click "Continue with Workspace Access" or "Sign in with Google"
- [ ] **Executive Briefing**: Review the morning summary, calendar events, and top priority tasks
- [ ] **AI Chief of Staff**: Ask the assistant questions or request task summaries in the chat panel
- [ ] **Team Workspaces & Channels**: Explore channels, post messages, and check live room presence
- [ ] **Standups & Blockers**: Post a daily standup and view extracted blockers and action items
- [ ] **Meeting Transcripts**: Stream transcript chunks and generate meeting summaries
- [ ] **Calendar & Tasks**: Add, complete, and organize daily tasks and calendar obligations

---

## ✅ Phase 5: Production Deployment
- [ ] Verify clean build:
  ```bash
  npm run build
  ```
- [ ] Start production bundle:
  ```bash
  npm start
  ```
