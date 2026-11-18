# 📱 SPECTER OS — Dedicated WhatsApp Bot Architecture

This folder contains the complete, dedicated WhatsApp Bot subsystem for **SPECTER OS**. It handles automated notifications, client approval requests, interactive task lookups, and multi-model conversational AI queries over WhatsApp.

---

## 🗂️ Module Structure

```
whatsapp-bot/
├── config.ts              # Configuration, token resolvers & phone number sanitizers
├── client.ts              # Meta Cloud API message dispatcher (text, templates, buttons, docs)
├── handlers/
│   ├── commands.ts        # Built-in command router (/tasks, /milestones, /approvals, /status) + AI failover
│   └── webhook.ts         # Meta Webhook verification & incoming payload parser with HMAC security
├── services/
│   └── notification.ts    # Outbound automated triggers (task assignments, client reviews, approvals)
├── index.ts               # Clean public interface for website imports
├── bot-runner.js          # Standalone CLI simulator & test utility
└── README.md              # Setup and operational guide
```

---

## ⚙️ Configuration (.env.local)

Add your Meta WhatsApp Business Cloud API credentials to `.env.local`:

```env
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_meta_waba_id
WHATSAPP_ACCESS_TOKEN=your_permanent_meta_system_user_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=specteros_webhook_token_2026
WHATSAPP_APP_SECRET=your_meta_app_secret
```

*Note: In local development mode without Meta keys, the bot automatically runs in **Simulation Mode** — logging all outbound messages cleanly to the console.*

---

## 🚀 Webhook Endpoints in SPECTER OS

- **Webhook URL**: `https://your-domain.com/api/integrations/whatsapp/webhook`
- **Verification Token**: Value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (default: `specteros_webhook_token_2026`)
- **Subscription Fields**: `messages`

---

## 💬 Built-in Commands

Users can message the registered phone number with any of these commands:

| Command | Description |
|---|---|
| `/tasks` | View open assigned deliverables and due dates |
| `/milestones` | View chronological calendar milestones |
| `/approvals` | View pending client sign-offs |
| `/status` | Workspace sprint health and active project overview |
| `/help` | Display command reference manual |
| *Free-form text* | Queries routed to the unified AI router with zero asterisks and role context |

---

## 🧪 Testing with Standalone Runner

```bash
# Test command parsing
node whatsapp-bot/bot-runner.js --test "/tasks"

# Test AI natural conversational reply
node whatsapp-bot/bot-runner.js --test "Summarize the upcoming milestones for this week"
```
