import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { Send, User } from 'lucide-react';

export function TeamChatPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'team_messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'team_messages'), {
        text: newMessage,
        userId: user.user_id,
        userName: user.name || 'Team Member',
        userPicture: user.picture || '',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <h3 className="text-sm font-semibold text-white">Team Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.userId === user?.user_id ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {msg.userPicture ? (
                <img src={msg.userPicture} alt={msg.userName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-white/60" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.userId === user?.user_id
                  ? 'bg-blue-500/80 text-white rounded-tr-sm'
                  : 'bg-white/10 text-white/90 rounded-tl-sm'
              }`}
            >
              <div className="text-[10px] opacity-60 mb-1 flex justify-between gap-2">
                <span>{msg.userName}</span>
              </div>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-black/20 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message team..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
