'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Palette,
  Layers,
  CheckSquare,
  Calendar,
  FileText,
  BarChart2,
  Globe,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const workspaceNavItems = [
  { href: '/dashboard', label: 'Projects & Work', icon: LayoutDashboard },
  { href: '/dashboard?tab=craft', label: 'Craft & Merit', icon: Trophy },
  { href: '/dashboard?tab=whatsapp', label: 'WhatsApp Hub', icon: MessagesSquare, badgeText: 'Live' },
  { href: '/dashboard?tab=team', label: 'Team Directory', icon: Users },
  { href: '/dashboard?tab=studio', label: 'Design Studio', icon: Palette },
  { href: '/dashboard?tab=modules', label: 'Feature Modules', icon: Layers },
];

const productivityNavItems = [
  { href: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/activity', label: 'Activity', icon: BarChart2 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/everything', label: 'Everything', icon: Globe },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-[var(--sidebar-width)] flex-shrink-0 flex flex-col border-r h-full overflow-y-auto justify-between',
        className
      )}
      style={{
        background: 'var(--nf-panel)',
        borderColor: 'var(--nf-border)',
      }}
    >
      {/* Main navigation */}
      <nav className="p-3">
        <div className="mb-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 mb-1"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            Workspace
          </p>
          {workspaceNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badgeText={item.badgeText}
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            />
          ))}
        </div>

        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 mb-1"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            Productivity
          </p>
          {productivityNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}
        </div>
      </nav>

      {/* Discrete Admin Link at bottom */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--nf-border)' }}>
        <Link
          href="/admin/login"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--nf-text-muted)] hover:text-white hover:bg-white/5 transition-colors"
        >
          <ShieldAlert size={14} className="text-amber-400/80" />
          <span>Admin Access Gate</span>
        </Link>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  badgeText,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  isActive: boolean;
  badgeText?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors mb-0.5 group',
        isActive ? 'font-semibold' : 'font-normal hover:opacity-80'
      )}
      style={{
        background: isActive ? 'rgba(57,198,174,0.12)' : 'transparent',
        color: isActive ? 'var(--nf-accent)' : 'var(--nf-text-muted)',
      }}
    >
      <Icon size={15} />
      <span className="flex-1 truncate">{label}</span>
      {badgeText && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider"
          style={{ background: 'rgba(57,198,174,0.2)', color: 'var(--nf-accent)' }}
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
}
