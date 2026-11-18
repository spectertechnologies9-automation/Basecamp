'use client';

import {
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Plug, Clock,
} from 'lucide-react';

// Provider metadata
const PROVIDER_META: Record<string, { label: string; icon: string; description: string; docsUrl: string }> = {
  whatsapp: {
    label: 'WhatsApp Business',
    icon: '💬',
    description: 'Send task reminders and receive commands via WhatsApp chatbot.',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/',
  },
  google_calendar: {
    label: 'Google Calendar',
    icon: '📅',
    description: 'Sync project deadlines and events with Google Calendar.',
    docsUrl: 'https://developers.google.com/calendar/',
  },
  google_drive: {
    label: 'Google Drive',
    icon: '📁',
    description: 'Attach and browse Google Drive files inside projects.',
    docsUrl: 'https://developers.google.com/drive',
  },
  microsoft_365: {
    label: 'Microsoft 365',
    icon: '🏢',
    description: 'Connect Teams, Outlook, and OneDrive to NexaFlow.',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/overview',
  },
  slack: {
    label: 'Slack',
    icon: '⚡',
    description: 'Send notifications and create tasks from Slack messages.',
    docsUrl: 'https://api.slack.com/',
  },
  zapier: {
    label: 'Zapier',
    icon: '🔗',
    description: 'Connect NexaFlow to 5000+ apps via Zapier automation.',
    docsUrl: 'https://zapier.com/apps/integrations',
  },
  make: {
    label: 'Make (Integromat)',
    icon: '⚙️',
    description: 'Build powerful visual automations with Make.',
    docsUrl: 'https://www.make.com/en/integrations',
  },
  email: {
    label: 'Email (Resend)',
    icon: '📧',
    description: 'Send transactional emails, invitations, and notifications.',
    docsUrl: 'https://resend.com/docs',
  },
  gemini_ai: {
    label: 'Google Gemini AI',
    icon: '🤖',
    description: 'AI assistant, smart suggestions, and content generation.',
    docsUrl: 'https://ai.google.dev/',
  },
};

interface IntegrationsViewProps {
  integrations: Array<{
    id: string | null;
    provider: string;
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    config: Record<string, unknown>;
    last_synced_at?: string;
    error_message?: string;
  }>;
}

export function IntegrationsView({ integrations }: IntegrationsViewProps) {
  const connected = integrations.filter(i => i.status === 'connected');
  const notConnected = integrations.filter(i => i.status !== 'connected');

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Plug size={22} style={{ color: 'var(--nf-accent)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>Integrations</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: 'var(--nf-text-muted)' }}>
        Connect NexaFlow to external services. Configure API credentials in your environment variables.
      </p>

      {connected.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--nf-accent)' }}>
            Connected
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {connected.map(i => <IntegrationCard key={i.provider} integration={i} />)}
          </div>
        </>
      )}

      <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--nf-text-muted)' }}>
        Available integrations
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notConnected.map(i => <IntegrationCard key={i.provider} integration={i} />)}
      </div>
    </div>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationsViewProps['integrations'][0] }) {
  const meta = PROVIDER_META[integration.provider] ?? {
    label: integration.provider,
    icon: '🔌',
    description: '',
    docsUrl: '#',
  };

  const StatusIcon = integration.status === 'connected'
    ? CheckCircle2
    : integration.status === 'error'
    ? AlertCircle
    : XCircle;

  const statusColor = integration.status === 'connected'
    ? 'var(--nf-accent)'
    : integration.status === 'error'
    ? 'var(--nf-danger)'
    : 'var(--nf-text-muted)';

  return (
    <div
      className="p-5 rounded-xl border"
      style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--nf-text)' }}>{meta.label}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <StatusIcon size={11} style={{ color: statusColor }} />
              <span className="text-[11px] capitalize" style={{ color: statusColor }}>{integration.status}</span>
            </div>
          </div>
        </div>
        <a
          href={meta.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--nf-text-muted)' }}
        >
          <ExternalLink size={13} />
        </a>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--nf-text-muted)' }}>{meta.description}</p>

      {integration.error_message && (
        <div className="mb-3 p-2 rounded-lg text-xs" style={{ background: 'rgba(229,107,112,0.1)', color: 'var(--nf-danger)' }}>
          {integration.error_message}
        </div>
      )}

      {integration.status === 'disconnected' ? (
        <div
          className="p-3 rounded-lg text-xs"
          style={{ background: 'var(--nf-panel)', border: '1px solid var(--nf-border)', color: 'var(--nf-text-muted)' }}
        >
          Configure{' '}
          <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--nf-card)' }}>
            {integration.provider.toUpperCase().replace(/-/g, '_')}_*
          </code>{' '}
          variables in <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--nf-card)' }}>.env.local</code>
        </div>
      ) : integration.status === 'connected' ? (
        <div className="flex items-center justify-between">
          {integration.last_synced_at && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--nf-text-muted)' }}>
              <Clock size={11} />
              Synced {new Date(integration.last_synced_at).toLocaleDateString()}
            </span>
          )}
          <button className="text-xs hover:underline" style={{ color: 'var(--nf-danger)' }}>
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
