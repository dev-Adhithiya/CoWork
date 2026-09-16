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
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Blocker Action Test" } });
  const workspaceId = created.workspace.id;
  const date = new Date().toISOString().slice(0, 10);
  const entry = await request(`/api/workspaces/${workspaceId}/standup-entries`, {
    method: "POST",
    workspaceId,
    body: { date, content: "Yesterday I shipped chat. Today I need Adhithiya to follow up on release notes. Blocked by missing Firebase permissions." },
  });
  console.log("blockers extracted", entry.extractedBlockers.length);
  const blockerList = await request(`/api/workspaces/${workspaceId}/blockers`, { workspaceId });
  console.log("active blockers", blockerList.blockers.length);
  await request(`/api/blockers/${blockerList.blockers[0].id}/resolve`, { method: "PATCH", workspaceId });
  const afterResolve = await request(`/api/workspaces/${workspaceId}/blockers`, { workspaceId });
  console.log("after resolve", afterResolve.blockers.length);

  const digest = await request(`/api/workspaces/${workspaceId}/standup-digests`, { method: "POST", workspaceId, body: { date } });
  const actions = await request(`/api/workspaces/${workspaceId}/action-items`, { workspaceId });
  console.log("digest", digest.id, "actions", actions.actionItems.length);
  if (actions.actionItems[0]) {
    const blockedDone = await fetch(`${base}/api/action-items/${actions.actionItems[0].id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-workspace-id": workspaceId },
      body: JSON.stringify({ status: "done" }),
    });
    console.log("done before confirm blocked", blockedDone.status === 409);
    await request(`/api/action-items/${actions.actionItems[0].id}/confirm`, { method: "PATCH", workspaceId });
    const done = await request(`/api/action-items/${actions.actionItems[0].id}/status`, { method: "PATCH", workspaceId, body: { status: "done" } });
    console.log("done after confirm", done.status);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
