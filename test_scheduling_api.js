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
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Schedule Test" } });
  const workspaceId = created.workspace.id;
  await request("/api/users/me/timezone", { method: "PATCH", workspaceId, body: { timezone: "Asia/Kolkata" } });
  const result = await request(`/api/workspaces/${workspaceId}/schedule/suggestions`, {
    method: "POST",
    workspaceId,
    body: { participantIds: ["user_cowork_1"], durationMinutes: 30, searchStart: "2026-09-17T00:00:00.000Z", days: 1 },
  });
  console.log("schedule suggestions", result.suggestions.length, result.suggestions[0].localTimes[0].timezone);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
