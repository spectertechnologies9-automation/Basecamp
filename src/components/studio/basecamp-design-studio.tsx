'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Layout,
  Type,
  Flame,
  MessageSquare,
  CheckSquare,
  FolderOpen,
  Calendar,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Upload,
  Key,
  ShieldCheck,
  Cpu,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { useRolePreview } from '@/hooks/use-role-preview';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BasecampTheme {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  accentHover: string;
  bg: string;
  panel: string;
  card: string;
  cardRaised: string;
  border: string;
  text: string;
  textMuted: string;
}

const BASECAMP_THEMES: BasecampTheme[] = [
  {
    id: 'monochrome_duotone',
    name: 'Executive Duotone (Black & White — Main)',
    tagline: 'High-contrast two-tone precision with deep obsidian background, stark white typography, and razor-sharp borders',
    accent: '#FFFFFF',
    accentHover: '#E4E4E7',
    bg: '#000000',
    panel: '#09090B',
    card: '#121215',
    cardRaised: '#1E1E22',
    border: '#27272A',
    text: '#FFFFFF',
    textMuted: '#A1A1AA',
  },
  {
    id: 'carbon_chalk',
    name: 'Minimal Carbon & Chalk (Two-Tone)',
    tagline: 'Deep carbon background with clean chalk elements, designed for high-focus creative agencies',
    accent: '#F4F4F5',
    accentHover: '#E4E4E7',
    bg: '#0A0A0A',
    panel: '#141414',
    card: '#1C1C1E',
    cardRaised: '#242426',
    border: '#2E2E32',
    text: '#FAFAFA',
    textMuted: '#8E8E93',
  },
  {
    id: 'tofferend_noir',
    name: 'SPECTER OS (Black & White + Brand Orange)',
    tagline: 'The authoritative dark mode with crisp white typography, zinc borders, and vibrant orange accents',
    accent: '#F97316',
    accentHover: '#EA580C',
    bg: '#09090B',
    panel: '#121215',
    card: '#18181B',
    cardRaised: '#27272A',
    border: '#27272A',
    text: '#F4F4F5',
    textMuted: '#A1A1AA',
  },
  {
    id: 'cream_minimal',
    name: 'Editorial Cream & Charcoal',
    tagline: 'Obsidian base paired with elegant cream accents (#ECE8DF) matching project action buttons',
    accent: '#ECE8DF',
    accentHover: '#DFDAD0',
    bg: '#0A0A0C',
    panel: '#131316',
    card: '#1A1A1E',
    cardRaised: '#26262B',
    border: '#2A2A32',
    text: '#FAF9F6',
    textMuted: '#9B9B9F',
  },
  {
    id: 'nordic_slate',
    name: 'Nordic Clean Slate (Slate & Ice Blue)',
    tagline: 'Calm arctic cyan with high-contrast slate surfaces',
    accent: '#38BDF8',
    accentHover: '#0284C7',
    bg: '#0F172A',
    panel: '#1E293B',
    card: '#334155',
    cardRaised: '#475569',
    border: '#475569',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
  },
  {
    id: 'basecamp_classic',
    name: 'Basecamp Classic Jade',
    tagline: 'The iconic Basecamp green accent with dark slate background',
    accent: '#39C6AE',
    accentHover: '#2EADA0',
    bg: '#0B1419',
    panel: '#131E24',
    card: '#1C2A31',
    cardRaised: '#243740',
    border: '#35464E',
    text: '#F2F6F8',
    textMuted: '#AAB8C0',
  },
];

