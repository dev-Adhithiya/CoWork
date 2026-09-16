import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Check, DoorOpen, Github, Hash, Loader2, MapPin, Send, Settings, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
}

interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  createdBy: string;
  linkedGithubRepo: string | null;
}

interface RoomOccupant {
  roomId: string;
  userId: string;
  userName: string;
  userPicture?: string;
  enteredAt: string;
}

interface Room {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  occupants?: RoomOccupant[];
}

interface MessageMention {
  type: 'user' | 'github';
  value: string;
  data?: {
    repo: string;
    number: number;
    title?: string;
    state?: 'open' | 'closed' | 'merged';
    author?: string;
    labels?: string[];
    url?: string;
    kind?: 'issue' | 'pull_request';
    resolved: boolean;
    hint?: string;
  };
}

interface TeamMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  mentions: MessageMention[];
}

const apiHeaders = (workspaceId?: string) => ({
  'Content-Type': 'application/json',
  ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
});

export function TeamChatPanel() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [repoDraft, setRepoDraft] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('Loading team workspace...');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChannel = useMemo(() => channels.find((channel) => channel.id === channelId), [channels, channelId]);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((response) => response.json())
      .then((items: Workspace[]) => {
        setWorkspaces(items);
        setWorkspaceId(items[0]?.id || '');
        setStatus(items.length ? '' : 'No workspace found.');
      })
      .catch(() => setStatus('Could not load workspaces.'));
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/channels`, { headers: apiHeaders(workspaceId) })
      .then((response) => response.json())
      .then((items: Channel[]) => {
        setChannels(items);
        setChannelId(items[0]?.id || '');
        setRepoDraft(items[0]?.linkedGithubRepo || '');
      })
      .catch(() => setStatus('Could not load channels.'));
    fetch(`/api/workspaces/${workspaceId}/presence/rooms`, { headers: apiHeaders(workspaceId) })
      .then((response) => response.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(() => setStatus('Could not load room presence.'));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !channelId) return;
    const socket = io('/', { query: { workspaceId } });
    socketRef.current = socket;
    socket.emit('channel:join', channelId);
    socket.on('message:new', (message: TeamMessage) => setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
    socket.on('message:edit', (message: TeamMessage) => setMessages((prev) => prev.map((item) => item.id === message.id ? message : item)));
    socket.on('message:delete', ({ id }: { id: string }) => setMessages((prev) => prev.filter((item) => item.id !== id)));
    socket.on('room:presence', (payload: { rooms?: Room[] }) => {
      if (payload.rooms) {
        setRooms(payload.rooms);
        const active = payload.rooms.find((room) => room.occupants?.some((occupant) => occupant.userId === user?.user_id));
        setCurrentRoomId(active?.id || '');
      }
    });
    return () => {
      socket.emit('channel:leave', channelId);
      socket.disconnect();
    };
  }, [workspaceId, channelId, user?.user_id]);

  useEffect(() => {
    if (!workspaceId || !channelId) return;
    fetch(`/api/channels/${channelId}/messages?limit=50`, { headers: apiHeaders(workspaceId) })
      .then((response) => response.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setStatus('Could not load messages.'));
  }, [workspaceId, channelId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = messageText.trim();
    if (!content || !channelId || !workspaceId) return;
    setMessageText('');
    const response = await fetch(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      headers: apiHeaders(workspaceId),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) setStatus('Message failed to send.');
  };

  const saveRepo = async () => {
    if (!activeChannel) return;
    const response = await fetch(`/api/channels/${activeChannel.id}`, {
      method: 'PATCH',
      headers: apiHeaders(workspaceId),
      body: JSON.stringify({ linkedGithubRepo: repoDraft.trim() || null }),
    });
    if (response.ok) {
      const updated = await response.json();
      setChannels((prev) => prev.map((channel) => channel.id === updated.id ? updated : channel));
      setStatus('Channel repository updated.');
      setTimeout(() => setStatus(''), 2000);
    } else {
      setStatus('Use repo format owner/repo.');
    }
  };

  const saveToken = async () => {
    if (!workspaceId || !githubToken.trim()) return;
    const response = await fetch(`/api/workspaces/${workspaceId}/github`, {
      method: 'PUT',
      headers: apiHeaders(workspaceId),
      body: JSON.stringify({ token: githubToken.trim() }),
    });
    setStatus(response.ok ? 'GitHub token saved for this workspace.' : 'Could not save GitHub token.');
    if (response.ok) setGithubToken('');
    setTimeout(() => setStatus(''), 2500);
  };

  const enterRoom = (roomId: string) => {
    if (!socketRef.current) return;
    if (currentRoomId && currentRoomId !== roomId) {
      socketRef.current.emit('room:leave', { roomId: currentRoomId });
    }
    socketRef.current.emit('room:enter', { roomId });
    setCurrentRoomId(roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketRef.current?.emit('room:leave', { roomId });
    setCurrentRoomId('');
  };

  return (
    <div className="flex h-full min-h-0 bg-white/5">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-black/20 flex flex-col">
        <div className="p-3 border-b border-white/10">
          <select
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
          >
            {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
          </select>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-white/35">Rooms</div>
          <div className="grid gap-2 mb-4">
            {rooms.map((room) => {
              const active = currentRoomId === room.id;
              return (
                <div key={room.id} className={`rounded-lg border p-2 ${active ? 'border-blue-400/40 bg-blue-500/15' : 'border-white/10 bg-white/5'}`}>
                  <button
                    onClick={() => active ? leaveRoom(room.id) : enterRoom(room.id)}
                    className="w-full flex items-center justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm text-white/80">
                      {active ? <DoorOpen className="w-4 h-4 text-blue-300" /> : <MapPin className="w-4 h-4 text-white/45" />}
                      <span className="truncate">{room.name}</span>
                    </span>
                    <span className="text-xs text-white/40">{room.occupants?.length || 0}</span>
                  </button>
                  <div className="mt-2 flex -space-x-1 min-h-6">
                    {(room.occupants || []).slice(0, 5).map((occupant) => (
                      <div key={occupant.userId} title={occupant.userName} className="w-6 h-6 rounded-full border border-black/40 bg-white/10 overflow-hidden flex items-center justify-center">
                        {occupant.userPicture ? <img src={occupant.userPicture} alt={occupant.userName} className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-white/60" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-white/35">Channels</div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => {
                setChannelId(channel.id);
                setRepoDraft(channel.linkedGithubRepo || '');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${channel.id === channelId ? 'bg-blue-500/20 text-blue-100' : 'text-white/70 hover:bg-white/10'}`}
            >
              <Hash className="w-4 h-4" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col">
        <header className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Hash className="w-4 h-4" />
              <span className="truncate">{activeChannel?.name || 'team'}</span>
            </div>
            <div className="text-xs text-white/45 truncate">
              {activeChannel?.linkedGithubRepo ? `GitHub linked: ${activeChannel.linkedGithubRepo}` : 'No GitHub repo linked'}
            </div>
          </div>
          <button
            onClick={() => setShowSettings((value) => !value)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            title="Channel settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </header>

        {showSettings && (
          <div className="px-4 py-3 border-b border-white/10 bg-black/20 grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="flex gap-2">
              <input value={repoDraft} onChange={(event) => setRepoDraft(event.target.value)} placeholder="owner/repo" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none" />
              <button onClick={saveRepo} className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-200 flex items-center justify-center" title="Save repository">
                <Check className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input value={githubToken} onChange={(event) => setGithubToken(event.target.value)} placeholder="GitHub PAT for private repos" type="password" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none" />
              <button onClick={saveToken} className="w-10 h-10 rounded-lg bg-white/10 text-white/80 flex items-center justify-center" title="Save GitHub token">
                <Github className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {status && <div className="px-4 py-2 text-xs text-blue-100 bg-blue-500/10 border-b border-blue-400/20">{status}</div>}

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-sm text-white/45">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Waiting for the first channel message
            </div>
          )}
          {messages.map((message) => {
            const own = message.authorId === user?.user_id;
            return (
              <div key={message.id} className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white/60" />
                </div>
                <div className={`max-w-[78%] ${own ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  <div className={`rounded-lg px-3 py-2 text-sm ${own ? 'bg-blue-500/75 text-white' : 'bg-white/10 text-white/90'}`}>
                    <div className="text-[11px] opacity-65 mb-1">{message.authorName}</div>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  {message.mentions.filter((mention) => mention.type === 'github').map((mention) => (
                    <div key={`${message.id}-${mention.value}`} className="w-full rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-white/75">
                      {mention.data?.resolved ? (
                        <a href={mention.data.url} target="_blank" rel="noreferrer" className="block hover:text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <Github className="w-4 h-4" />
                            <span className="font-semibold">{mention.data.repo}#{mention.data.number}</span>
                            <span className={`px-2 py-0.5 rounded-full ${mention.data.state === 'open' ? 'bg-green-500/20 text-green-200' : mention.data.state === 'merged' ? 'bg-purple-500/20 text-purple-200' : 'bg-red-500/20 text-red-200'}`}>
                              {mention.data.state}
                            </span>
                          </div>
                          <div className="text-white/90">{mention.data.title}</div>
                          <div className="mt-2 flex flex-wrap gap-1 text-white/50">
                            <span>{mention.data.kind}</span>
                            <span>by {mention.data.author}</span>
                            {mention.data.labels?.map((label) => <span key={label} className="px-1.5 py-0.5 rounded bg-white/10">{label}</span>)}
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-100">
                          <X className="w-4 h-4" />
                          <span>{mention.data?.hint || 'Could not resolve GitHub mention.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="p-3 bg-black/20 border-t border-white/10 flex gap-2">
          <input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Message the team, try @github owner/repo#123 or #123..."
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <button type="submit" disabled={!messageText.trim()} className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center disabled:opacity-40" title="Send">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
