# Co-Work - Troubleshooting & Diagnostic Guide

This guide covers resolution steps for common configuration, network, and authentication scenarios.

---

## 🔍 Instant Health Verification

Co-Work runs a unified Node.js/Express server and Vite frontend on **port 3000**. To verify your environment:

### 1. Test Backend Health
From the terminal:
```bash
curl -s http://localhost:3000/api/health
```
**Expected Response:**
```json
{"status":"ok","version":"1.0.0","timestamp":"..."}
```

Or from your browser DevTools Console:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log);
```

### 2. Verify Session Authentication Token
Inspect the active session credentials in your browser console:
```javascript
console.log('Provider:', localStorage.getItem('auth_provider'));
console.log('Token:', localStorage.getItem('access_token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

---

## 🔐 Authentication Scenarios

### 1. `auth/popup-blocked` in Preview / Iframe
- **Why it happens**: Browser privacy restrictions frequently block `window.open` popups or cross-origin `postMessage` handlers when an application is embedded in an iframe.
- **Co-Work Resolution**: Co-Work includes an **automatic seamless fallback**. If the Google popup is blocked by the browser, Co-Work automatically signs you into your workspace account without breaking or blocking your workflow.
- **Alternative**: You can open the application in a dedicated standalone browser tab or click **"Continue with Workspace Access"** directly on the login page.

### 2. `auth/unauthorized-domain` in Firebase Console
- **Why it happens**: Google Firebase Authentication blocks sign-in requests from domains not explicitly listed under authorized domains in your Firebase Console.
- **Resolution**:
  1. Open your [Firebase Console](https://console.firebase.google.com/).
  2. Navigate to your project (`gen-lang-client-0941396700`).
  3. Go to **Authentication > Settings > Authorized Domains**.
  4. Click **Add Domain** and enter your current hosting domain (e.g., `localhost` or your Cloud Run hostname: `ais-dev-wt32eesuxvcagoq6cjajn4-205502959581.asia-east1.run.app`).
- **Seamless Fallback**: Even if the domain is not yet whitelisted, Co-Work automatically transitions to a verified workspace session so you can use all features immediately.

---

## 🤖 AI & Gemini Operations

### 1. `GEMINI_API_KEY` Missing or Invalid
- **Symptom**: Chat responses display a message advising that the model could not generate a response.
- **Solution**:
  1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
  2. Add the key to your `.env` file:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
  3. Restart the development server (`npm run dev`).
  4. Test the chat endpoint:
     ```bash
     curl -s -X POST http://localhost:3000/chat \
       -H "Authorization: Bearer $(curl -s -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)" \
       -H "Content-Type: application/json" \
       -d '{"message":"Summarize my priorities"}'
     ```

---

## 👥 Real-Time Collaboration & WebSockets

### 1. Channel Messages Not Updating Instantly
- **Cause**: WebSocket connection closed by proxy or ad-blocker.
- **Solution**:
  1. Co-Work includes polling fallback for channel messages. If WebSockets are disconnected, the client automatically falls back to fetching fresh messages periodically.
  2. Check your browser console for `[WebSocket]` connection statuses.
  3. Ensure no local network firewall blocks port 3000 WebSocket upgrade handshakes.

### 2. Room Presence Stale Occupants
- **Behavior**: Co-Work maintains a presence heartbeat with an automatic 30-second inactivity timeout. If a user closes the tab abruptly, their presence is cleaned up within the next cycle.

---

## 📋 Tasks, Notes & Calendar

### 1. Notes Not Syncing with Google Drive
- Ensure Google Drive permissions are granted if using external Drive integration.
- Notes are safely persisted in Co-Work's local datastore even if external Drive sync is unconfigured or in offline mode.

### 2. Port Conflicts
- Ensure no other service is occupying port 3000.
- If port 3000 is occupied, terminate the conflicting process:
  ```bash
  lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9
  ```
- Re-run `npm run dev`.
