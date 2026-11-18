'use client';

import { useState, useEffect } from 'react';
import {
  MessagesSquare,
  ShieldAlert,
  Save,
  Check,
  Send,
  Loader2,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function AdminWhatsAppPage() {
  const [phoneId, setPhoneId] = useState('');
  const [token, setToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('nexaflow_meta_webhook_secret_2026');
  const [businessId, setBusinessId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Test send states
  const [testPhone, setTestPhone] = useState('+1 (555) 019-2834');
  const [testMsg, setTestMsg] = useState('Hello from NexaFlow Systems Administrator!');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_config: { phoneId, token, verifyToken, businessId },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setTestStatus(null);
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMsg,
        }),
      });
      if (res.ok) {
        setTestStatus('Message successfully delivered to simulator & dispatch queue.');
      } else {
        setTestStatus('Failed to dispatch test message.');
      }
    } catch {
      setTestStatus('Error connecting to WhatsApp dispatcher.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-400 bg-emerald-500/10">
            <MessagesSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                WhatsApp Service Infrastructure
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                Operational
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Configure Meta Cloud API credentials, webhook verification, and outbound messaging
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Credentials */}
        <form onSubmit={handleSave} className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            <ShieldAlert size={16} className="text-emerald-400" /> Meta Cloud API Credentials
          </h2>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Phone Number ID
            </label>
            <input
              type="text"
              placeholder="e.g. 104829104928104"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs outline-none font-mono"
              style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              System User Access Token
            </label>
            <input
              type="password"
              placeholder="EAAB..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs outline-none font-mono"
              style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Webhook Verify Token
            </label>
            <input
              type="text"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs outline-none font-mono text-emerald-400"
              style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Credentials Saved' : 'Save Credentials'}
            </button>
          </div>
        </form>

        {/* Test Dispatcher */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            <Send size={16} className="text-emerald-400" /> Live Message Dispatcher
          </h2>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Recipient Phone Number</label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs outline-none font-mono"
              style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Broadcast Message Payload</label>
            <textarea
              rows={3}
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs outline-none resize-none font-mono"
              style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
            />
          </div>

          {testStatus && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {testStatus}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border hover:bg-emerald-500/10 transition-colors"
              style={{ borderColor: '#25D366', color: '#25D366' }}
            >
              {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Dispatch Test WhatsApp Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
