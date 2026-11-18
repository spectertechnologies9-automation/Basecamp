'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Flame, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';

export function CampfireView({ project, channelId: initChannelId, messages: initMessages, currentUserId }: any) {
  const [messages, setMessages] = useState<any[]>(initMessages || []);
  const [channelId, setChannelId] = useState(initChannelId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/chat`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.messages) {
          setMessages(json.data.messages);
        }
        if (json.data?.channelId && !channelId) {
          setChannelId(json.data.channelId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const bodyToSend = text.trim();
    setText('');

    try {
      const res = await fetch(`/api/projects/${project.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          body: bodyToSend,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMessages((m) => [...m, json.data]);
        }
      } else {
        setText(bodyToSend);
      }
    } catch {
      setText(bodyToSend);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic poll for new messages
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMessages();
    }, 4000);
    return () => clearInterval(timer);
  }, [project.id, channelId]);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-56px)]">
      <div className="px-5 py-3 border-b flex items-center gap-3" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
        <Link href={`/projects/${project.id}`} className="hover:opacity-80" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
          <ArrowLeft size={16} />
        </Link>
        <Flame size={16} style={{ color: '#E9AC57' }} />
        <h1 className="text-sm font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
          Campfire · {project.name}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm py-10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            No messages yet. Say hello to start the Campfire! 🔥
          </p>
        )}
        {messages.map((m: any) => {
          const isMe = m.author_id === currentUserId;
          const authorName = m.author?.full_name || 'Team Member';
          const avatarColor = getAvatarColor(m.author_id || authorName);

          return (
            <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                style={{ background: avatarColor + '33', color: avatarColor }}
              >
                {getInitials(authorName)}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    {authorName}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                    {formatTimeAgo(m.created_at)}
                  </span>
                </div>
                <div
                  className="px-3.5 py-2 rounded-2xl text-xs leading-relaxed"
                  style={{
                    background: isMe ? 'var(--nf-accent, #39C6AE)' : 'var(--nf-card, #1C2A31)',
                    color: isMe ? '#0B1419' : 'var(--nf-text, #F2F6F8)',
                    border: isMe ? 'none' : '1px solid var(--nf-border, #35464E)',
                  }}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Say something around the campfire..."
          className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none"
          style={{
            background: 'var(--nf-card, #1C2A31)',
            border: '1px solid var(--nf-border, #35464E)',
            color: 'var(--nf-text, #F2F6F8)',
          }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </div>
  );
}
