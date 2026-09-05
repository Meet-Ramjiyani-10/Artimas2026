const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING ROLE-BASED ADMIN TESTS ===\n');
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

  try {
    // 1. Test Master Admin Login by username
    console.log('Test 1: Master Admin Login by username "admin"');
    const masterRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin_artimas2026' }),
    });
    const masterJson = await masterRes.json();
    assert(masterRes.status === 200 && masterJson.success, 'Master admin logged in successfully');
    assert(masterJson.data?.admin?.role === 'MASTER_ADMIN', 'Role is MASTER_ADMIN');
    assert(masterJson.data?.admin?.eventId === null, 'Master admin eventId is null');
    const masterToken = masterJson.data?.token;

    // 2. Test Datathon Admin Login by username
    console.log('\nTest 2: Datathon Admin Login by username "datathon"');
    const datathonRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'datathon', password: 'datathon_0987654321' }),
    });
    const datathonJson = await datathonRes.json();
    assert(datathonRes.status === 200 && datathonJson.success, 'Datathon admin logged in successfully');
    assert(datathonJson.data?.admin?.role === 'EVENT_ADMIN', 'Role is EVENT_ADMIN');
    assert(datathonJson.data?.admin?.eventSlug === 'datathon', 'Assigned eventSlug is datathon');
    const datathonToken = datathonJson.data?.token;

    // 3. Test HackMatrix Admin Login by username
    console.log('\nTest 3: HackMatrix Admin Login by username "hackmatrix"');
    const hackmatrixRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'hackmatrix', password: 'hackmatrix_0987654321' }),
    });
    const hackmatrixJson = await hackmatrixRes.json();
    assert(hackmatrixRes.status === 200 && hackmatrixJson.success, 'Hackmatrix admin logged in successfully');
    assert(hackmatrixJson.data?.admin?.eventSlug === 'hackmatrix', 'Assigned eventSlug is hackmatrix');
    const hackmatrixToken = hackmatrixJson.data?.token;

    // 4. Test Datathon Admin fetching registrations (must only return Datathon)
    console.log('\nTest 4: Datathon Admin fetching registrations');
    const dtRegsRes = await fetch(`${BASE_URL}/admin/registrations?limit=100`, {
      headers: { Authorization: `Bearer ${datathonToken}` },
    });
    const dtRegsJson = await dtRegsRes.json();
    assert(dtRegsRes.status === 200 && dtRegsJson.success, 'Fetched registrations');
    const allAreDatathon = dtRegsJson.data.every(
      (r) => (r.eventSlug && r.eventSlug.toLowerCase() === 'datathon') || (r.eventName && /datathon/i.test(r.eventName))
    );
    assert(allAreDatathon, 'All returned registrations belong strictly to Datathon');
    console.log(`    (Datathon registrations count: ${dtRegsJson.total})`);

    // 5. Test Datathon Admin trying to access Hackmatrix data (must be 403 Forbidden)
    console.log('\nTest 5: Cross-event tampering security check');
    const tamperRes = await fetch(`${BASE_URL}/admin/registrations?eventSlug=hackmatrix`, {
      headers: { Authorization: `Bearer ${datathonToken}` },
    });
    assert(tamperRes.status === 403, 'Server strictly rejected cross-event query with 403 Forbidden');

    // 6. Test Event Admin Stats
    console.log('\nTest 6: Datathon Admin Stats');
    const dtStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${datathonToken}` },
    });
    const dtStatsJson = await dtStatsRes.json();
    assert(dtStatsRes.status === 200 && dtStatsJson.success, 'Fetched event admin stats');
    assert(dtStatsJson.data.total !== undefined, 'Stats has total');
    assert(dtStatsJson.data.verified !== undefined, 'Stats has verified');
    assert(dtStatsJson.data.unverified !== undefined, 'Stats has unverified');
    assert(dtStatsJson.data.totalTeams !== undefined, 'Stats has totalTeams');

    // 7. Test Verification and Unverification flow
    if (dtRegsJson.data.length > 0) {
      const targetReg = dtRegsJson.data[0];
      console.log(`\nTest 7: Verify registration [${targetReg.registrationId}]`);
      const verifyRes = await fetch(`${BASE_URL}/admin/registrations/${targetReg.registrationId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${datathonToken}`,
        },
        body: JSON.stringify({ remarks: 'Verified by Datathon test' }),
      });
      const verifyJson = await verifyRes.json();
      assert(verifyRes.status === 200 && verifyJson.success, 'Registration verified successfully');

      // Check CSV export contains this verified participant
      console.log('\nTest 8: Server-side Verified CSV Export');
      const csvRes = await fetch(`${BASE_URL}/admin/export/verified-csv`, {
        headers: { Authorization: `Bearer ${datathonToken}` },
      });
      const csvText = await csvRes.text();
      assert(csvRes.status === 200, 'CSV export returned status 200');
      const lines = csvText.trim().split('\r\n');
      assert(
        lines[0] === 'Team Name,Registration ID,Email,Contact,College,Members',
        'CSV has correct header: Team Name,Registration ID,Email,Contact,College,Members'
      );
      assert(
        csvText.includes(targetReg.registrationId),
        `CSV contains verified registration ID [${targetReg.registrationId}]`
      );

      // Test cross-event verify attempt: Datathon admin tries verifying a Hackmatrix registration
      console.log('\nTest 9: Cross-event verification protection');
      const hmRegsRes = await fetch(`${BASE_URL}/admin/registrations?limit=5`, {
        headers: { Authorization: `Bearer ${hackmatrixToken}` },
      });
      const hmRegsJson = await hmRegsRes.json();
      if (hmRegsJson.data && hmRegsJson.data.length > 0) {
        const hmReg = hmRegsJson.data[0];
        const crossVerifyRes = await fetch(`${BASE_URL}/admin/registrations/${hmReg.registrationId}/verify`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${datathonToken}`,
          },
          body: JSON.stringify({ remarks: 'Malicious cross verify' }),
        });
        assert(crossVerifyRes.status === 403, 'Cross-event verification attempt blocked with 403 Forbidden');
      } else {
        console.log('    (No Hackmatrix registrations to test cross-verify; test skipped)');
      }

      // Test Unverify
      console.log(`\nTest 10: Unverify registration [${targetReg.registrationId}]`);
      const unverifyRes = await fetch(`${BASE_URL}/admin/registrations/${targetReg.registrationId}/unverify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${datathonToken}`,
        },
        body: JSON.stringify({ remarks: 'Resetting verification' }),
      });
      const unverifyJson = await unverifyRes.json();
      assert(unverifyRes.status === 200 && unverifyJson.success, 'Registration unverified successfully');
    }

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
