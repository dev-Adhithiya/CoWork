# Co-Work - Integration & Deployment Guide

## 🎯 Architecture & Deployment Overview

Co-Work operates as a unified, full-stack application binding together Google Gemini AI, Firebase services, and Express with Vite.

```
┌─────────────────────────────────────────────────────────────┐
│                    CO-WORK INTEGRATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Step 1: Configure Environment (.env)                      │
│              ↓                                              │
│   Step 2: Install Dependencies (npm install)                │
│              ↓                                              │
│   Step 3: Run Locally (npm run dev on Port 3000)            │
│              ↓                                              │
│   Step 4: Build for Production (npm run build)              │
│              ↓                                              │
│   Step 5: Deploy to Cloud Run / Docker Container            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 1. Environment Configuration

Create a `.env` file in your root workspace:

```env
# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...

# Application Port (Port 3000 is required in container environments)
PORT=3000
```

---

## 💻 2. Local Execution

```bash
# Install packages
npm install

# Run unified full-stack development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 🚀 3. Container & Cloud Run Deployment

Co-Work includes production build scripts that bundle both the client SPA and the Express backend:

### Build Command:
```bash
npm run build
```
This executes:
1. `vite build`: Compiles React assets into `/dist`
2. `esbuild server.ts`: Bundles the Express backend into `dist/server.cjs`

### Start Command:
```bash
npm start
```
Runs `node dist/server.cjs` which serves both API endpoints and the compiled single-page application on port 3000.

### Google Cloud Run Deployment:
```bash
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/co-work
gcloud run deploy co-work \
  --image gcr.io/$GCP_PROJECT_ID/co-work \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```

---

## 🔐 4. Authentication Integration

Co-Work supports dual-mode authentication:
1. **Firebase Authentication (Google OAuth)**: Users can sign in with their Google accounts.
2. **Seamless Workspace Fallback**: When running inside sandboxed iframes or environments where popups are restricted, Co-Work gracefully falls back to instant workspace session authentication without throwing errors or blocking users.
