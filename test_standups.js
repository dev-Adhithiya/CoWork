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
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Standup Test" } });
  const workspaceId = created.workspace.id;
  const date = new Date().toISOString().slice(0, 10);

  await request(`/api/workspaces/${workspaceId}/standup-entries`, {
    method: "POST",
    workspaceId,
    body: { date, content: "Yesterday I finished auth polish. Today I'll review room presence. Blocked on GitHub token docs." },
  });
  await request(`/api/workspaces/${workspaceId}/standup-entries`, {
    method: "POST",
    workspaceId,
    body: { date, content: "Yesterday I tested transcripts. Today I'll wire digest UI. No blockers." },
  });

  const entries = await request(`/api/workspaces/${workspaceId}/standup-entries?date=${date}`, { workspaceId });
  console.log("entries", entries.count);

  const digest = await request(`/api/workspaces/${workspaceId}/standup-digests`, {
    method: "POST",
    workspaceId,
    body: { date },
  });
  console.log("digest status", digest.status, "has attribution", digest.mergedSummary.includes("Adhithiya"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
