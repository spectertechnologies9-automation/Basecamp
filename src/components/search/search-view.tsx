'use client';

import { useState } from 'react';
import { Search, FileText, FolderOpen, Megaphone, FolderArchive, Users, Mail, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchViewProps {
  initialQuery: string;
  projects: any[];
  todos: any[];
  announcements?: any[];
  files?: any[];
  members?: any[];
}

export function SearchView({
  initialQuery,
  projects,
  todos,
  announcements = [],
  files = [],
  members = [],
}: SearchViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const totalResults =
    projects.length + todos.length + announcements.length + files.length + members.length;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-xl font-bold mb-6 text-white font-display">
        Global Workspace Search
      </h1>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, team members, tasks, announcements, docs & files…"
            autoFocus
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none bg-zinc-900 border border-zinc-800 text-white focus:border-orange-500 transition-colors"
          />
        </div>
      </form>

      {!initialQuery ? (
        <p className="text-center text-sm py-12 text-zinc-500 font-mono">
          Type a query above to search across projects, team members, tasks, and files
        </p>
      ) : totalResults === 0 ? (
        <p className="text-center text-sm py-12 text-zinc-500 font-mono">
          No matching records found for &ldquo;{initialQuery}&rdquo;
        </p>
      ) : (
        <div className="space-y-6">
          {/* Team Members */}
          {members.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 text-orange-400 flex items-center gap-1.5">
                <Users size={13} /> Team Members ({members.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-sm"
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-orange-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-sm font-mono shrink-0">
                        {m.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-white truncate">{m.full_name}</p>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-orange-300 font-semibold shrink-0">
                          {m.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">{m.email}</p>
                      {m.bio && (
                        <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 italic">
                          {m.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 text-zinc-400">
                Projects ({projects.length})
              </h2>
              <div className="space-y-2">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-400">
                      <FolderOpen size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-zinc-400">{p.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {todos.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 text-zinc-400">
                Tasks ({todos.length})
              </h2>
              <div className="space-y-2">
                {todos.map((t) => (
                  <Link
                    key={t.id}
                    href={`/projects/${t.project?.id}?tab=todos`}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                  >
                    <FileText size={16} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{t.title}</p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {t.project?.name} • <span className="uppercase text-emerald-400">{t.status}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 text-zinc-400">
                Announcements ({announcements.length})
              </h2>
              <div className="space-y-2">
                {announcements.map((a) => (
                  <Link
                    key={a.id}
                    href={`/projects/${a.project_id}?tab=message-board`}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                  >
                    <Megaphone size={16} className="text-sky-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{a.title}</p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {a.project_name} • <span className="uppercase text-sky-400">{a.category}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Docs & Files */}
          {files.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider mb-3 text-zinc-400">
                Docs &amp; Files ({files.length})
              </h2>
              <div className="space-y-2">
                {files.map((f) => (
                  <Link
                    key={f.id}
                    href={`/projects/${f.project_id}?tab=docs-files`}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                  >
                    <FolderArchive size={16} className="text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{f.name}</p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {f.project_name} • <span className="uppercase text-orange-400">{f.category}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
