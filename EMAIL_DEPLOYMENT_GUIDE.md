# Production Email Service & Hosting Deployment Guide

## 1. Overview & Resolved Issues

### Why the Invite Link Failed Previously
The previous invite link generated a URL pointing to `/auth/join?project_id=...&role=member&token=...`. However, the `/auth/join` page route had not been implemented in the Next.js App Router, causing HTTP `404 Not Found` when invited recipients opened the link.

### Resolution Implemented
1. **Created `/auth/join` [src/app/auth/join/page.tsx](file:///c:/PROJECTS/NexaFlow/src/app/auth/join/page.tsx)**:
   - Reads `project_id`, `role`, and `token` from the query parameters.
   - Grounded project display: Shows the invited project name, client badge, and assigned role.
   - Interactive join form for registration or instant sign-in.
   - On submission, creates/finds the user, adds them to `project_members`, issues a signed session cookie, dispatches real-time notifications to Admins and Team Leads, and redirects directly into the project board.
2. **Unified Email Engine [src/lib/email/index.ts](file:///c:/PROJECTS/NexaFlow/src/lib/email/index.ts)**:
   - Pluggable provider architecture: Supports **Resend**, **Custom SMTP** (Gmail, SendGrid, Amazon SES, Postmark), and an automated **Local Simulation Mode** (logs every email to SQLite `email_logs` without failing in dev).

---

## 2. Choosing Your Production Email Provider

| Provider | Best For | Setup Complexity | Free Tier |
| :--- | :--- | :--- | :--- |
| **Resend** (Recommended) | Vercel & Next.js App Router | Very Low (1 API key) | 3,000 emails/month |
| **SendGrid / Twilio** | Enterprise High-Volume | Moderate | 100 emails/day |
| **Amazon SES** | Lowest Cost at High Scale | High (AWS IAM + DNS) | 62,000 emails/month |
| **Google Workspace / Gmail SMTP** | Internal Agency Accounts | Low (App Password) | 500 emails/day |

---

## 3. Option A: Setting Up Resend (Recommended)

Resend provides direct HTTPS API delivery (bypassing hosting port 25/587 blocks).

### Step 1: Create an Account & API Key
1. Sign up at [resend.com](https://resend.com).
2. Go to **API Keys** → click **Create API Key**.
3. Name it `NexaFlow Production` and copy the key (starts with `re_...`).

### Step 2: Verify Your Sending Domain
1. In the Resend dashboard, go to **Domains** → click **Add Domain** (e.g. `mail.youragency.com` or `youragency.com`).
2. Add the provided DNS records (DKIM, SPF, and MX) in your domain registrar (GoDaddy, Cloudflare, Namecheap, Route53).
3. Wait 2–5 minutes until status changes to **Verified**.

### Step 3: Add Environment Variables in Hosting
Add the following to your hosting dashboard (Vercel, Railway, Render, etc.):
```bash
RESEND_API_KEY="re_123456789abcdef"
EMAIL_FROM="TOFFEREND OS <team@yourdomain.com>"
```

---

## 4. Option B: Setting Up Custom SMTP (Gmail, Zoho, Hostinger, SendGrid)

If you prefer standard SMTP:

### Using Gmail SMTP
1. In your Google Account, enable **2-Step Verification**.
2. Go to **Security** → **App passwords** → generate a password named `NexaFlow App`.
3. Copy the 16-character generated password.
4. Set the following environment variables:
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="youragency@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
EMAIL_FROM="TOFFEREND OS <youragency@gmail.com>"
```

### Using SendGrid SMTP
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.your_sendgrid_api_key"
EMAIL_FROM="TOFFEREND OS <team@yourverifieddomain.com>"
```

---

## 5. Deployment Setup by Hosting Platform

### 1. Vercel Deployment
1. Import your Git repository into Vercel.
2. Under **Project Settings** → **Environment Variables**, add:
   - `RESEND_API_KEY`: `re_...`
   - `EMAIL_FROM`: `TOFFEREND OS <team@yourdomain.com>`
   - `NEXTAUTH_SECRET`: `[generate a random 32-character string]`
3. Trigger a redeploy. Every invite and password reset will dispatch live emails instantly.

### 2. Railway / Render / Docker Deployment
In your service settings or `Dockerfile`:
```dockerfile
ENV RESEND_API_KEY=re_your_api_key
ENV EMAIL_FROM="TOFFEREND OS <team@yourdomain.com>"
```

### 3. VPS / Ubuntu / Nginx Deployment
In your systemd service file (e.g. `/etc/systemd/system/nexaflow.service`):
```ini
[Unit]
Description=NexaFlow Agency Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nexaflow
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=RESEND_API_KEY=re_your_key_here
Environment=EMAIL_FROM="TOFFEREND OS <notifications@youragency.com>"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## 6. Verifying & Monitoring Email Logs

1. Open the **Mail Automation** tab in your dashboard (`/dashboard?tab=mail`).
2. Switch to the **Logs** tab.
3. Every dispatched email, recipient address, timestamp, and status (`delivered` or `simulated_delivered`) is logged to the SQLite database and visible in real time.
4. You can also trigger a test broadcast using the **Send Broadcast** form to verify that your configured SMTP / Resend credentials are functioning properly.
