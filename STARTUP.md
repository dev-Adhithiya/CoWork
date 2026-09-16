# Co-Work - Startup Guide

Complete guide to starting and running the Co-Work Collaboration Workspace.

---

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Starting the Application](#starting-the-application)
- [Accessing the Workspace](#accessing-the-workspace)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting Co-Work, ensure you have:
- **Node.js 18+** and npm installed
- A **Gemini API Key** (from Google AI Studio)

---

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## Starting the Application

### Development Mode
```bash
npm run dev
```

The application will boot the server with Vite middleware on port 3000.

### Production Mode
```bash
npm run build
npm start
```

---

## Accessing the Workspace

Open your browser and navigate to:
```
http://localhost:3000
```

You will be greeted by the Co-Work login screen with the interlocking emblem and brand identity.

---

## Features

- **Daily Briefing**: High-priority morning briefing, calendar agenda, and pending email reviews.
- **AI Workspace Assistant**: Contextual conversation with tools to query calendar, draft emails, and track tasks.
- **Unified Navigation**: Quick switching between Chat, Tasks, Calendar, Notes, and Email Draft Console.
- **Responsive Layout**: Designed for single-screen desktop ergonomics with collapsible panels.

---

## Troubleshooting

- **Missing API Key**: Ensure `GEMINI_API_KEY` is present in your `.env` file.
- **Port Conflict**: Make sure port 3000 is available on your machine.
