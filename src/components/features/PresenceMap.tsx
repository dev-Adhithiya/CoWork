import { useEffect, useRef, useState } from 'react';
import { DoorOpen, MapPin, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthHeaders, getWorkspaceHeaders } from '../../lib/api';

interface Workspace { id: string; name: string }
interface RoomOccupant { userId: string; userName: string; userPicture?: string; enteredAt: string }
interface Room { id: string; workspaceId: string; name: string; occupants?: RoomOccupant[] }

export function PresenceMap() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [status, setStatus] = useState('Loading workspace map...');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetch('/api/workspaces', { headers: getAuthHeaders() })
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
    const headers = getWorkspaceHeaders(workspaceId);
    fetch(`/api/workspaces/${workspaceId}/presence/rooms`, { headers })
      .then((response) => {
        if (!response.ok) throw new Error('presence request failed');
        return response.json();
      })
      .then((data) => {
        setRooms(data.rooms || []);
        setStatus(data.rooms?.length ? '' : 'No rooms have been created in this workspace.');
      })
      .catch(() => setStatus('Could not connect to live room presence.'));

    const socket = io('/', { query: { workspaceId }, auth: { token: localStorage.getItem('access_token') || '' } });
    socketRef.current = socket;
    socket.on('connect', () => setStatus('Live presence connected.'));
    socket.on('connect_error', () => setStatus('Room list loaded, but live presence is unavailable.'));
    socket.on('room:presence', (payload: { rooms?: Room[] }) => {
      if (payload.rooms) {
        setRooms(payload.rooms);
        const active = payload.rooms.find((room) => room.occupants?.some((occupant) => occupant.userId === user?.user_id));
        setCurrentRoomId(active?.id || '');
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [workspaceId, user?.user_id]);

  const enterRoom = (roomId: string) => {
    if (!socketRef.current) return;
    if (currentRoomId && currentRoomId !== roomId) socketRef.current.emit('room:leave', { roomId: currentRoomId });
    socketRef.current.emit('room:enter', { roomId });
    setCurrentRoomId(roomId);
  };

  const leaveRoom = (roomId: string) => {
    socketRef.current?.emit('room:leave', { roomId });
    setCurrentRoomId('');
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-300/15 bg-emerald-950/10">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-emerald-300/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">Live presence</p>
          <h2 className="mt-1 text-lg font-semibold text-white">The workspace map</h2>
        </div>
        <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white focus:outline-none">
          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
        </select>
      </div>
      {status && <div className="border-b border-emerald-300/10 bg-emerald-400/5 px-5 py-2 text-xs text-emerald-100/70">{status}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid min-h-full auto-rows-[minmax(150px,1fr)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room, index) => {
            const active = currentRoomId === room.id;
            return (
              <button key={room.id} onClick={() => active ? leaveRoom(room.id) : enterRoom(room.id)} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-300/50 bg-emerald-400/15 shadow-lg shadow-emerald-950/30' : 'border-white/10 bg-white/[0.04] hover:border-emerald-300/30 hover:bg-emerald-400/[0.08]'}`}>
                <div className="absolute right-4 top-4 text-white/20">{active ? <DoorOpen className="h-6 w-6 text-emerald-200" /> : <MapPin className="h-6 w-6" />}</div>
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-8 text-[10px] uppercase tracking-[0.18em] text-white/30">Zone {String(index + 1).padStart(2, '0')}</div>
                    <h3 className="text-lg font-semibold text-white/90">{room.name}</h3>
                    <p className="mt-1 text-xs text-white/40">{active ? 'You are here' : 'Click to enter this room'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(room.occupants || []).slice(0, 6).map((occupant) => <div key={occupant.userId} title={occupant.userName} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#0d1f1c] bg-white/10">{occupant.userPicture ? <img src={occupant.userPicture} alt={occupant.userName} className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-white/60" />}</div>)}
                    </div>
                    <span className="text-xs text-white/45">{room.occupants?.length || 0} present</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PresenceMap;
