'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  ArrowLeft,
  Bell,
  Send,
  CheckCheck,
  MessageSquare,
  CheckSquare,
  Calendar,
  Users,
} from 'lucide-react';
import { useNotificationPanel } from '@/hooks/use-notification-panel';
import { formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/types';

export function NotificationPanel() {
  const { isOpen, close } = useNotificationPanel();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pingTarget, setPingTarget] = useState('');
  const [pingMessage, setPingMessage] = useState('');
  const [view, setView] = useState<'new' | 'all'>('new');

  useEffect(() => {
    if (!isOpen) return;
    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:users(id,full_name,avatar_url), project:projects(id,name)')
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();
  }, [isOpen]);

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleSendPing = async () => {
    if (!pingTarget.trim() || !pingMessage.trim()) return;
    // TODO: Implement send ping via API
    setPingTarget('');
    setPingMessage('');
  };

  const newNotifications = notifications.filter((n) => !n.is_read);
  const displayedNotifications = view === 'new' ? newNotifications : notifications;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={close}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 'var(--notification-panel-width)',
          background: 'var(--nf-panel)',
          borderLeft: '1px solid var(--nf-border)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--nf-border)' }}
        >
          <button
            onClick={close}
            className="p-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => setView('new')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'new' ? 'text-white' : ''
              }`}
              style={{
                background: view === 'new' ? 'var(--nf-accent)' : 'transparent',
                color: view === 'new' ? '#0B1419' : 'var(--nf-text-muted)',
              }}
            >
              <Bell size={12} />
              Pings +
              {newNotifications.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1 rounded-full"
                  style={{ background: 'var(--nf-danger)', color: 'white' }}
                >
                  {newNotifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('all')}
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={{ color: 'var(--nf-text-muted)' }}
            >
              New for you
            </button>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Ping someone */}
        <div
          className="p-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--nf-border)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>
            Ping someone
          </p>
          <div
            className="rounded-lg p-3"
            style={{ background: 'var(--nf-card)', border: '1px solid var(--nf-border)' }}
          >
            <input
              type="text"
              value={pingTarget}
              onChange={(e) => setPingTarget(e.target.value)}
              placeholder="Type a name..."
              className="w-full text-sm outline-none mb-2"
              style={{ background: 'transparent', color: 'var(--nf-text)' }}
            />
            <div className="flex items-end gap-2">
              <textarea
                value={pingMessage}
                onChange={(e) => setPingMessage(e.target.value)}
                placeholder="Write a message..."
                rows={2}
                className="flex-1 text-sm outline-none resize-none"
                style={{ background: 'transparent', color: 'var(--nf-text)' }}
              />
              <button
                onClick={handleSendPing}
                disabled={!pingTarget.trim() || !pingMessage.trim()}
                className="p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--nf-text-muted)' }}>
            Pings are direct messages — just click +, type someone&apos;s name, and send them a private message.
          </p>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="flex items-center justify-between px-4 py-2 sticky top-0"
            style={{ background: 'var(--nf-panel)', borderBottom: `1px solid var(--nf-border)` }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--nf-text)' }}>
              {view === 'new' ? 'New for you' : 'All notifications'}
            </p>
            {newNotifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs transition-colors hover:underline"
                style={{ color: 'var(--nf-accent)' }}
              >
                <CheckCheck size={12} />
                Mark all as read
              </button>
            )}
          </div>

          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell size={28} className="mb-3 opacity-30" style={{ color: 'var(--nf-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>
                {view === 'new' ? "You're all caught up!" : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {displayedNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={() => markRead(notif.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0"
          style={{ borderColor: 'var(--nf-border)' }}
        >
          <Link
            href="/settings/notifications"
            className="text-xs hover:underline"
            style={{ color: 'var(--nf-text-muted)' }}
            onClick={close}
          >
            Notification settings
          </Link>
          <button
            className="text-xs hover:underline"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            Shhh
          </button>
        </div>
      </div>
    </>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const actor = notification.actor;
  const name = actor?.full_name ?? 'Someone';
  const bg = getAvatarColor(actor?.id ?? name);

  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_completed':
        return <CheckSquare size={12} style={{ color: 'var(--nf-accent)' }} />;
      case 'direct_message':
      case 'comment_mention':
        return <MessageSquare size={12} style={{ color: 'var(--nf-accent)' }} />;
      case 'project_invitation':
        return <Users size={12} style={{ color: 'var(--nf-accent)' }} />;
      case 'check_in_reminder':
        return <Calendar size={12} style={{ color: 'var(--nf-accent)' }} />;
      default:
        return <Bell size={12} style={{ color: 'var(--nf-accent)' }} />;
    }
  };

  return (
    <div
      className={`flex gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
        !notification.is_read ? 'hover:bg-white/5' : 'opacity-60 hover:bg-white/3'
      }`}
      onClick={onMarkRead}
      style={{
        background: !notification.is_read ? 'var(--nf-card)' : 'transparent',
        border: !notification.is_read ? '1px solid var(--nf-border)' : '1px solid transparent',
      }}
    >
      {/* Actor avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
          style={{ background: bg + '33', color: bg }}
        >
          {actor?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={actor.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border"
          style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)' }}
        >
          {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--nf-text)' }}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--nf-text-muted)' }}>
            {notification.body}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px]" style={{ color: 'var(--nf-text-muted)' }}>
            {formatTimeAgo(notification.created_at)}
          </span>
          {notification.project && (
            <span className="text-[10px] hover:underline" style={{ color: 'var(--nf-accent)' }}>
              {notification.project.name}
            </span>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1 animate-pulse-dot"
          style={{ background: 'var(--nf-danger)' }}
        />
      )}
    </div>
  );
}
