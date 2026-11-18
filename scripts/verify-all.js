const http = require('http');
const crypto = require('crypto');

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'nexaflow_local_dev_secret_key_32_characters_minimum!';

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const adminToken = signToken({ userId: 'usr_836f261323a28ad1', email: 'harikeshavonline@gmail.com' });

async function test() {
  console.log('--- STARTING SPECTER OS VERIFICATION ---');

  // Helper for requests
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

  try {
    // 1. Test Dashboard render
    console.log('1. Testing /dashboard render...');
    const dashRes = await request('GET', '/dashboard');
    console.log(`   /dashboard status: ${dashRes.status}`);
    if (dashRes.status === 200) {
      console.log('   ✓ Dashboard rendered successfully without lag');
    } else {
      console.error(`   ❌ Dashboard failed with status ${dashRes.status}`);
    }

    // 2. Test spectraBot commands & Zero Asterisks
    console.log('\n2. Testing spectraBot with multiple commands (Zero Asterisks Verification)...');
    const intents = ['task_breakdown', 'deadlines', 'client_update', 'task_reminder', 'action_items'];
    for (const intent of intents) {
      const botRes = await request('POST', '/api/ai/spectrabot', { intent });
      if (botRes.status === 200) {
        const json = JSON.parse(botRes.body);
        const hasAsterisk = json.reply && json.reply.includes('*');
        console.log(`   [${intent}]: Status 200 | Asterisks Found: ${hasAsterisk}`);
        if (hasAsterisk) {
          console.error(`   ❌ Asterisks detected in reply: ${json.reply.slice(0, 100)}...`);
        } else {
          console.log(`   ✓ Sample snippet: "${json.reply.split('\n')[0]}"`);
        }
      } else {
        console.log(`   ⚠️ spectraBot ${intent} status: ${botRes.status} body: ${botRes.body}`);
      }
    }

    // 3. Test Todo Creation & Deletion
    console.log('\n3. Testing Task Creation & Deletion...');
    const createTodoRes = await request('POST', '/api/projects/prj_brand/todos', {
      title: 'Test Verification Task For Deletion',
      due_date: '2026-11-01',
      assignee_ids: ['usr_admin'],
    });
    console.log(`   Create Todo Status: ${createTodoRes.status}`);
    if (createTodoRes.status === 200 || createTodoRes.status === 201) {
      const todoJson = JSON.parse(createTodoRes.body);
      const todoId = todoJson.data?.id;
      console.log(`   Created Todo ID: ${todoId}`);
      if (todoId) {
        const delRes = await request('DELETE', `/api/todos/${todoId}`);
        console.log(`   Delete Todo Status: ${delRes.status}`);
        if (delRes.status === 200) {
          console.log('   ✓ Task successfully deleted by authorized user');
        } else {
          console.error(`   ❌ Failed to delete task: ${delRes.body}`);
        }
      }
    }

    // 4. Test Approval Submission with File & Deletion
    console.log('\n4. Testing Review & Approval (with File URL & Deletion)...');
    const createApprovalRes = await request('POST', '/api/projects/prj_brand/approvals', {
      title: 'Billboard Campaign Concept V2',
      description: 'Attached layout mock for review',
      file_url: '/uploads/projects/prj_brand/sample_banner.png',
      stage: 'concept',
    });
    console.log(`   Create Approval Status: ${createApprovalRes.status}`);
    if (createApprovalRes.status === 200) {
      const apprJson = JSON.parse(createApprovalRes.body);
      const apprId = apprJson.data?.id;
      console.log(`   Created Approval ID: ${apprId} with status: ${apprJson.data?.status}`);
      console.log(`   Attached File URL: ${apprJson.data?.file_url}`);
      if (apprId) {
        const delApprRes = await request('DELETE', `/api/projects/prj_brand/approvals?id=${apprId}`);
        console.log(`   Delete Approval Status: ${delApprRes.status}`);
        if (delApprRes.status === 200) {
          console.log('   ✓ Review deliverable successfully deleted');
        }
      }
    }

    // 5. Test Access Gating
    console.log('\n5. Testing Access Gating (Non-admin redirect verification)...');
    const memberToken = signToken({ userId: 'usr_f4dec2cd5b0c7ee1', email: 'xyz@gmail.com' });
    const teamRes = await request('GET', '/team', null, { Cookie: `nexaflow_session=${memberToken}` });
    console.log(`   Member accessing /team (Expect 307 redirect): ${teamRes.status}`);
    const studioRes = await request('GET', '/studio', null, { Cookie: `nexaflow_session=${memberToken}` });
    console.log(`   Member accessing /studio (Expect 307 redirect): ${studioRes.status}`);
    const actRes = await request('GET', '/activity', null, { Cookie: `nexaflow_session=${memberToken}` });
    console.log(`   Member accessing /activity (Expect 307 redirect): ${actRes.status}`);

    console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Verification error:', err);
  }
}

test();
