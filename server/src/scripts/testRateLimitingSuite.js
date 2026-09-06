const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Registration = require('../models/Registration');

const BASE_URL = 'http://localhost:5000/api';

async function runSuite() {
  console.log('🚀 Starting ARTIMAS 2026 Comprehensive Rate Limiting & Security Verification Suite\n');
  const results = [];

  function record(testNumber, name, passed, details = '') {
    results.push({ testNumber, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${testNumber}] ${name}`);
    if (details) console.log(`       ${details}`);
  }

  // Connect to MongoDB directly for safe cleanup
  await mongoose.connect(process.env.MONGODB_URI);

  // PCCOE email format: firstname.lastname<digits 1-4>@pccoepune.org
  const pccoeSuffix = Math.floor(10 + Math.random() * 89); // 2 digits (e.g. 26)
  const pccoeEmail = `lead.tester${pccoeSuffix}@pccoepune.org`;
  const pccoePhone = '9876543210';
  const createdIds = [];

  try {
    // ── 1. Normal registration succeeds ──
    const reg1Res = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.10',
      },
      body: JSON.stringify({
        eventSlug: 'datathon',
        teamName: `RL Team 1 ${Date.now()}`,
        members: [
          {
            name: 'RL Test Lead',
            email: pccoeEmail,
            phone: pccoePhone,
            college: 'PCCOE',
            year: 'TE',
            branch: 'AIML',
          },
        ],
      }),
    });
    const reg1Json = await reg1Res.json();
    const test1Passed = reg1Res.status === 201 && reg1Json.success && Boolean(reg1Json.data?.registrationId);
    if (reg1Json.data?.registrationId) createdIds.push(reg1Json.data.registrationId);
    record(1, 'Normal registration succeeds', test1Passed, `HTTP ${reg1Res.status}, ID: ${reg1Json.data?.registrationId}`);

    // ── 2. Same participant can register for multiple different events ──
    const reg2Res = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.10',
      },
      body: JSON.stringify({
        eventSlug: 'pixel-perfect',
        teamName: `RL Solo ${Date.now()}`,
        members: [
          {
            name: 'RL Test Lead',
            email: pccoeEmail,
            phone: pccoePhone,
            college: 'PCCOE',
            year: 'TE',
            branch: 'AIML',
          },
        ],
      }),
    });
    const reg2Json = await reg2Res.json();
    const test2Passed = reg2Res.status === 201 && reg2Json.success;
    if (reg2Json.data?.registrationId) createdIds.push(reg2Json.data.registrationId);
    record(2, 'Same participant can register for multiple different events', test2Passed, `HTTP ${reg2Res.status}, Event: pixel-perfect, ID: ${reg2Json.data?.registrationId}`);

    // ── 3. Same-event duplicate protection still works ──
    const reg3Res = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.10',
      },
      body: JSON.stringify({
        eventSlug: 'datathon',
        teamName: `RL Team Duplicate ${Date.now()}`,
        members: [
          {
            name: 'RL Test Lead',
            email: pccoeEmail,
            phone: pccoePhone,
            college: 'PCCOE',
            year: 'TE',
            branch: 'AIML',
          },
        ],
      }),
    });
    const reg3Json = await reg3Res.json();
    const test3Passed = reg3Res.status === 409 && /already registered/i.test(reg3Json.message);
    record(3, 'Same-event duplicate protection still works', test3Passed, `HTTP ${reg3Res.status}, Msg: ${reg3Json.message}`);

    // ── 4. Requests within 70/15 min are not rejected by the limiter ──
    const probeRes = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.20',
      },
      body: JSON.stringify({ eventSlug: 'invalid-event' }),
    });
    const test4Passed = probeRes.status !== 429;
    record(4, 'Requests within 70/15 min are not rejected by the limiter', test4Passed, `HTTP ${probeRes.status} (Limiter allowed valid burst under threshold)`);

    // ── 5. Request exceeding 70 returns HTTP 429 ──
    const floodIp = '198.51.100.30';
    let hit429 = false;
    let hit429At = 0;
    let lastStatus = 0;
    let flood429Msg = '';

    for (let i = 1; i <= 72; i++) {
      const res = await fetch(`${BASE_URL}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': floodIp,
        },
        body: JSON.stringify({}),
      });
      lastStatus = res.status;
      if (res.status === 429) {
        hit429 = true;
        hit429At = i;
        const json = await res.json().catch(() => ({}));
        flood429Msg = json.message || '';
        break;
      }
    }
    const test5Passed = hit429 && hit429At === 71;
    record(5, 'Request exceeding 70 returns HTTP 429', test5Passed, `Blocked at request #${hit429At}, Status: ${lastStatus}, Msg: "${flood429Msg}"`);

    // ── 6. RateLimit headers are present on registration ──
    const headRes = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.40',
      },
      body: JSON.stringify({}),
    });
    const regLimitHeader = headRes.headers.get('ratelimit-limit') || headRes.headers.get('RateLimit-Limit');
    const regRemainingHeader = headRes.headers.get('ratelimit-remaining') || headRes.headers.get('RateLimit-Remaining');
    const regResetHeader = headRes.headers.get('ratelimit-reset') || headRes.headers.get('RateLimit-Reset');
    const test6Passed = Boolean(regLimitHeader) && regLimitHeader.includes('70');
    record(6, 'RateLimit-* headers are present on registration', test6Passed, `Limit: ${regLimitHeader}, Remaining: ${regRemainingHeader}, Reset: ${regResetHeader}`);

    // ── 7. Unrelated API endpoints remain functional when registration limiter is exhausted ──
    const unrelatedRes = await fetch(`${BASE_URL}/events`, {
      headers: { 'X-Forwarded-For': floodIp },
    });
    const test7Passed = unrelatedRes.status === 200;
    record(7, 'Unrelated API endpoints remain functional when registration limiter is exhausted', test7Passed, `GET /api/events from exhausted registration IP: HTTP ${unrelatedRes.status}`);

    // ── 8. Normal email availability checks work ──
    const checkEmailRes = await fetch(`${BASE_URL}/registrations/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.60',
      },
      body: JSON.stringify({
        email: pccoeEmail,
        eventSlug: 'datathon',
      }),
    });
    const checkEmailJson = await checkEmailRes.json();
    const test8Passed = checkEmailRes.status === 200 && checkEmailJson.available === false;
    record(8, 'Normal email availability checks work', test8Passed, `HTTP ${checkEmailRes.status}, Available: ${checkEmailJson.available}, Msg: "${checkEmailJson.message}"`);

    // ── 9. Email check requests within 100/15 min work ──
    const checkEmailProbe = await fetch(`${BASE_URL}/registrations/check-email?email=fresh.participant@gmail.com&eventSlug=datathon`, {
      headers: { 'X-Forwarded-For': '198.51.100.60' },
    });
    const checkProbeJson = await checkEmailProbe.json();
    const test9Passed = checkEmailProbe.status === 200 && checkProbeJson.available === true;
    record(9, 'Email check requests within 100/15 min work', test9Passed, `HTTP ${checkEmailProbe.status}, Available: ${checkProbeJson.available}`);

    // ── 10. Excess email check requests return 429 ──
    const emailFloodIp = '198.51.100.70';
    let emailHit429 = false;
    let emailHit429At = 0;
    let emailLastMsg = '';

    for (let i = 1; i <= 102; i++) {
      const res = await fetch(`${BASE_URL}/registrations/check-email?email=test@test.com&eventSlug=datathon`, {
        headers: { 'X-Forwarded-For': emailFloodIp },
      });
      if (res.status === 429) {
        emailHit429 = true;
        emailHit429At = i;
        const json = await res.json().catch(() => ({}));
        emailLastMsg = json.message || '';
        break;
      }
    }
    const test10Passed = emailHit429 && emailHit429At === 101;
    record(10, 'Excess email check requests return 429', test10Passed, `Blocked at request #${emailHit429At}, Msg: "${emailLastMsg}"`);

    // ── 11. RateLimit headers present on check-email ──
    const emailHeaderRes = await fetch(`${BASE_URL}/registrations/check-email?email=check@test.com&eventSlug=datathon`, {
      headers: { 'X-Forwarded-For': '198.51.100.80' },
    });
    const emailLimitHeader = emailHeaderRes.headers.get('ratelimit-limit') || emailHeaderRes.headers.get('RateLimit-Limit');
    const test11Passed = Boolean(emailLimitHeader) && emailLimitHeader.includes('100');
    record(11, 'RateLimit headers present on check-email', test11Passed, `RateLimit-Limit: ${emailLimitHeader}`);

    // ── 12. Global limit confirmed as 600/15 min ──
    const globalRes = await fetch(`${BASE_URL}/health`, {
      headers: { 'X-Forwarded-For': '198.51.100.90' },
    });
    const globalLimitHeader = globalRes.headers.get('ratelimit-limit') || globalRes.headers.get('RateLimit-Limit');
    const test12Passed = Boolean(globalLimitHeader) && globalLimitHeader.includes('600');
    record(12, 'Global limit confirmed as 600/15 min', test12Passed, `RateLimit-Limit on /api/health: ${globalLimitHeader}`);

    // ── 13. Normal public event browsing is unaffected ──
    const eventsRes = await fetch(`${BASE_URL}/events`);
    const eventSingleRes = await fetch(`${BASE_URL}/events/datathon`);
    const test13Passed = eventsRes.status === 200 && eventSingleRes.status === 200;
    record(13, 'Normal public event browsing is unaffected', test13Passed, `All events: HTTP ${eventsRes.status}, Single event: HTTP ${eventSingleRes.status}`);

    // ── 14. Payment screenshot limiter still works (10/15 min) ──
    const uploadRes = await fetch(`${BASE_URL}/registrations/upload-payment-screenshot`, {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.100' },
    });
    const uploadLimitHeader = uploadRes.headers.get('ratelimit-limit') || uploadRes.headers.get('RateLimit-Limit');
    const test14Passed = Boolean(uploadLimitHeader) && uploadLimitHeader.includes('10');
    record(14, 'Payment screenshot limiter still works (10/15 min)', test14Passed, `RateLimit-Limit on upload endpoint: ${uploadLimitHeader}`);

    // ── 15. JWT authentication still works ──
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@artimas.in',
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    const loginJson = await loginRes.json();
    const adminToken = loginJson.data?.token;
    const test15Passed = loginRes.status === 200 && Boolean(adminToken);
    record(15, 'JWT authentication still works', test15Passed, `HTTP ${loginRes.status}, Token received: ${Boolean(adminToken)}`);

    // ── 16. RBAC still works ──
    const unauthAdminRes = await fetch(`${BASE_URL}/admin/events`);
    const authAdminRes = await fetch(`${BASE_URL}/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const test16Passed = unauthAdminRes.status === 401 && authAdminRes.status === 200;
    record(16, 'RBAC still works', test16Passed, `Unauthenticated: HTTP ${unauthAdminRes.status}, Authenticated: HTTP ${authAdminRes.status}`);

    // ── 17. BOLA/IDOR protections still work ──
    // Login as event admin for datathon
    const eventAdminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'datathon',
        password: 'datathon_0987654321',
      }),
    });
    const eventAdminJson = await eventAdminLoginRes.json();
    const eventAdminToken = eventAdminJson.data?.token;

    let test17Passed = false;
    let bolaDetail = '';
    // createdIds[1] belongs to 'pixel-perfect', not 'datathon'
    if (eventAdminToken && createdIds.length >= 2) {
      const bolaRes = await fetch(`${BASE_URL}/admin/registrations/${createdIds[1]}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${eventAdminToken}`,
        },
        body: JSON.stringify({ remarks: 'Unauthorized verify attempt' }),
      });
      const bolaJson = await bolaRes.json();
      test17Passed = bolaRes.status === 403 && /forbidden/i.test(bolaJson.message);
      bolaDetail = `HTTP ${bolaRes.status}, Msg: ${bolaJson.message}`;
    } else {
      test17Passed = false;
      bolaDetail = `Token present: ${Boolean(eventAdminToken)}, IDs count: ${createdIds.length}`;
    }
    record(17, 'BOLA/IDOR protections still work', test17Passed, bolaDetail);

    // ── 18. Transaction-ID uniqueness still works ──
    const uniqueTxId = `TXN_RL_TEST_${Date.now()}`;
    const txReg1 = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.110',
      },
      body: JSON.stringify({
        eventSlug: 'datathon',
        teamName: `Tx Team 1 ${Date.now()}`,
        transactionId: uniqueTxId,
        screenshotUrl: 'https://res.cloudinary.com/dummy/image/upload/sample.jpg',
        members: [
          {
            name: 'Tx Lead 1',
            email: `external.lead1_${Date.now()}@gmail.com`,
            phone: '9876543211',
            college: 'External College',
            year: 'BE',
            branch: 'CS',
          },
        ],
      }),
    });
    const txReg1Json = await txReg1.json();
    if (txReg1Json.data?.registrationId) createdIds.push(txReg1Json.data.registrationId);

    const txReg2 = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.110',
      },
      body: JSON.stringify({
        eventSlug: 'pixel-perfect',
        teamName: `Tx Team 2 ${Date.now()}`,
        transactionId: uniqueTxId,
        screenshotUrl: 'https://res.cloudinary.com/dummy/image/upload/sample.jpg',
        members: [
          {
            name: 'Tx Lead 2',
            email: `external.lead2_${Date.now()}@gmail.com`,
            phone: '9876543212',
            college: 'External College',
            year: 'BE',
            branch: 'IT',
          },
        ],
      }),
    });
    const txReg2Json = await txReg2.json();
    const test18Passed = txReg1.status === 201 && txReg2.status === 409 && /already been used/i.test(txReg2Json.message);
    record(18, 'Transaction-ID uniqueness still works', test18Passed, `First: HTTP ${txReg1.status}, Duplicate: HTTP ${txReg2.status} (${txReg2Json.message})`);

  } finally {
    // ── Reliable Cleanup ──
    console.log(`\n🧹 Cleaning up ${createdIds.length} test registrations...`);
    if (createdIds.length > 0) {
      await Registration.deleteMany({ registrationId: { $in: createdIds } });
      for (const slug of ['datathon', 'pixel_perfect', 'pixel-perfect', 'brandathon']) {
        try {
          const coll = mongoose.connection.collection(`registrations_${slug}`);
          await coll.deleteMany({ registrationId: { $in: createdIds } });
        } catch (_) {}
      }
      console.log('✨ Test registrations removed cleanly.');
    }
    await mongoose.disconnect();
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`Summary: ${totalPassed} / ${results.length} tests passed.`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error during test suite:', err);
  process.exit(1);
});
