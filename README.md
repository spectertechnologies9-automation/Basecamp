# NexaFlow 🌊

> Modern, compact, high-density project management and team collaboration platform inspired by the Basecamp 5 dark aesthetic.

![NexaFlow Architecture](https://img.shields.io/badge/Next.js-14%20App%20Router-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20Variables-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-3ecf8e)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.0%20Flash-orange)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18.17+ or v20+
- A Supabase project (Free tier works great)

### 2. Environment Setup
Copy the environment template and configure your project keys:
```bash
cp .env.example .env.local
```

Required keys to get started:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Kolkata

# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Assistant (Optional)
GEMINI_API_KEY=your-gemini-key

# WhatsApp Cloud API (Optional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_APP_SECRET=your-app-secret
```

### 3. Database Migration
Apply the migrations located in `supabase/migrations/`:
1. `001_core_schema.sql` — Tables, indexes, triggers, and Row Level Security (RLS) policies.
2. `002_seed_data.sql` — Default module registry items and system definitions.

You can paste these into the **Supabase SQL Editor** or run:
```bash
npm run db:migrate
```

### 4. Install Dependencies & Launch
```bash
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Visual Design System

NexaFlow features a dark, compact interface engineered with CSS custom properties:

| Token | Default Hex | Purpose |
|---|---|---|
| `--nf-bg` | `#0B1419` | Application background |
| `--nf-panel` | `#131E24` | Sidebar and drawer panels |
| `--nf-card` | `#1C2A31` | Cards and containers |
| `--nf-card-raised` | `#22333B` | Hover states and raised elements |
| `--nf-border` | `#35464E` | Subtle borders and dividers |
| `--nf-text` | `#F2F6F8` | Primary text |
| `--nf-text-muted` | `#AAB8C0` | Secondary and metadata text |
| `--nf-accent` | `#39C6AE` | Primary brand accent |
| `--nf-warning` | `#E9AC57` | Alerts and warnings |
| `--nf-danger` | `#E56B70` | Errors and destructive actions |

*Every token is editable at runtime via the built-in **Design Studio** at `/studio`.*

---

## ⌨️ Global Shortcuts

- <kbd>Shift</kbd> + <kbd>J</kbd> — Open Global Navigation & Jump Palette
- <kbd>Esc</kbd> — Close active modal or drawer

---

## 📁 Key Directories

```
NexaFlow/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   │   ├── (auth)/          # Login, Signup, Password Reset
│   │   ├── dashboard/       # Main 3-column dashboard
│   │   ├── projects/        # Project workspace, tools, and detail views
│   │   ├── admin/           # Adminland, People, Settings, Integrations
│   │   ├── studio/          # Design & Automation visual editor
│   │   └── api/             # RESTful API handlers
│   ├── components/          # Reusable component library
│   │   ├── layout/          # Header, Sidebar, Bottom Toolbar, Command Palette
│   │   ├── dashboard/       # Project cards, activity row, stat blocks
│   │   ├── projects/        # Project overview and creation modal
│   │   ├── todos/           # Lists, todo items, subtasks, comment thread
│   │   ├── campfire/        # Realtime chat feed
│   │   ├── messages/        # Message board composer and post list
│   │   └── studio/          # Design token sliders and color pickers
│   ├── lib/                 # Utilities, permissions, constants, Supabase clients
│   └── styles/              # Global styles and design tokens
├── supabase/
│   └── migrations/          # PostgreSQL schema migrations and seed scripts
└── __tests__/               # Jest unit tests
```

---

## 🔒 Security & Authorization

- **Server-Side Authorization**: Every API route and server component validates the active session before execution.
- **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer. Users cannot query records from organizations or private projects they do not belong to.
- **Role Hierarchy**: `owner` > `admin` > `project_manager` > `member` > `client` > `observer`.
