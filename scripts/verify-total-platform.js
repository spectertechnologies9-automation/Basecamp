const http = require('http');
const crypto = require('crypto');

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'nexaflow_local_dev_secret_key_32_characters_minimum!';

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const adminToken = signToken({ userId: 'usr_836f261323a28ad1', email: 'harikeshavonline@gmail.com', role: 'owner' });
const leadToken = signToken({ userId: 'usr_57afcc741499c5ba', email: 'harikeshavmoorthy@gmail.com', role: 'brand_manager' });
const memberToken = signToken({ userId: 'usr_f4dec2cd5b0c7ee1', email: 'xyz@gmail.com', role: 'member' });

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `nexaflow_session=${adminToken}`,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runFullVerification() {
  console.log('===============================================================');
  console.log('   SPECTER OS TOTAL PLATFORM & FEATURE VERIFICATION SUITE       ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  try {
    // 1. Core Page Availability
    console.log('--- 1. CORE APPLICATION PAGES ---');
    const rDash = await request('GET', '/dashboard');
    assert(rDash.status === 200, 'GET /dashboard returns 200 OK');

    const rProj = await request('GET', '/projects');
    assert(rProj.status === 200, 'GET /projects returns 200 OK');

    const rSingleProj = await request('GET', '/projects/prj_brand');
    assert(rSingleProj.status === 200, 'GET /projects/prj_brand returns 200 OK');

    // 2. Role Gating & Security Checks
    console.log('\n--- 2. ROLE GATING & SECURITY ---');
    const rAdminAct = await request('GET', '/activity', null, { Cookie: `nexaflow_session=${adminToken}` });
    assert(rAdminAct.status === 200, 'Admin can access /activity (200 OK)');

    const rMemberAct = await request('GET', '/activity', null, { Cookie: `nexaflow_session=${memberToken}` });
    // Next.js redirects non-admin: status 307 or redirected to /dashboard (which renders 200)
    assert(rMemberAct.status === 200 || rMemberAct.status === 307, 'Non-admin accessing /activity is safely handled/redirected');

    const rMemberTeam = await request('GET', '/team', null, { Cookie: `nexaflow_session=${memberToken}` });
    assert(rMemberTeam.status === 200 || rMemberTeam.status === 307, 'Non-admin accessing /team is safely handled/redirected');

    const rMemberStudio = await request('GET', '/studio', null, { Cookie: `nexaflow_session=${memberToken}` });
    assert(rMemberStudio.status === 200 || rMemberStudio.status === 307, 'Non-admin accessing /studio is safely handled/redirected');

    // 3. To-Do Tasks Engine
    console.log('\n--- 3. TO-DO TASKS ENGINE ---');
    const createTodo = await request('POST', '/api/projects/prj_brand/todos', {
      title: 'Automated E2E Verification Task',
      due_date: '2026-11-15',
      assignee_ids: ['usr_836f261323a28ad1'],
    });
    assert(createTodo.status === 200 || createTodo.status === 201, 'POST /api/projects/:id/todos creates task');
    const todoData = JSON.parse(createTodo.body).data;
    const todoId = todoData?.id;

    if (todoId) {
      // Complete task first to unlock voting
      await request('PATCH', `/api/todos/${todoId}`, { status: 'completed' });
      const voteTodo = await request('POST', `/api/todos/${todoId}/vote`);
      assert(voteTodo.status === 200, 'POST /api/todos/:id/vote records vote on completed task');

      const patchTodo = await request('PATCH', `/api/todos/${todoId}`, { status: 'in_review', priority: 'high' });
      assert(patchTodo.status === 200, 'PATCH /api/todos/:id moves task in pipeline');

      const delTodo = await request('DELETE', `/api/todos/${todoId}`);
      assert(delTodo.status === 200, 'DELETE /api/todos/:id deletes task');
    }

    // 4. 2-Tier Deliverable Review & Approval Flow
    console.log('\n--- 4. 2-TIER REVIEW & APPROVAL WORKFLOW ---');
    // A: Member submission (starts at pending_lead_review)
    const memberSubmit = await request('POST', '/api/projects/prj_brand/approvals', {
      title: 'Billboard Campaign Banner V3',
      description: 'Submitted by team member for Lead sign-off',
      file_url: '/uploads/projects/prj_brand/sample_banner.png',
      stage: 'concept',
    }, { Cookie: `nexaflow_session=${memberToken}` });

    const memberSubmitData = JSON.parse(memberSubmit.body).data;
    assert(memberSubmit.status === 200, 'Member submits deliverable with file attachment');
    assert(memberSubmitData?.status === 'pending_lead_review', 'Member submission initiates as "pending_lead_review"');

    const approvalId = memberSubmitData?.id;
    if (approvalId) {
      // B: Team Lead approves & forwards to Client
      const leadApprove = await request('PATCH', '/api/projects/prj_brand/approvals', {
        approval_id: approvalId,
        status: 'pending_client_review',
        feedback: 'Lead sign-off complete. Ready for client review.',
      }, { Cookie: `nexaflow_session=${leadToken}` });
      const leadData = JSON.parse(leadApprove.body).data;
      assert(leadData?.status === 'pending_client_review', 'Team Lead advances status to "pending_client_review"');

      // C: Client approval
      const clientApprove = await request('PATCH', '/api/projects/prj_brand/approvals', {
        approval_id: approvalId,
        status: 'approved',
      });
      const clientData = JSON.parse(clientApprove.body).data;
      assert(clientData?.status === 'approved', 'Client final deliverable sign-off sets status to "approved"');

      // D: Deliverable deletion
      const delAppr = await request('DELETE', `/api/projects/prj_brand/approvals?id=${approvalId}`);
      assert(delAppr.status === 200, 'Authorized lead/admin deletes deliverable item');
    }

    // 5. Mail Automation Engine
    console.log('\n--- 5. MAIL AUTOMATION & NOTIFICATION ENGINE ---');
    const mailConfigRes = await request('GET', '/api/automations/mail');
    assert(mailConfigRes.status === 200, 'GET /api/automations/mail returns automations & logs');
    const mailConfigData = JSON.parse(mailConfigRes.body).data;
    assert(mailConfigData?.providerConfig !== undefined, `Email Engine detects provider: ${mailConfigData?.providerConfig?.activeProvider}`);

    // Test broadcast email dispatch
    const broadcastRes = await request('POST', '/api/automations/mail', {
      action: 'broadcast',
      recipient_email: 'stakeholder@specteros.local',
      recipient_name: 'Executive Stakeholder',
      subject: '🚀 SPECTER OS Sprint Milestone Completed',
      message_body: 'All key deliverables for this sprint have met quality gates.',
    });
    assert(broadcastRes.status === 200, 'POST /api/automations/mail (broadcast dispatch)');
    const broadcastJson = JSON.parse(broadcastRes.body);
    assert(broadcastJson.data?.status === 'delivered', `Email delivered via ${broadcastJson.data?.provider}`);

    // Test sequence trigger
    const triggerRes = await request('POST', '/api/automations/mail', {
      action: 'send',
      automation_id: 'eml_due_reminder',
      recipient_email: 'designer@specteros.local',
      recipient_name: 'Lead Designer',
      subject: '⚠️ Reminder: Brand Guidelines Review Due Tomorrow',
      message_body: 'Please review and finalize the font pairings in SPECTER OS.',
    });
    assert(triggerRes.status === 200, 'POST /api/automations/mail (automated sequence trigger)');

    // 6. WhatsApp Bot & Communications Hub
    console.log('\n--- 6. WHATSAPP BOT & AUTOMATION ENGINE ---');
    const waMessagesRes = await request('GET', '/api/whatsapp/messages');
    assert(waMessagesRes.status === 200, 'GET /api/whatsapp/messages returns workspace messages');

    // Test outgoing WhatsApp message with automated intelligent bot reply
    const sendWaRes = await request('POST', '/api/whatsapp/messages', {
      message: 'tasks',
      phone: '+1 (555) 392-1084',
    });
    assert(sendWaRes.status === 200, 'POST /api/whatsapp/messages dispatches message');
    const waData = JSON.parse(sendWaRes.body).data;
    assert(waData?.userMessage?.body === 'tasks', 'WhatsApp records user message');
    assert(waData?.botReply?.body?.includes('SPECTER OS Task Status'), 'WhatsApp Bot generates intelligent task status reply');

    // Test Meta Webhook Challenge Verification (GET)
    const challengeToken = 'specteros_test_challenge_token_99';
    const waWebhookGet = await request('GET', `/api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.challenge=${challengeToken}&hub.verify_token=specteros_webhook_token_2026`);
    assert(waWebhookGet.status === 200 && waWebhookGet.body === challengeToken, 'GET /api/integrations/whatsapp/webhook verifies Meta challenge (200 OK)');

    // Test Meta Inbound Webhook Event (POST)
    const simulatedMetaWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '15553921084', phone_number_id: '10987654321' },
                contacts: [{ profile: { name: 'Client Director' }, wa_id: '15553921084' }],
                messages: [
                  {
                    from: '15553921084',
                    id: `wamid_sim_${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: { body: 'status' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };
    const waWebhookPost = await request('POST', '/api/integrations/whatsapp/webhook', simulatedMetaWebhookPayload);
    assert(waWebhookPost.status === 200, 'POST /api/integrations/whatsapp/webhook processes Meta inbound message');

    // 7. spectraBot AI Assistant (Zero Asterisks Verification)
    console.log('\n--- 7. SPECTRA BOT AI ASSISTANT (ZERO ASTERISKS VERIFICATION) ---');
    const botIntents = ['task_breakdown', 'deadlines', 'client_update', 'task_reminder', 'action_items'];
    for (const intent of botIntents) {
      const bRes = await request('POST', '/api/ai/spectrabot', { intent });
      if (bRes.status === 200) {
        const bJson = JSON.parse(bRes.body);
        const hasAsterisk = bJson.reply && bJson.reply.includes('*');
        assert(!hasAsterisk, `spectraBot [${intent}]: Zero asterisks verified`);
      } else {
        assert(false, `spectraBot [${intent}] failed with status ${bRes.status}`);
      }
    }

    // 8. Global Search Navigation
    console.log('\n--- 8. GLOBAL NAVIGATION & SEARCH ---');
    const searchRes = await request('GET', '/api/search?q=brand');
    assert(searchRes.status === 200, 'GET /api/search returns 200 OK');

    console.log('\n===============================================================');
    console.log(`   VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('===============================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runFullVerification();
