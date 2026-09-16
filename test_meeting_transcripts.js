const base = "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.workspaceId ? { "x-workspace-id": options.workspaceId } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Transcript Test" } });
  const workspaceId = created.workspace.id;
  const meetingId = `standup-${Date.now()}`;

  const malformed = await request("/api/webhooks/meeting-transcript", {
    method: "POST",
    body: { eventType: "chunk", workspaceId, meetingId, text: "missing speaker and timestamp" },
  });
  console.log("malformed skipped", malformed.skipped === true);

  await request("/api/webhooks/meeting-transcript", {
    method: "POST",
    body: { eventType: "chunk", workspaceId, meetingId, speaker: "Raj", text: "I will follow up on the API contract.", timestamp: new Date().toISOString() },
  });
  const second = await request("/api/webhooks/meeting-transcript", {
    method: "POST",
    body: { eventType: "chunk", workspaceId, meetingId, speaker: "Priya", text: "Design review is ready for feedback.", timestamp: new Date().toISOString() },
  });
  console.log("rolling summarized", second.summarized === true);

  const ended = await request("/api/webhooks/meeting-transcript", {
    method: "POST",
    body: { eventType: "end", workspaceId, meetingId },
  });
  console.log("ended", ended.ended === true);

  const listed = await request(`/api/workspaces/${workspaceId}/meeting-transcripts`, { workspaceId });
  const transcript = listed.transcripts.find((item) => item.meetingId === meetingId);
  console.log("chunks", transcript.chunks.length, "summaries", transcript.summaries.length, "final", !!transcript.endedAt);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
