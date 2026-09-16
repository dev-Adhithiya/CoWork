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

async function waitFor(socket, eventName, predicate) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), 5000);
    socket.on(eventName, (payload) => {
      if (!predicate || predicate(payload)) {
        clearTimeout(timeout);
        resolve(payload);
      }
    });
  });
}

async function main() {
  const login = await request("/auth/login", { method: "POST", body: { name: "Presence Tester", email: "presence@example.com" } });
  const created = await request("/api/workspaces", { method: "POST", body: { name: "Presence Test" } });
  const workspaceId = created.workspace.id;
  const rooms = await request(`/api/workspaces/${workspaceId}/rooms`, { workspaceId });
  const room = rooms[0];

  const socket = io(base, { query: { workspaceId }, auth: { token: login.token } });
  await waitFor(socket, "connect");
  socket.emit("room:enter", { roomId: room.id });
  await waitFor(socket, "room:presence", (payload) => payload.rooms?.some((item) => item.id === room.id && item.occupants?.length === 1));

  const enteredSnapshot = await request(`/api/workspaces/${workspaceId}/presence/rooms`, { workspaceId });
  const enteredRoom = enteredSnapshot.rooms.find((item) => item.id === room.id);
  console.log("entered occupants", enteredRoom.occupants.length);

  socket.emit("room:leave", { roomId: room.id });
  await waitFor(socket, "room:presence", (payload) => payload.rooms?.some((item) => item.id === room.id && item.occupants?.length === 0));
  const leftSnapshot = await request(`/api/workspaces/${workspaceId}/presence/rooms`, { workspaceId });
  const leftRoom = leftSnapshot.rooms.find((item) => item.id === room.id);
  console.log("left occupants", leftRoom.occupants.length);
  socket.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
