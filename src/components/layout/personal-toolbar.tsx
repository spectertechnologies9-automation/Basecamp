'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Palette, Bookmark, Activity, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRolePreview } from '@/hooks/use-role-preview';

const toolbarItems = [
  { href: '/my-tasks', label: 'My Tasks', icon: CheckSquare, iconColor: 'text-emerald-400' },
  { href: '/dashboard?tab=studio', label: 'Design Studio', icon: Palette, iconColor: 'text-fuchsia-400' },
  { href: '/my-activity', label: 'My Activity', icon: Activity, iconColor: 'text-amber-400' },
  { href: '/my-bookmarks', label: 'Bookmarks', icon: Bookmark, iconColor: 'text-orange-400' },
  { href: '/my-notes', label: 'Notes', icon: StickyNote, iconColor: 'text-cyan-400' },
];

export function PersonalToolbar() {
  const pathname = usePathname();
  const { previewRole } = useRolePreview();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setUserProfile(json.data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Effective role check: strictly gated to Admins / Super Admins / Owners
  const effectiveRole = previewRole || userProfile?.role;
  const isAdmin = effectiveRole === 'super_admin' || effectiveRole === 'admin' || effectiveRole === 'owner';

  if (!loaded || !isAdmin) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-center border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl flex-shrink-0 px-4"
      style={{
        height: 'var(--personal-toolbar-height)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {toolbarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95',
                isActive
                  ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              )}
            >
              <Icon size={14} className={item.iconColor} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
