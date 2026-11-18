'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessagesSquare,
  Send,
  Phone,
  Info,
  CheckCheck,
  Bot,
  ExternalLink,
  X,
  Key,
  Globe,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function WhatsAppHubView({ initialMessages, user }: any) {
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guideModal, setGuideModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.userMessage && json.data?.botReply) {
          setMessages((prev) => [...prev, json.data.userMessage, json.data.botReply]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}>
            <MessagesSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                WhatsApp Communications Hub
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                Connected
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Two-way bot automation, task notifications, and team WhatsApp alerts
            </p>
          </div>
        </div>

        <button
          onClick={() => setGuideModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border hover:bg-white/5 transition-colors"
          style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
        >
          <Info size={14} className="text-emerald-400" />
          API Setup Guide
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Commands & Status */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              <Bot size={16} className="text-emerald-400" /> WhatsApp Bot Capabilities
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Team members can send WhatsApp messages to query tasks, request project summaries, or trigger notifications.
            </p>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Quick Prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {['tasks', 'status', 'help'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleSend(cmd)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border hover:border-emerald-400 transition-colors"
                    style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)', color: '#25D366' }}
                  >
                    /{cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Broadcast Alerts
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Send critical notifications directly to phones over WhatsApp Business Cloud.
            </p>
            <div className="p-3 rounded-xl border text-[11px]" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
              • Daily task reminders at 9:00 AM<br />
              • Urgent project milestone alerts<br />
              • Check-in prompts &amp; summaries
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Live WhatsApp Interactive Simulator */}
        <div
          className="lg:col-span-2 rounded-3xl border flex flex-col h-[560px] overflow-hidden shadow-2xl"
          style={{ background: '#071015', borderColor: 'var(--nf-border, #35464E)' }}
        >
          {/* WhatsApp Chat Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b" style={{ background: '#0D1B22', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: '#25D366', color: '#0B1419' }}>
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">SPECTER OS Systems Bot</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online · Verified Business
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/40">+1 (555) 019-2834</span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-emerald-400 bg-emerald-500/10">
                  <MessagesSquare size={24} />
                </div>
                <p className="text-sm font-semibold text-white">Start a Conversation</p>
                <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                  Type <span className="text-emerald-400 font-mono">tasks</span> or <span className="text-emerald-400 font-mono">status</span> to receive instant project updates.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed"
                      style={{
                        background: isUser ? '#005C4B' : '#1F2C34',
                        color: '#E9EDEF',
                      }}
                    >
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/50">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isUser && <CheckCheck size={12} className="text-sky-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t flex gap-2" style={{ background: '#0D1B22', borderColor: 'rgba(255,255,255,0.08)' }}>
            <input
              type="text"
              placeholder="Type a message or command (e.g. tasks, status)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs outline-none bg-[#1F2C34] text-white placeholder-white/40"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50"
              style={{ background: '#25D366', color: '#071015' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {guideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-xl p-6 rounded-3xl border shadow-2xl relative max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-emerald-400" />
                <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Meta WhatsApp Business Cloud API Guide
                </h2>
              </div>
              <button onClick={() => setGuideModal(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              <p style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                SPECTER OS includes full local bot emulation out-of-the-box. To connect your live WhatsApp Business Phone number via Meta Cloud API, follow these 4 steps:
              </p>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <p className="font-bold text-emerald-400">Step 1: Create Meta Developer App</p>
                <p>1. Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline text-sky-400">developers.facebook.com</a>.</p>
                <p>2. Create a new App of type <b>Business</b>.</p>
                <p>3. Add the <b>WhatsApp</b> product to your app.</p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <p className="font-bold text-emerald-400">Step 2: Obtain Phone Number ID &amp; Token</p>
                <p>In the WhatsApp &gt; API Setup tab:</p>
                <p>• Copy your <b>Phone Number ID</b></p>
                <p>• Copy your <b>Temporary/System User Access Token</b></p>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <p className="font-bold text-emerald-400">Step 3: Configure Environment Variables</p>
                <p>Add these keys into your <code className="text-amber-300">.env.local</code> file:</p>
                <pre className="p-3 rounded-lg bg-black/50 font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token`}
                </pre>
              </div>

              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
                <p className="font-bold text-emerald-400">Step 4: Set Webhook URL</p>
                <p>In Meta App Dashboard &gt; WhatsApp &gt; Configuration:</p>
                <p>Callback URL: <code className="text-emerald-300">https://your-domain.com/api/integrations/whatsapp/webhook</code></p>
                <p>Subscribe to <b>messages</b> event.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <button
                onClick={() => setGuideModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
