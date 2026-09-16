# Co-Work - AI Chief of Staff & Workspace Assistant

> **Intelligent AI Workspace Assistant with Google Workspace Integration**

A powerful, proactive workspace assistant that seamlessly connects with your daily workflow across emails, calendar schedules, tasks, and team notes. Built with modern full-stack architecture, Gemini 2.5, Express, and React.

## Overview

**Co-Work** is designed for modern professionals and knowledge workers seeking an intuitive "command and control" layer. It synthesizes executive briefings, drafts context-aware emails, monitors calendar obligations, and orchestrates task priorities through natural language.

---

## ✨ Key Capabilities

### 🤖 Intelligent AI Operations
- **Proactive AI Reasoning** powered by Gemini models.
- **Dynamic Daily Briefings**: High-level morning catch-ups synthesizing calendar events, incoming priority messages, and overdue tasks.
- **Context-Aware Intent Classification**: Automatically classifies incoming requests into calendar adjustments, task updates, email drafts, or structured notes.

### 📅 Calendar & Schedule Orchestration
- Instant agenda views and real-time schedule conflict alerts.
- Smart meeting preparation and time block optimization.

### ✉️ Priority Communications
- Unified email preview with unread tracking and importance categorization.
- Interactive email drafting console with smart subject generation and tone tuning (concise, formal, casual).

### 📋 Actionable Task & Notes System
- Integrated task management with due date detection and completion tracking.
- Unified elastic search across conversations, notes, calendar events, and messages.

### 🎨 Design & Aesthetic
- Clean, focused interface built with dark mode and light mode support.
- Electric royal blue and deep midnight slate styling matching the Co-Work brand identity.
- Full keyboard navigation and responsive viewport scaling.

---

## 🛠️ Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend API**: Node.js / Express running unified on port 3000
- **AI Engine**: Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash
- **Data Persistence**: Unified session, note, task, and communication stores

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Set your Gemini API key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📄 License
MIT License
