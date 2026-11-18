#!/usr/bin/env node
/**
 * SPECTER OS — WhatsApp Bot Standalone Runner & Simulator
 * 
 * Usage:
 *   node whatsapp-bot/bot-runner.js --test "What are my upcoming tasks?"
 *   node whatsapp-bot/bot-runner.js --listen 4000
 */

const http = require('http');
const crypto = require('crypto');

const port = process.env.PORT || 4000;
const testQuery = process.argv.slice(2).join(' ');

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'nexaflow_local_dev_secret_key_32_characters_minimum!';
function getDevCookie() {
  const data = Buffer.from(JSON.stringify({ userId: 'usr_836f261323a28ad1' })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `nexaflow_session=${data}.${sig}`;
}

async function runTestQuery(query) {
  console.log('🤖 Simulating WhatsApp Bot Request...');
  console.log('User Prompt:', query || 'Help');

  try {
    const res = await fetch('http://localhost:3000/api/whatsapp/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: getDevCookie(),
      },
      body: JSON.stringify({
        phone: '+1 (555) 019-2834',
        message: query || 'help',
      }),
    });

    const json = await res.json();
    console.log('\n💬 Bot Response:');
    console.log(json.data?.reply?.body || json.data?.reply || json);
  } catch (err) {
    console.error('Error connecting to SPECTER OS server:', err.message);
  }
}

if (testQuery.startsWith('--test')) {
  const q = testQuery.replace('--test', '').trim();
  runTestQuery(q);
} else {
  console.log(`
===================================================
  SPECTER OS — Dedicated WhatsApp Bot Architecture
===================================================
Dedicated modules established at:
  • whatsapp-bot/config.ts
  • whatsapp-bot/client.ts
  • whatsapp-bot/handlers/commands.ts
  • whatsapp-bot/handlers/webhook.ts
  • whatsapp-bot/services/notification.ts
  • whatsapp-bot/index.ts

Test commands:
  node whatsapp-bot/bot-runner.js --test "/tasks"
  node whatsapp-bot/bot-runner.js --test "/status"
  node whatsapp-bot/bot-runner.js --test "What are our project deadlines?"
===================================================
`);
}
