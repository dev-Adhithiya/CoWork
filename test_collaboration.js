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
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const workspaces = await request("/api/workspaces");
  const personal = workspaces[0];
  console.log("workspace", personal.id, personal.name);

  const created = await request("/api/workspaces", { method: "POST", body: { name: "Product Team" } });
  const workspaceId = created.workspace.id;
  console.log("created workspace", workspaceId);

  const channels = await request(`/api/workspaces/${workspaceId}/channels`, { workspaceId });
  const channel = channels[0];
  console.log("default channel", channel.id, channel.name);

  const linkedChannel = await request(`/api/channels/${channel.id}`, {
    method: "PATCH",
    workspaceId,
    body: { linkedGithubRepo: "dev-Adhithiya/CoWork" },
  });
  console.log("linked repo", linkedChannel.linkedGithubRepo);

  const message = await request(`/api/channels/${channel.id}/messages`, {
    method: "POST",
    workspaceId,
    body: { content: "Testing team chat with bare #1 and explicit @github dev-Adhithiya/CoWork#1" },
  });
  console.log("message", message.id, "mentions", message.mentions.length);

  const listed = await request(`/api/channels/${channel.id}/messages`, { workspaceId });
  console.log("listed messages", listed.count);

  const task = await request("/tasks", { method: "POST", workspaceId, body: { title: "Workspace scoped task" } });
  const tasks = await request("/tasks", { workspaceId });
  console.log("task scoped", task.workspaceId === workspaceId, tasks.count);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
