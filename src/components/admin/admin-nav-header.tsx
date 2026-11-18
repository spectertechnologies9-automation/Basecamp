'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Settings,
  Zap,
  MessagesSquare,
  Layers,
  Shield,
  Clock,
  LogOut,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/people', label: 'Team & Roles', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/integrations', label: 'Integrations', icon: Zap },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessagesSquare },
  { href: '/admin/modules', label: 'Modules', icon: Layers },
  { href: '/admin/audit', label: 'Security & Audit', icon: Shield },
  { href: '/admin/time-tracking', label: 'Time Tracking', icon: Clock },
];

export function AdminNavHeader({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleExitAdmin = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <header
      className="border-b flex-shrink-0 z-30"
      style={{
        background: 'var(--nf-panel, #131E24)',
        borderColor: 'var(--nf-border, #35464E)',
      }}
    >
      {/* Top Banner */}
      <div
        className="px-6 py-2.5 flex items-center justify-between border-b"
        style={{
          background: 'rgba(229,107,112,0.08)',
          borderColor: 'rgba(229,107,112,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: '#E56B70',
              color: '#FFFFFF',
            }}
          >
            <ShieldAlert size={12} />
            Administrator Terminal
          </div>
          <span className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Elevated Session: <span className="text-white font-mono">{userEmail}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors"
            style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
          >
            <ArrowLeft size={13} /> Back to Workspace
          </Link>
          <div className="h-3 w-px bg-white/20" />
          <button
            onClick={handleExitAdmin}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={13} /> Exit Admin Session
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="px-6 flex items-center gap-1 overflow-x-auto py-2">
        {ADMIN_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: isActive ? 'var(--nf-card, #1C2A31)' : 'transparent',
                color: isActive ? '#39C6AE' : 'var(--nf-text-muted, #AAB8C0)',
                border: isActive ? '1px solid var(--nf-border, #35464E)' : '1px solid transparent',
              }}
            >
              <Icon size={14} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
