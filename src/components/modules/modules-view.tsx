'use client';

import { useState } from 'react';
import {
  Layers,
  Flame,
  MessageSquare,
  LayoutGrid,
  Mountain,
  CheckCircle2,
  FileText,
  Clock,
  MessagesSquare,
  Sparkles,
  Check,
} from 'lucide-react';

interface ModuleItem {
  key: string;
  name: string;
  description: string;
  icon: any;
  category: 'collaboration' | 'tracking' | 'intelligence';
}

const MODULE_LIST: ModuleItem[] = [
  {
    key: 'campfire',
    name: 'Campfire Real-time Chat',
    description: 'Casual group chat and fast back-and-forth for every project team.',
    icon: Flame,
    category: 'collaboration',
  },
  {
    key: 'message_board',
    name: 'Message Board',
    description: 'Centralized pitches, major milestone announcements, and project decisions.',
    icon: MessageSquare,
    category: 'collaboration',
  },
  {
    key: 'card_table',
    name: 'Card Table (Kanban)',
    description: 'Visual work-in-progress columns with step-by-step card progression.',
    icon: LayoutGrid,
    category: 'tracking',
  },
  {
    key: 'hill_chart',
    name: 'Hill Charts',
    description: 'Scope certainty tracking: see what is being figured out vs. what is ready to ship.',
    icon: Mountain,
    category: 'tracking',
  },
  {
    key: 'check_ins',
    name: 'Automatic Check-ins',
    description: 'Recurring automated questions replacing synchronous status meetings.',
    icon: CheckCircle2,
    category: 'collaboration',
  },
  {
    key: 'docs',
    name: 'Docs & Files',
    description: 'Organized knowledge base, markdown specifications, and file assets.',
    icon: FileText,
    category: 'collaboration',
  },
  {
    key: 'time_tracking',
    name: 'Time Tracking',
    description: 'Log and review billable hours and team throughput across all projects.',
    icon: Clock,
    category: 'tracking',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Communications Hub',
    description: 'Two-way automated WhatsApp assistant and task alerts via Meta Cloud API.',
    icon: MessagesSquare,
    category: 'intelligence',
  },
  {
    key: 'ai_assistant',
    name: 'Gemini AI Assistant',
    description: 'Intelligent project breakdowns, meeting recaps, and task planning.',
    icon: Sparkles,
    category: 'intelligence',
  },
];

export function ModulesView({ initialModules }: { initialModules: Record<string, boolean> }) {
  const [modules, setModules] = useState<Record<string, boolean>>(initialModules || {});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const toggleModule = async (key: string) => {
    const nextState = !modules[key];
    setModules((prev) => ({ ...prev, [key]: nextState }));
    setSavingKey(key);

    try {
      await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: nextState }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSavingKey(null), 500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-amber-400 bg-amber-500/10">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Feature Modules
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Turn tools and services on or off to tailor NexaFlow to your team workflow
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULE_LIST.map((mod) => {
          const Icon = mod.icon;
          const isEnabled = modules[mod.key] !== false;
          const isSaving = savingKey === mod.key;

          return (
            <div
              key={mod.key}
              className="p-5 rounded-2xl border flex flex-col justify-between transition-all"
              style={{
                background: 'var(--nf-panel, #131E24)',
                borderColor: isEnabled ? 'var(--nf-border, #35464E)' : 'rgba(255,255,255,0.05)',
                opacity: isEnabled ? 1 : 0.7,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isEnabled ? 'rgba(57,198,174,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isEnabled ? 'var(--nf-accent, #39C6AE)' : 'var(--nf-text-muted, #AAB8C0)',
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <button
                    onClick={() => toggleModule(mod.key)}
                    className="relative w-11 h-6 rounded-full transition-colors focus:outline-none"
                    style={{
                      background: isEnabled ? 'var(--nf-accent, #39C6AE)' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <span
                      className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform bg-white shadow"
                      style={{
                        transform: isEnabled ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>

                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  {mod.name}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {mod.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                <span className="capitalize" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {mod.category}
                </span>
                <span className="font-semibold" style={{ color: isEnabled ? '#52B788' : 'var(--nf-text-muted, #AAB8C0)' }}>
                  {isSaving ? 'Saving...' : isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
