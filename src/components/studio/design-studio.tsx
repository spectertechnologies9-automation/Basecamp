'use client';

import { useState, useCallback } from 'react';
import {
  Palette,
  Sliders,
  Layers,
  Zap,
  Save,
  RotateCcw,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toaster';
import type { Module } from '@/types';

interface DesignStudioProps {
  initialTokens: Record<string, string>;
  modules: Module[];
}

// Default NexaFlow design tokens
const DEFAULT_TOKENS: Record<string, string> = {
  '--nf-bg': '#0B1419',
  '--nf-panel': '#131E24',
  '--nf-card': '#1C2A31',
  '--nf-card-raised': '#22333B',
  '--nf-border': '#35464E',
  '--nf-text': '#F2F6F8',
  '--nf-text-muted': '#AAB8C0',
  '--nf-accent': '#39C6AE',
  '--nf-accent-hover': '#2EADA0',
  '--nf-warning': '#E9AC57',
  '--nf-danger': '#E56B70',
  '--nf-success': '#52B788',
};

const TOKEN_LABELS: Record<string, string> = {
  '--nf-bg': 'Background',
  '--nf-panel': 'Panel / Sidebar',
  '--nf-card': 'Card',
  '--nf-card-raised': 'Raised Card',
  '--nf-border': 'Border',
  '--nf-text': 'Primary Text',
  '--nf-text-muted': 'Secondary Text',
  '--nf-accent': 'Accent / Primary',
  '--nf-accent-hover': 'Accent Hover',
  '--nf-warning': 'Warning',
  '--nf-danger': 'Danger / Error',
  '--nf-success': 'Success',
};

type Tab = 'tokens' | 'modules' | 'layout' | 'automation';

export function DesignStudio({ initialTokens, modules: initialModules }: DesignStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tokens');
  const [tokens, setTokens] = useState<Record<string, string>>({
    ...DEFAULT_TOKENS,
    ...initialTokens,
  });
  const [modules, setModules] = useState(initialModules);
  const [saving, setSaving] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const applyPreview = useCallback((t: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(t).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  const handleTokenChange = (key: string, value: string) => {
    const next = { ...tokens, [key]: value };
    setTokens(next);
    if (previewActive) applyPreview(next);
  };

  const resetTokens = () => {
    setTokens(DEFAULT_TOKENS);
    if (previewActive) applyPreview(DEFAULT_TOKENS);
  };

  const togglePreview = () => {
    if (!previewActive) {
      applyPreview(tokens);
      setPreviewActive(true);
    } else {
      applyPreview(DEFAULT_TOKENS);
      setPreviewActive(false);
    }
  };

  const saveTokens = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/studio/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedAt(new Date());
      toast({ title: 'Design tokens published', variant: 'success' as any });
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = async (moduleId: string, enabled: boolean) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, is_enabled: enabled } : m));
    // TODO: API call to update module
    toast({ title: `Module ${enabled ? 'enabled' : 'disabled'}` });
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'tokens', label: 'Design Tokens', icon: Palette },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'layout', label: 'Layout Config', icon: Sliders },
    { id: 'automation', label: 'Automations', icon: Zap },
  ];

  return (
    <div className="min-h-full" style={{ background: 'var(--nf-bg)' }}>
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm hover:opacity-80"
            style={{ color: 'var(--nf-text-muted)' }}
          >
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--nf-text)' }}>
              Design &amp; Automation Studio
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>
              Customize your NexaFlow workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--nf-accent)' }}>
              <CheckCircle2 size={12} />
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={togglePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: previewActive ? 'var(--nf-accent)22' : 'transparent',
              borderColor: previewActive ? 'var(--nf-accent)' : 'var(--nf-border)',
              color: previewActive ? 'var(--nf-accent)' : 'var(--nf-text-muted)',
            }}
          >
            <Eye size={13} />
            {previewActive ? 'Preview ON' : 'Preview'}
          </button>
          <button
            onClick={resetTokens}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors"
            style={{ borderColor: 'var(--nf-border)', color: 'var(--nf-text-muted)' }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={saveTokens}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
          >
            <Save size={13} />
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-var(--header-height)-57px)]">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 border-r p-3" style={{ borderColor: 'var(--nf-border)', background: 'var(--nf-panel)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 text-left transition-colors"
                style={{
                  background: activeTab === tab.id ? 'var(--nf-accent)22' : 'transparent',
                  color: activeTab === tab.id ? 'var(--nf-accent)' : 'var(--nf-text-muted)',
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'tokens' && (
            <TokensEditor tokens={tokens} onChange={handleTokenChange} />
          )}
          {activeTab === 'modules' && (
            <ModulesEditor modules={modules} onToggle={toggleModule} />
          )}
          {activeTab === 'layout' && (
            <PlaceholderSection
              title="Layout Configuration"
              description="Drag-and-drop page layout editor coming soon. Define custom widget positions, column widths, and component visibility per page."
            />
          )}
          {activeTab === 'automation' && (
            <PlaceholderSection
              title="Workflow Automations"
              description="Visual automation rule builder coming soon. Define triggers (task created, due date approaching, etc.) and actions (notify, assign, create, webhook)."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TokensEditor({
  tokens,
  onChange,
}: {
  tokens: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const groups = {
    'Backgrounds': ['--nf-bg', '--nf-panel', '--nf-card', '--nf-card-raised'],
    'Text': ['--nf-text', '--nf-text-muted'],
    'Accents & States': ['--nf-accent', '--nf-accent-hover', '--nf-success', '--nf-warning', '--nf-danger'],
    'Structural': ['--nf-border'],
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--nf-text)' }}>
        Design Tokens
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted)' }}>
        These CSS custom properties control the entire visual appearance of NexaFlow.
        Changes take effect instantly with Preview enabled.
      </p>

      <div className="space-y-6">
        {Object.entries(groups).map(([groupName, keys]) => (
          <div key={groupName}>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--nf-text-muted)' }}
            >
              {groupName}
            </h3>
            <div className="space-y-3">
              {keys.map(key => (
                <div
                  key={key}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background: 'var(--nf-card)', border: '1px solid var(--nf-border)' }}
                >
                  {/* Color swatch + picker */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                      style={{
                        background: tokens[key] ?? '#000',
                        borderColor: 'var(--nf-border)',
                      }}
                    />
                    <input
                      type="color"
                      value={tokens[key] ?? '#000000'}
                      onChange={e => onChange(key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>
                      {TOKEN_LABELS[key] ?? key}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--nf-text-muted)' }}>
                      {key}
                    </p>
                  </div>

                  {/* Hex input */}
                  <input
                    type="text"
                    value={tokens[key] ?? ''}
                    onChange={e => onChange(key, e.target.value)}
                    maxLength={7}
                    className="w-24 px-2 py-1 rounded text-xs font-mono text-center outline-none"
                    style={{
                      background: 'var(--nf-panel)',
                      border: '1px solid var(--nf-border)',
                      color: 'var(--nf-text)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModulesEditor({
  modules,
  onToggle,
}: {
  modules: Module[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--nf-text)' }}>
        Modules
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted)' }}>
        Enable or disable platform features for your organization.
      </p>

      <div className="space-y-3">
        {modules.map(mod => (
          <div
            key={mod.id}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--nf-card)', border: '1px solid var(--nf-border)' }}
          >
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>
                {mod.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--nf-text-muted)' }}>
                {mod.description}
              </p>
              {!(mod as any).is_enabled && (mod as any).config?.status === 'unconfigured' && (
                <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--nf-warning)' }}>
                  <AlertCircle size={10} />
                  Requires configuration
                </p>
              )}
            </div>
            <button
              onClick={() => onToggle(mod.id, !mod.is_enabled)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium"
              style={{ color: mod.is_enabled ? 'var(--nf-accent)' : 'var(--nf-text-muted)' }}
            >
              {mod.is_enabled ? (
                <ToggleRight size={24} style={{ color: 'var(--nf-accent)' }} />
              ) : (
                <ToggleLeft size={24} style={{ color: 'var(--nf-text-muted)' }} />
              )}
              {mod.is_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--nf-card)' }}
      >
        <Zap size={28} style={{ color: 'var(--nf-accent)' }} />
      </div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>{title}</h2>
      <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>{description}</p>
    </div>
  );
}
