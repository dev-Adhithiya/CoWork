# Co-Work - Complete Integration Guide

## 🎯 Overview

Co-Work is an AI-powered collaboration and productivity workspace. Here is how to configure and deploy the application:

```
┌─────────────────────────────────────────────────────────────┐
│                    CO-WORK WORKSPACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Configure Environment Variables                    │
│              ↓                                              │
│  Step 2: Install Node Dependencies                          │
│              ↓                                              │
│  Step 3: Run Locally (npm run dev)                          │
│              ↓                                              │
│  Step 4: Build & Deploy (npm run build)                     │
│              ↓                                              │
│     ✨ Live Co-Work Application ✨                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- **Node.js 18+**
- **Google Gemini API Key** (from Google AI Studio)
- **Google Cloud Platform Project** (for OAuth & optional Cloud Run deployment)

---

## 🔧 Step 1: Environment Variables

Create or update `.env`:

```env
# Required for AI Features
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Port and Host (default is 3000)
PORT=3000
```

---

## 💻 Step 2: Running Locally

```bash
# Install packages
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🚀 Step 3: Deployment Options

### Option A: GitHub Pages (Client-Side Preview)
The included GitHub Actions workflow in `.github/workflows/deploy.yml` automatically builds and publishes the production `dist/` directory on pushes to the `main` branch.

### Option B: Cloud Run Container Deployment
Build and deploy the full-stack container using Google Cloud SDK:

```bash
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/co-work
gcloud run deploy co-work --image gcr.io/$GCP_PROJECT_ID/co-work --region us-central1 --port 3000
```

---

## 🧠 How Co-Work Works

1. **Context & State Management**: Real-time React context maintains chat dialogue, voice state, user settings, and workspace data.
2. **AI Chief of Staff Engine**: Uses Google Gemini models with structured prompts to generate briefings, summarize agendas, draft email responses, and manage tasks.
3. **Ergonomic Workspace Layout**: Designed for single-screen focus with collapsible utility sidebars, quick task triage, and an interactive command bar.
