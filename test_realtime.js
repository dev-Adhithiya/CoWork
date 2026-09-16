import { io } from "socket.io-client";

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
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Realtime Test" } });
  const workspaceId = created.workspace.id;
  const channelId = created.defaultChannel.id;

  const first = io(base, { query: { workspaceId } });
  const second = io(base, { query: { workspaceId } });

  await Promise.all([
    new Promise((resolve) => first.on("connect", resolve)),
    new Promise((resolve) => second.on("connect", resolve)),
  ]);

  first.emit("channel:join", channelId);
  second.emit("channel:join", channelId);

  const received = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for message:new")), 5000);
    second.on("message:new", (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
  });

  await request(`/api/channels/${channelId}/messages`, {
    method: "POST",
    workspaceId,
    body: { content: "Realtime hello" },
  });

  const message = await received;
  console.log("realtime message received", message.content);
  first.disconnect();
  second.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
