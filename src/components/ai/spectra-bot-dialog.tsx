'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Clipboard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRolePreview } from '@/hooks/use-role-preview';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export function SpectraBotDialog({ projectId, userId }: { projectId?: string; userId?: string }) {
  const { previewRole } = useRolePreview();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(userId || null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello! I am spectraBot, your AI project assistant.\n\nI am grounded in your accessible projects, tasks, deliverables, and calendar milestones. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user if not provided in props to ensure chat history is scoped per user
  useEffect(() => {
    let isMounted = true;
    if (userId) {
      setActiveUserId(userId);
      return;
    }
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res?.data?.id) {
          setActiveUserId(res.data.id);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Load chat history from localStorage strictly scoped to active user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = activeUserId ? `spectrabot_history_${activeUserId}` : 'spectrabot_history_guest';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse spectraBot history from localStorage:', e);
    } finally {
      setHasLoadedStorage(true);
    }
  }, [activeUserId]);

  // Persist chat history to localStorage whenever messages change (only after initial load)
  useEffect(() => {
    if (!hasLoadedStorage || typeof window === 'undefined') return;
    const storageKey = activeUserId ? `spectrabot_history_${activeUserId}` : 'spectrabot_history_guest';
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save spectraBot history to localStorage:', e);
    }
  }, [messages, activeUserId, hasLoadedStorage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string, intent?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && !intent) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/spectrabot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          intent,
          projectId,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: json.reply || 'No response generated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_err_${Date.now()}`,
            sender: 'bot',
            text: '⚠️ Unable to reach spectraBot intelligence server. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Connection error. Please check your network.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const quickChips = [
    { label: '📋 Task Breakdown', intent: 'task_breakdown', prompt: 'Provide a clear task breakdown by status and deadlines.' },
    { label: '📅 Deadlines', intent: 'deadlines', prompt: 'What are our key project deadlines and upcoming milestones?' },
    { label: '✉️ Draft Client Update', intent: 'client_update', prompt: 'Draft a polite and professional client progress update email.' },
    { label: '⏰ Task Reminder Email', intent: 'task_reminder', prompt: 'Draft a polite task reminder email for an assigned team member.' },
    { label: '🎯 Action Items', intent: 'action_items', prompt: 'What are the top recommended next action items for our sprint?' },
  ];

  return (
    <>
      {/* Floating Launcher Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white font-medium text-xs shadow-xl shadow-orange-950/40 border border-orange-400/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
          title="Open spectraBot AI Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <Sparkles className="h-4 w-4 text-orange-200 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wide">spectraBot</span>
        </button>
      )}

      {/* Slide-in Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] rounded-3xl bg-gradient-to-b from-zinc-900/98 to-zinc-950/99 border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-sm">
                <Bot size={17} className="text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide font-sans">SPECTRA BOT</h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                    SCOPED
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Role: <span className="text-zinc-200 uppercase font-semibold">{previewRole || 'AUTHENTICATED'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const resetMsg: ChatMessage = {
                    id: `init_${Date.now()}`,
                    sender: 'bot',
                    text: `Chat history refreshed. Ready for your next query!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  };
                  setMessages([resetMsg]);
                  if (typeof window !== 'undefined') {
                    const storageKey = activeUserId ? `spectrabot_history_${activeUserId}` : 'spectrabot_history_guest';
                    localStorage.setItem(storageKey, JSON.stringify([resetMsg]));
                  }
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-colors"
                title="Refresh and clear chat history"
              >
                <RefreshCw size={13} className="text-amber-400" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(chip.prompt, chip.intent)}
                className="px-2.5 py-1 rounded-xl bg-zinc-850 hover:bg-orange-600/25 hover:border-orange-500/50 border border-zinc-750 text-[10px] font-mono text-zinc-300 hover:text-white whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-2.5 max-w-[90%]',
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-zinc-800/80 border border-white/[0.05]'
                      : 'bg-orange-600/20 border border-orange-500/30'
                  )}
                >
                  {msg.sender === 'user' ? <User size={13} className="text-indigo-400" /> : <Bot size={13} className="text-orange-400" />}
                </div>

                <div
                  className={cn(
                    'p-3.5 rounded-2xl relative group font-sans leading-relaxed text-xs shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-zinc-900/90 border border-white/[0.07] text-zinc-200 rounded-tl-none'
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed text-xs">
                    {msg.text}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'bot' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all duration-150 border',
                          copiedId === msg.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 hover:text-white border-zinc-700/70 shadow-sm'
                        )}
                        title="Copy response to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={11} className="text-emerald-400 stroke-[2.5]" />
                            <span className="font-semibold text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Clipboard size={11} className="text-orange-400 stroke-[2]" />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs mr-auto">
                <Bot size={14} className="text-orange-400 animate-pulse" />
                <span className="font-mono text-[11px] animate-pulse">spectraBot is analyzing project data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask spectraBot about tasks, milestones, or drafts..."
              disabled={loading}
              className="bg-zinc-950/80 border-zinc-800/80 text-xs font-sans text-white h-10 rounded-2xl focus-visible:ring-orange-500/70"
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !input.trim()}
              className="bg-orange-600 hover:bg-orange-500 text-white h-10 px-3.5 rounded-2xl shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md shadow-orange-950/40"
            >
              <Send size={14} className="text-white" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
