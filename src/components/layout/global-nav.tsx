'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Activity,
  Calendar,
  BarChart2,
  Globe,
  Clock,
  FolderOpen,
  User,
  Users,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { useGlobalNav } from '@/hooks/use-global-nav';

interface RecentItem {
  id: string;
  name: string;
  href: string;
  type: 'project' | 'page' | 'person';
}

const globalNavLinks = [
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/everything', label: 'Everything', icon: Globe },
];

const defaultRecent: RecentItem[] = [
  { id: '1', name: 'Dashboard', href: '/dashboard', type: 'page' },
  { id: '2', name: 'My Tasks', href: '/my-tasks', type: 'page' },
  { id: '3', name: 'All Projects', href: '/projects', type: 'project' },
];

export function GlobalNav() {
  const { isOpen, close } = useGlobalNav();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recent] = useState<RecentItem[]>(defaultRecent);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [liveResults, setLiveResults] = useState<{
    projects: any[];
    members: any[];
    todos: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load user profile to gate admin link
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => {});
  }, []);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'owner' ||
    currentUser?.email?.includes('admin');

  // Keyboard shortcut: Cmd/Ctrl + K or Shift + J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.shiftKey && e.key === 'J')) {
        e.preventDefault();
        useGlobalNav.getState().toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Live search when typing
  useEffect(() => {
    if (!query.trim()) {
      setLiveResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setLiveResults({
              projects: json.data.projects || [],
              members: json.data.members || [],
              todos: json.data.todos || [],
            });
          }
        }
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      close();
      setQuery('');
      setLiveResults(null);
    },
    [router, close]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 border border-white/[0.08] shadow-2xl backdrop-blur-2xl"
      >
        {/* Top nav tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-2.5 border-b border-zinc-800/80">
          {(isAdmin
            ? [
                { href: '/activity', label: 'Activity', icon: Activity, iconColor: 'text-amber-400' },
                { href: '/calendar', label: 'Calendar', icon: Calendar, iconColor: 'text-emerald-400' },
                { href: '/reports', label: 'Reports', icon: BarChart2, iconColor: 'text-sky-400' },
                { href: '/everything', label: 'Everything', icon: Globe, iconColor: 'text-purple-400' },
              ]
            : [
                { href: '/calendar', label: 'Calendar', icon: Calendar, iconColor: 'text-emerald-400' },
                { href: '/my-tasks', label: 'My Tasks', icon: Clock, iconColor: 'text-orange-400' },
              ]
          ).map(({ href, label, icon: Icon, iconColor }) => (
            <button
              key={href}
              onClick={() => handleNavigate(href)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider text-zinc-300 transition-all duration-200 hover:text-white hover:bg-zinc-800/80 hover:-translate-y-0.5 active:scale-95"
            >
              <Icon size={16} className={iconColor} />
              <span className="text-[11px] font-sans">{label}</span>
            </button>
          ))}
          <button
            onClick={close}
            className="ml-auto p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search input */}
        <div className="relative px-3.5 pt-3">
          <Search
            size={16}
            className="absolute left-7 top-1/2 translate-y-[10%] pointer-events-none text-orange-400"
          />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team members, projects, tasks, or jump to recent..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs font-sans bg-zinc-950/80 border border-zinc-800/80 text-white placeholder-zinc-500 outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
          {isSearching && (
            <Loader2
              size={14}
              className="absolute right-6 top-1/2 translate-y-[10%] animate-spin text-orange-400"
            />
          )}
        </div>

        {/* Content */}
        <div className="pb-3 px-3.5 pt-3 max-h-96 overflow-y-auto space-y-4">
          {/* Live Search Results */}
          {liveResults ? (
            <div className="space-y-4">
              {/* Team Members in live search */}
              {liveResults.members.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Users size={12} className="text-indigo-400" /> Team Members ({liveResults.members.length})
                  </p>
                  <div className="space-y-1">
                    {liveResults.members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleNavigate(`/search?q=${encodeURIComponent(m.full_name)}`)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-zinc-950/70 border border-zinc-800/80 hover:border-orange-500/50 hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={m.full_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                              {m.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-semibold text-white block leading-tight">
                              {m.full_name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {m.email}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-orange-300">
                          {m.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects in live search */}
              {liveResults.projects.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <FolderOpen size={12} className="text-amber-400" /> Projects ({liveResults.projects.length})
                  </p>
                  <div className="space-y-1">
                    {liveResults.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleNavigate(`/projects/${p.id}`)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-left bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-xs text-white"
                      >
                        <FolderOpen size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Todos in live search */}
              {liveResults.todos.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <FileText size={12} className="text-emerald-400" /> Tasks ({liveResults.todos.length})
                  </p>
                  <div className="space-y-1">
                    {liveResults.todos.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleNavigate(`/projects/${t.project_id}?tab=todos`)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-xs text-white"
                      >
                        <span className="truncate text-xs">{t.title}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase shrink-0">
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {liveResults.members.length === 0 &&
                liveResults.projects.length === 0 &&
                liveResults.todos.length === 0 && (
                  <p className="text-center text-xs py-4 text-zinc-500 font-mono">
                    No immediate suggestions for &ldquo;{query}&rdquo;. Press Enter for full search.
                  </p>
                )}
            </div>
          ) : (
            <>
              {/* Recently visited */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Clock size={11} /> Recently Visited
                </p>
                <div className="space-y-1">
                  {recent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                    >
                      {item.type === 'project' ? (
                        <FolderOpen size={14} className="text-orange-400" />
                      ) : (
                        <Globe size={14} className="text-zinc-500" />
                      )}
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links (Team Directory, Design Studio, and Administration strictly gated to Admin) */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                  Quick Navigation
                </p>
                <div className="space-y-1">
                  {[
                    { href: '/projects', label: 'All Projects', icon: FolderOpen },
                    { href: '/my-tasks', label: 'My Tasks', icon: Clock },
                    ...(isAdmin
                      ? [
                          { href: '/team', label: 'Team Directory', icon: User },
                          { href: '/studio', label: 'Design Studio', icon: Globe },
                          { href: '/admin', label: 'Administration Portal', icon: BarChart2 },
                        ]
                      : []),
                  ].map(({ href, label, icon: Icon }) => (
                    <button
                      key={href}
                      onClick={() => handleNavigate(href)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                    >
                      <Icon size={14} className="text-zinc-400" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex items-center gap-4 bg-zinc-950/60">
          <span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] mr-1 bg-zinc-800 border border-zinc-700 text-zinc-300">
              ↵
            </kbd>
            to select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] mr-1 bg-zinc-800 border border-zinc-700 text-zinc-300">
              Esc
            </kbd>
            to close
          </span>
        </div>
      </div>
    </>
  );
}