export function BasecampDesignStudio({ initialTokens }: { initialTokens?: Record<string, string> }) {
  const { previewRole } = useRolePreview();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState('monochrome_duotone');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono' | 'custom'>('serif');
  const [cardRounding, setCardRounding] = useState<'md' | 'xl' | '2xl'>('2xl');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customFonts, setCustomFonts] = useState<any[]>([]);
  const [activeCustomFont, setActiveCustomFont] = useState<string | null>(null);
  const [uploadingFont, setUploadingFont] = useState(false);

  // Admin AI Config State
  const [aiConfig, setAiConfig] = useState({
    provider: 'gemini',
    default_model: 'gemini-2.0-flash',
    omni_key: '',
    grok_key: '',
    qwen_key: '',
    gemini_key: '',
    has_omni: false,
    has_grok: false,
    has_qwen: false,
    has_gemini: false,
  });
  const [savingAi, setSavingAi] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nexaflow_theme_id');
      if (savedTheme) setSelectedThemeId(savedTheme);

      const savedFont = (localStorage.getItem('nexaflow_font') as any) || 'serif';
      if (savedFont) setFontStyle(savedFont);
    } catch {}

    fetch('/api/studio/upload-font')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCustomFonts(res.data);
      })
      .catch(() => {});

    fetch('/api/admin/ai-config')
      .then((r) => {
        if (r.ok) {
          setIsAdminUser(true);
          return r.json();
        }
        return null;
      })
      .then((res) => {
        if (res?.data) {
          setAiConfig((prev) => ({
            ...prev,
            ...res.data,
            omni_key: res.data.omni_key || '',
            grok_key: res.data.grok_key || '',
            qwen_key: res.data.qwen_key || '',
            gemini_key: res.data.gemini_key || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAiConfig = async () => {
    setSavingAi(true);
    setAiSaveMsg(null);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider,
          default_model: aiConfig.default_model,
          omni_key: aiConfig.omni_key,
          grok_key: aiConfig.grok_key,
          qwen_key: aiConfig.qwen_key,
          gemini_key: aiConfig.gemini_key,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setAiSaveMsg({ type: 'success', text: 'AI Router configuration saved and activated across all workspace agents!' });
        setTimeout(() => setAiSaveMsg(null), 4000);
        const refreshRes = await fetch('/api/admin/ai-config');
        if (refreshRes.ok) {
          const fresh = await refreshRes.json();
          if (fresh.data) {
            setAiConfig((prev) => ({ ...prev, ...fresh.data }));
          }
        }
      } else {
        setAiSaveMsg({ type: 'error', text: json.error || 'Failed to update AI keys' });
      }
    } catch (err: any) {
      setAiSaveMsg({ type: 'error', text: err.message || 'Network error saving AI configuration' });
    } finally {
      setSavingAi(false);
    }
  };

  const handleApplyFont = (font: 'sans' | 'serif' | 'mono') => {
    setFontStyle(font);
    try {
      localStorage.setItem('nexaflow_font', font);
      if (font === 'serif') {
        document.documentElement.style.setProperty('--font-sans', '"Lora", Georgia, serif');
        document.body.style.fontFamily = '"Lora", Georgia, serif';
      } else if (font === 'mono') {
        document.documentElement.style.setProperty('--font-sans', '"JetBrains Mono", monospace');
        document.body.style.fontFamily = '"JetBrains Mono", monospace';
      } else {
        document.documentElement.style.setProperty('--font-sans', '"Inter", system-ui, sans-serif');
        document.body.style.fontFamily = '"Inter", system-ui, sans-serif';
      }
    } catch {}
  };

  const applyCustomFont = (fontFamily: string, fileUrl: string) => {
    const styleId = `font-face-${fontFamily.replace(/\s+/g, '-')}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `@font-face { font-family: "${fontFamily}"; src: url("${fileUrl}"); }`;
      document.head.appendChild(styleEl);
    }
    document.documentElement.style.setProperty('--font-custom', `"${fontFamily}", sans-serif`);
    setActiveCustomFont(fontFamily);
    setFontStyle('custom');
    try {
      localStorage.setItem('nexaflow_font', 'custom');
    } catch {}
  };

  const handleUploadFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFont(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fontFamily', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const res = await fetch('/api/studio/upload-font', {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const json = await res.json();
        setCustomFonts((prev) => [json.data, ...prev]);
        applyCustomFont(json.data.font_family, json.data.file_url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFont(false);
      e.target.value = '';
    }
  };

  const activeTheme = BASECAMP_THEMES.find((t) => t.id === selectedThemeId) || BASECAMP_THEMES[0];

  const handleApplyTheme = async (theme: BasecampTheme) => {
    setSelectedThemeId(theme.id);
    const root = document.documentElement;
    root.style.setProperty('--nf-accent', theme.accent);
    root.style.setProperty('--nf-accent-hover', theme.accentHover);
    root.style.setProperty('--nf-bg', theme.bg);
    root.style.setProperty('--nf-panel', theme.panel);
    root.style.setProperty('--nf-card', theme.card);
    root.style.setProperty('--nf-card-raised', theme.cardRaised);
    root.style.setProperty('--nf-border', theme.border);
    root.style.setProperty('--nf-text', theme.text);
    root.style.setProperty('--nf-text-muted', theme.textMuted);

    try {
      localStorage.setItem('nexaflow_theme_id', theme.id);
      localStorage.setItem(
        'nexaflow_theme_tokens',
        JSON.stringify({
          '--nf-accent': theme.accent,
          '--nf-accent-hover': theme.accentHover,
          '--nf-bg': theme.bg,
          '--nf-panel': theme.panel,
          '--nf-card': theme.card,
          '--nf-card-raised': theme.cardRaised,
          '--nf-border': theme.border,
          '--nf-text': theme.text,
          '--nf-text-muted': theme.textMuted,
        })
      );
    } catch {}
  };

  const handleSaveWorkspaceTokens = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const tokensPayload: Record<string, string> = {
        '--nf-accent': activeTheme.accent,
        '--nf-accent-hover': activeTheme.accentHover,
        '--nf-bg': activeTheme.bg,
        '--nf-panel': activeTheme.panel,
        '--nf-card': activeTheme.card,
        '--nf-card-raised': activeTheme.cardRaised,
        '--nf-border': activeTheme.border,
        '--nf-text': activeTheme.text,
        '--nf-text-muted': activeTheme.textMuted,
      };

      const res = await fetch('/api/studio/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: tokensPayload }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch {
      console.error('Failed to save tokens');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-orange-400 bg-orange-500/10">
            <Palette size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Basecamp Design Studio
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Brand styling, color palettes, project card templates, and typography
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveWorkspaceTokens}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-center"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save Style to Workspace
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 mb-6 rounded-2xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} />
          Workspace design theme saved successfully and applied across all views!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Theme Palette Pickers */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Basecamp Color Palettes
          </h2>

          <div className="space-y-3">
            {BASECAMP_THEMES.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleApplyTheme(theme)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                    isSelected ? 'ring-2 ring-teal-400' : 'hover:border-slate-500'
                  }`}
                  style={{
                    background: theme.card,
                    borderColor: isSelected ? theme.accent : theme.border,
                  }}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ background: theme.accent }}
                      />
                      <span className="text-xs font-bold truncate" style={{ color: theme.text }}>
                        {theme.name}
                      </span>
                    </div>
                    <p className="text-[11px] line-clamp-1" style={{ color: theme.textMuted }}>
                      {theme.tagline}
                    </p>
                  </div>

                  <div className="flex -space-x-1 flex-shrink-0">
                    <span className="w-5 h-5 rounded-full border border-black/40" style={{ background: theme.accent }} />
                    <span className="w-5 h-5 rounded-full border border-black/40" style={{ background: theme.card }} />
                    <span className="w-5 h-5 rounded-full border border-black/40" style={{ background: theme.bg }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Typography Selector */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Typography Style
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleApplyFont('serif')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  fontStyle === 'serif' ? 'border-orange-400 bg-orange-500/15 text-white font-bold ring-1 ring-orange-400' : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-xs font-serif font-bold">Lora Serif</span>
                <span className="text-[10px] opacity-70">Editorial (Main)</span>
              </button>
              <button
                onClick={() => handleApplyFont('sans')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  fontStyle === 'sans' ? 'border-orange-400 bg-orange-500/15 text-white font-bold ring-1 ring-orange-400' : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-xs font-sans font-bold">Inter Sans</span>
                <span className="text-[10px] opacity-70">Digital UI</span>
              </button>
              <button
                onClick={() => handleApplyFont('mono')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  fontStyle === 'mono' ? 'border-orange-400 bg-orange-500/15 text-white font-bold ring-1 ring-orange-400' : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-xs font-mono font-bold">Fira Code</span>
                <span className="text-[10px] opacity-70">Technical</span>
              </button>
            </div>

            {/* Custom Brand Font Upload */}
            <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Custom Brand Fonts
                </h3>
                <label className="cursor-pointer text-[11px] font-mono font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1">
                  <Upload size={12} />
                  <span>{uploadingFont ? 'Uploading...' : 'Upload Font (.woff/.ttf)'}</span>
                  <input
                    type="file"
                    accept=".woff,.woff2,.ttf,.otf"
                    onChange={handleUploadFont}
                    disabled={uploadingFont}
                    className="hidden"
                  />
                </label>
              </div>

              {customFonts.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {customFonts.map((cf) => (
                    <div
                      key={cf.id}
                      onClick={() => applyCustomFont(cf.font_family, cf.file_url)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        activeCustomFont === cf.font_family
                          ? 'border-orange-500 bg-orange-500/20 text-white font-bold'
                          : 'border-white/10 text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{cf.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {activeCustomFont === cf.font_family ? 'Active' : 'Apply'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-mono text-zinc-500">
                  Upload .woff2 or .ttf files to apply your client&apos;s custom typography.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Basecamp Project Preview */}
        <div className="lg:col-span-7">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Basecamp Project Preview (Live Feedback)
          </h2>

          <div
            className="p-6 rounded-3xl border shadow-xl transition-all"
            style={{
              background: activeTheme.card,
              borderColor: activeTheme.border,
            }}
          >
            {/* Project Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: activeTheme.border }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block" style={{ background: activeTheme.accent + '22', color: activeTheme.accent }}>
                  Active Project
                </span>
                <h3 className={`text-lg font-bold ${fontStyle === 'serif' ? 'font-serif' : fontStyle === 'mono' ? 'font-mono' : fontStyle === 'custom' ? 'font-[var(--font-custom)]' : 'font-sans'}`} style={{ color: activeTheme.text }}>
                  Acme Mobile App Launch 2026
                </h3>
                <p className="text-xs mt-0.5" style={{ color: activeTheme.textMuted }}>
                  Company-wide product redesign and beta testing sprint
                </p>
              </div>

              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner"
                style={{ background: activeTheme.accent, color: activeTheme.bg }}
              >
                AM
              </div>
            </div>

            {/* Basecamp 6-Pack Core Tools Grid */}
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: activeTheme.textMuted }}>
              Basecamp Core Tools
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {[
                { name: 'Message Board', icon: MessageSquare, desc: 'Pitch ideas & announcements' },
                { name: 'Campfire', icon: Flame, desc: 'Chat casually with team' },
                { name: 'To-dos', icon: CheckSquare, desc: 'Make lists & assign' },
                { name: 'Docs & Files', icon: FolderOpen, desc: 'Share specs & assets' },
                { name: 'Check-ins', icon: HelpCircle, desc: 'Recurring status prompts' },
                { name: 'Schedule', icon: Calendar, desc: 'Milestones & deadlines' },
              ].map((tool, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl border transition-transform hover:-translate-y-0.5 flex flex-col justify-between"
                  style={{
                    background: activeTheme.panel,
                    borderColor: activeTheme.border,
                  }}
                >
                  <tool.icon size={16} style={{ color: activeTheme.accent }} className="mb-2" />
                  <div>
                    <h4 className="text-xs font-bold leading-tight" style={{ color: activeTheme.text }}>
                      {tool.name}
                    </h4>
                    <p className="text-[10px] leading-snug mt-0.5" style={{ color: activeTheme.textMuted }}>
                      {tool.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Basecamp To-do Preview */}
            <div className="p-3.5 rounded-2xl border" style={{ background: activeTheme.panel, borderColor: activeTheme.border }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: activeTheme.text }}>
                  Today&apos;s To-dos
                </span>
                <span className="text-[10px]" style={{ color: activeTheme.accent }}>
                  2 of 3 completed
                </span>
              </div>

              <div className="space-y-2 text-xs" style={{ color: activeTheme.text }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md flex items-center justify-center text-slate-950 text-[10px] font-bold" style={{ background: activeTheme.accent }}>
                    ✓
                  </div>
                  <span className="line-through opacity-60">Finalize app store promotional screenshots</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md border" style={{ borderColor: activeTheme.accent }} />
                  <span>Review WhatsApp automated notification flow with client</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin AI Engine & Omni-Route Configuration Vault */}
      {(isAdminUser || previewRole === 'admin') && (
        <div
          className="mt-8 p-6 rounded-3xl border shadow-xl relative overflow-hidden"
          style={{ background: activeTheme.card, borderColor: activeTheme.border }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b" style={{ borderColor: activeTheme.border }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-400">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold" style={{ color: activeTheme.text }}>
                    AI Routing Engine & API Key Vault
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    Admin Exclusive
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: activeTheme.textMuted }}>
                  Connect Omni Route (OpenRouter), Grok, Qwen, and Gemini. Token-efficient with sealed backend prompts (zero frontend leaks).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKeyGuide(!showKeyGuide)}
                className="text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5"
                style={{ color: activeTheme.textMuted }}
              >
                <HelpCircle size={13} />
                {showKeyGuide ? 'Hide Setup Guide' : 'How to get API Keys?'}
              </button>
              <button
                type="button"
                onClick={handleSaveAiConfig}
                disabled={savingAi}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md bg-orange-500 hover:bg-orange-600 text-white"
              >
                {savingAi ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Save AI Settings
              </button>
            </div>
          </div>

          {aiSaveMsg && (
            <div
              className={`p-3.5 mb-5 rounded-2xl text-xs flex items-center gap-2 ${
                aiSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {aiSaveMsg.type === 'success' ? <CheckCircle2 size={15} /> : <HelpCircle size={15} />}
              {aiSaveMsg.text}
            </div>
          )}

          {/* Active Model Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2.5 text-slate-400">
              Active Primary AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'omni', name: 'Omni Route (OpenRouter)', desc: 'Multi-model hub with 100+ LLMs', badge: aiConfig.has_omni ? 'Connected' : 'Unconfigured' },
                { id: 'grok', name: 'xAI Grok', desc: 'grok-beta & grok-2 high speed', badge: aiConfig.has_grok ? 'Connected' : 'Unconfigured' },
                { id: 'qwen', name: 'Alibaba Qwen', desc: 'qwen-turbo / qwen-plus fallback', badge: aiConfig.has_qwen ? 'Connected' : 'Unconfigured' },
                { id: 'gemini', name: 'Google Gemini', desc: 'gemini-2.0-flash standard', badge: aiConfig.has_gemini ? 'Connected' : 'Unconfigured' },
              ].map((p) => {
                const isActive = aiConfig.provider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setAiConfig((c) => ({ ...c, provider: p.id }))}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{ background: isActive ? undefined : activeTheme.panel }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold" style={{ color: activeTheme.text }}>
                        {p.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          p.badge === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight" style={{ color: activeTheme.textMuted }}>
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: activeTheme.text }}>
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-orange-400" />
                  Omni Route / OpenRouter API Key
                </span>
                {aiConfig.has_omni && <span className="text-[10px] text-emerald-400 font-mono">Configured</span>}
              </label>
              <Input
                type="password"
                placeholder={aiConfig.omni_key ? '•••••••• (Leave blank to keep current)' : 'sk-or-v1-...'}
                value={aiConfig.omni_key}
                onChange={(e) => setAiConfig((c) => ({ ...c, omni_key: e.target.value }))}
                className="bg-zinc-900 border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: activeTheme.text }}>
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-orange-400" />
                  xAI Grok API Key
                </span>
                {aiConfig.has_grok && <span className="text-[10px] text-emerald-400 font-mono">Configured</span>}
              </label>
              <Input
                type="password"
                placeholder={aiConfig.grok_key ? '•••••••• (Leave blank to keep current)' : 'xai-...'}
                value={aiConfig.grok_key}
                onChange={(e) => setAiConfig((c) => ({ ...c, grok_key: e.target.value }))}
                className="bg-zinc-900 border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: activeTheme.text }}>
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-orange-400" />
                  Alibaba Qwen (DashScope) API Key
                </span>
                {aiConfig.has_qwen && <span className="text-[10px] text-emerald-400 font-mono">Configured</span>}
              </label>
              <Input
                type="password"
                placeholder={aiConfig.qwen_key ? '•••••••• (Leave blank to keep current)' : 'sk-...'}
                value={aiConfig.qwen_key}
                onChange={(e) => setAiConfig((c) => ({ ...c, qwen_key: e.target.value }))}
                className="bg-zinc-900 border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between" style={{ color: activeTheme.text }}>
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-orange-400" />
                  Google Gemini API Key
                </span>
                {aiConfig.has_gemini && <span className="text-[10px] text-emerald-400 font-mono">Configured</span>}
              </label>
              <Input
                type="password"
                placeholder={aiConfig.gemini_key ? '•••••••• (Leave blank to keep current)' : 'AIzaSy...'}
                value={aiConfig.gemini_key}
                onChange={(e) => setAiConfig((c) => ({ ...c, gemini_key: e.target.value }))}
                className="bg-zinc-900 border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-4">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-orange-400 flex-shrink-0" />
              <span className="text-zinc-400">
                Active Execution Model:{' '}
                <span className="font-mono text-white font-semibold">
                  {aiConfig.provider === 'omni' ? 'meta-llama/llama-3.3-70b-instruct' : aiConfig.provider === 'grok' ? 'grok-beta' : aiConfig.provider === 'qwen' ? 'qwen-turbo' : 'gemini-2.0-flash'}
                </span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              Token Efficient • Prompts Sealed • Auto-Cascading Failover
            </span>
          </div>

          {/* Setup Guide Accordion */}
          {showKeyGuide && (
            <div className="mt-4 p-5 rounded-2xl bg-zinc-950/80 border border-white/10 text-xs space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ExternalLink size={15} className="text-orange-400" />
                How to Create and Connect Required API Keys
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                  <div className="font-bold text-orange-400">1. Omni Route (OpenRouter)</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Provides access to Claude, Llama 3.3, Mistral, and DeepSeek with one API key. Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-orange-400 underline">openrouter.ai/keys</a>, sign up, and create a key starting with <code className="text-zinc-300">sk-or-v1-</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                  <div className="font-bold text-orange-400">2. xAI Grok</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    High speed, real-time knowledge. Visit <a href="https://console.x.ai/" target="_blank" rel="noreferrer" className="text-orange-400 underline">console.x.ai</a>, create a project, and generate an API key starting with <code className="text-zinc-300">xai-</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                  <div className="font-bold text-orange-400">3. Alibaba Qwen (DashScope)</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Massive multilingual context fallback. Visit <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noreferrer" className="text-orange-400 underline">DashScope Console</a> or Alibaba Cloud Model Studio, activate Qwen models, and copy your API key.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                  <div className="font-bold text-orange-400">4. Google Gemini</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Generous speed and native vision/analytics capabilities. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-400 underline">aistudio.google.com/app/apikey</a> and create a key in one click.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] leading-relaxed">
                <strong>Zero-Prompt Leakage Architecture:</strong> End-users, clients, and team members can never view raw system prompts, SQL schemas, or internal data payloads. All data is structured on the server and rendered cleanly as interactive charts, tables, or natural conversational advice.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
