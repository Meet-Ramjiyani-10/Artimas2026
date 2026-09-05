const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api';

const eventCredentials = [
  { slug: 'datathon', username: 'datathon', password: 'datathon_0987654321' },
  { slug: 'pixel-perfect', username: 'pixel-perfect', password: 'pixel-perfect_0987654321' },
  { slug: 'prompt-relay', username: 'prompt-relay', password: 'prompt-relay_0987654321' },
  { slug: 'brandathon', username: 'brandathon', password: 'brandathon_0987654321' },
  { slug: 'capture-the-flag', username: 'capture-the-flag', password: 'capture-the-flag_0987654321' },
  { slug: 'houdini-heist', username: 'houdini-heist', password: 'houdini-heist_0987654321' },
  { slug: 'among-us', username: 'among-us', password: 'among-us_0987654321' },
  { slug: 'hackmatrix', username: 'hackmatrix', password: 'hackmatrix_0987654321' },
];

async function verifyAll() {
  console.log('====================================================');
  console.log('ARTIMAS 26 - ROLE-BASED ADMIN COMPREHENSIVE E2E TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Master Admin Login
  console.log('Phase 1: Master Admin Authentication & Capabilities');
  const masterRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  const masterJson = await masterRes.json();
  assert(masterRes.status === 200 && masterJson.success, 'Master Admin login successful');
  assert(masterJson.data?.admin?.role === 'MASTER_ADMIN', 'Role is MASTER_ADMIN');
  const masterToken = masterJson.data?.token;

  // Master stats
  const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  const statsJson = await statsRes.json();
  assert(statsRes.status === 200 && statsJson.success, 'Master stats fetched');
  assert(statsJson.data?.totalRegistrations !== undefined, 'Stats contains totalRegistrations');
  assert(statsJson.data?.totalVerified !== undefined, 'Stats contains totalVerified');
  assert(statsJson.data?.totalUnverified !== undefined, 'Stats contains totalUnverified');
  assert(statsJson.data?.totalRevenue !== undefined, 'Stats contains totalRevenue');
  assert(statsJson.data?.totalEvents === 8, `Stats contains all 8 events (count: ${statsJson.data?.totalEvents})`);

  // 2. Event Admins Authentication & Event Isolation
  console.log('\nPhase 2: All 8 Event Admins Authentication & Event Isolation');
  const eventTokens = {};

  for (const cred of eventCredentials) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cred.username,
        password: cred.password,
      }),
    });
    const json = await res.json();
    assert(res.status === 200 && json.success, `Logged in Event Admin: ${cred.slug}`);
    assert(json.data?.admin?.role === 'EVENT_ADMIN', `Role is EVENT_ADMIN for ${cred.slug}`);
    assert(json.data?.admin?.eventSlug === cred.slug, `Assigned slug is ${cred.slug}`);
    eventTokens[cred.slug] = json.data?.token;

    // Security: Check cross-event access attempt
    const otherSlug = cred.slug === 'datathon' ? 'hackmatrix' : 'datathon';
    const tamperRes = await fetch(`${BASE_URL}/admin/registrations?eventSlug=${otherSlug}`, {
      headers: { Authorization: `Bearer ${json.data?.token}` },
    });
    assert(tamperRes.status === 403, `${cred.slug} admin blocked from ${otherSlug} (HTTP 403 Forbidden)`);
  }

  // 3. Verification & Server-side Verified CSV Export
  console.log('\nPhase 3: Verification, Unverification & Verified-only CSV Export');
  const dtToken = eventTokens['datathon'];
  const regsRes = await fetch(`${BASE_URL}/admin/registrations?limit=5`, {
    headers: { Authorization: `Bearer ${dtToken}` },
  });
  const regsJson = await regsRes.json();
  assert(regsRes.status === 200 && regsJson.data?.length > 0, 'Fetched Datathon registrations');

  if (regsJson.data?.length > 0) {
    const target = regsJson.data[0];

    // Verify
    const vRes = await fetch(`${BASE_URL}/admin/registrations/${target.registrationId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dtToken}`,
      },
      body: JSON.stringify({ remarks: 'E2E Verified' }),
    });
    const vJson = await vRes.json();
    assert(vRes.status === 200 && vJson.success, `Verified participant [${target.registrationId}]`);
    assert(vJson.data?.verified === true, 'Verified flag is true');

    // Export Verified CSV
    const csvRes = await fetch(`${BASE_URL}/admin/export/verified-csv`, {
      headers: { Authorization: `Bearer ${dtToken}` },
    });
    const csvContent = await csvRes.text();
    assert(csvRes.status === 200, 'Server exported CSV with status 200');
    assert(
      csvContent.startsWith('Team Name,Registration ID,Email,Contact,College,Members'),
      'CSV header is exact: Team Name,Registration ID,Email,Contact,College,Members'
    );
    assert(
      csvContent.includes(target.registrationId),
      `Verified participant ${target.registrationId} is present in CSV`
    );

    // Unverify
    const uvRes = await fetch(`${BASE_URL}/admin/registrations/${target.registrationId}/unverify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dtToken}`,
      },
      body: JSON.stringify({ remarks: 'E2E Unverified' }),
    });
    const uvJson = await uvRes.json();
    assert(uvRes.status === 200 && uvJson.success, `Unverified participant [${target.registrationId}]`);
    assert(uvJson.data?.verified === false, 'Verified flag is false after unverify');

    // Re-check CSV after unverify
    const csvRes2 = await fetch(`${BASE_URL}/admin/export/verified-csv`, {
      headers: { Authorization: `Bearer ${dtToken}` },
    });
    const csvContent2 = await csvRes2.text();
    assert(
      !csvContent2.includes(target.registrationId),
      `Unverified participant ${target.registrationId} is NOT present in CSV`
    );
  }

  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

verifyAll();
