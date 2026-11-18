'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Plus,
  Keyboard,
  Eye,
  EyeOff,
  UserPlus,
  LayoutGrid,
  FolderKanban,
  Shield,
  Check,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGlobalNav } from '@/hooks/use-global-nav';
import { useRolePreview, type AppRole } from '@/hooks/use-role-preview';
import { InviteUserDialog } from '@/components/invite-user-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatTimeAgo } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  brand_manager: 'Team Lead',
  team_member: 'Team Member',
  client: 'Client',
};

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { open: openGlobalNav } = useGlobalNav();
  const { previewRole, setPreviewRole } = useRolePreview();
  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Authenticated user state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setUserProfile(json.data);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setNotifications(json.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push('/auth/login');
    router.refresh();
  };

  const isHome = pathname === '/' || pathname === '/dashboard';
  const isProjects = pathname.startsWith('/projects');

  // Strict role check: Only real Admins / Owners can swap roles in the UI
  const isRealAdmin =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'owner' ||
    userProfile?.email?.toLowerCase().includes('admin');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <header className="rf-topbar flex items-center justify-between px-4 sm:px-8 h-[60px] border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 flex-shrink-0 transition-colors">
        {/* Left: Brand + Nav Pills */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-xs font-mono shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-white hidden sm:block uppercase group-hover:text-zinc-200 transition-colors">
              SPECTER OS
            </span>
          </Link>

          {/* Navigation Pills */}
          <nav className="flex items-center gap-1.5">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                isHome
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <LayoutGrid size={13} className="text-sky-400" />
              <span>HOME</span>
            </Link>

            <Link
              href="/projects"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                isProjects
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <FolderKanban size={13} className="text-amber-400" />
              <span>PROJECTS</span>
            </Link>
          </nav>
        </div>

        {/* Right: Search, Notifications, Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Search Trigger */}
          <button
            onClick={openGlobalNav}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-sm"
          >
            <Search size={13} className="text-orange-400" />
            <span>SEARCH</span>
            <kbd className="px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Role Display & Switcher (Only Admins can swap roles; others see read-only badge) */}
          {isRealAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 uppercase tracking-wider shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                  <span>ROLE: {roleLabels[previewRole || 'admin'].toUpperCase()}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200 rounded-2xl shadow-2xl p-1.5">
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Active User Role &amp; Access
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Controls permissions and views
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800/80" />
                {(Object.keys(roleLabels) as AppRole[]).map((r) => {
                  const isSelected = (previewRole || 'admin') === r;
                  const canCreate = r === 'admin' || r === 'brand_manager';
                  return (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => setPreviewRole(r)}
                      className={`gap-2 text-xs font-mono uppercase cursor-pointer rounded-xl hover:bg-zinc-800 flex items-center justify-between ${
                        isSelected ? 'text-orange-400 font-semibold bg-orange-500/10' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                        {roleLabels[r]}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${canCreate ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-500'}`}>
                        {canCreate ? 'CAN CREATE' : 'VIEW ONLY'}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                {previewRole && previewRole !== 'admin' && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => setPreviewRole('admin')}
                      className="gap-2 text-xs font-mono uppercase text-zinc-400 cursor-pointer rounded-xl hover:bg-zinc-800"
                    >
                      <Shield className="h-3.5 w-3.5 text-violet-400" /> Reset to Admin
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/80 text-zinc-300 uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-violet-400" />
              <span>ROLE: {(userProfile?.role || 'member').toUpperCase()}</span>
            </div>
          )}

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 relative"
                aria-label="Notifications"
                onClick={fetchNotifications}
              >
                <Bell size={16} className="text-amber-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-zinc-950 animate-pulse" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 bg-zinc-900 border-zinc-800 text-zinc-200 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-orange-400 font-semibold">
                    {unreadCount} unread
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-500 font-mono">
                    No notifications yet ☕
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.action_url || '/dashboard'}
                      className={`block p-3 hover:bg-zinc-800/60 transition-colors ${
                        !n.is_read ? 'bg-orange-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{n.title}</h4>
                        <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                      )}
                      {n.project?.name && (
                        <span className="text-[9px] font-mono uppercase text-orange-400 mt-1 block">
                          {n.project.name}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar with Real Name and Email */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-orange-500/50 transition-all">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'User'}
                    className="w-7 h-7 rounded-full object-cover shadow-sm border border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs font-mono shadow-sm">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200 shadow-xl">
              <div className="px-3.5 py-2.5 border-b border-zinc-800">
                <p className="text-xs font-bold text-white font-mono truncate">
                  {userProfile?.display_name || userProfile?.full_name || 'Member'}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  {userProfile?.email || 'user@nexaflow.local'}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold border ${
                      userProfile?.role === 'role_not_assigned' || !userProfile?.role
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-zinc-800 border-zinc-700 text-orange-400'
                    }`}
                  >
                    {ROLE_LABELS[userProfile?.role] ||
                      (userProfile?.role === 'role_not_assigned'
                        ? 'Role Not Assigned'
                        : userProfile?.role || 'Role Not Assigned')}
                  </span>
                </div>
              </div>
              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="gap-2 text-xs font-mono uppercase cursor-pointer hover:bg-zinc-800 rounded-xl"
                >
                  <User size={13} className="text-indigo-400" /> Profile &amp; Bio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="gap-2 text-xs font-mono uppercase cursor-pointer hover:bg-zinc-800 rounded-xl"
                >
                  <Settings size={13} className="text-teal-400" /> Settings
                </DropdownMenuItem>
                {isRealAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push('/admin')}
                    className="gap-2 text-xs font-mono uppercase cursor-pointer text-orange-400 hover:bg-orange-950/30 rounded-xl"
                  >
                    <Shield size={13} className="text-violet-400" /> Admin Portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 text-xs font-mono uppercase cursor-pointer text-rose-400 hover:bg-rose-950/30 rounded-xl"
                >
                  <LogOut size={13} className="text-rose-400" /> Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
