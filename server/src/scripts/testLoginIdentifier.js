const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== TEST: LOGIN IDENTIFIER FALLBACK REMOVAL & VALIDATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@artimas.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'QWERTYUIOP1234567890';

  try {
    // 1. Valid identifier (email) + password succeeds
    console.log('Test 1: Valid identifier (email) + password succeeds');
    const res1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const json1 = await res1.json();
    assert(res1.status === 200 && json1.success === true, 'Email login returned 200 with success: true');
    assert(Boolean(json1.data?.token), 'JWT token returned on email login');
    assert(json1.data?.admin?.email?.toLowerCase() === adminEmail, 'Admin profile returned on email login');

    // 2. Valid identifier (username) + password succeeds
    console.log('\nTest 2: Valid identifier (username) + password succeeds');
    const res2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: adminPassword }),
    });
    const json2 = await res2.json();
    assert(res2.status === 200 && json2.success === true, 'Username login returned 200 with success: true');
    assert(Boolean(json2.data?.token), 'JWT token returned on username login');

    // 3. Valid identifier (generic 'identifier' field) + password succeeds
    console.log('\nTest 3: Valid identifier via "identifier" field + password succeeds');
    const res3 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: adminPassword }),
    });
    const json3 = await res3.json();
    assert(res3.status === 200 && json3.success === true, 'Generic identifier field returned 200 with success: true');

    // 4. Missing identifier (password only) is rejected with HTTP 400
    console.log('\nTest 4: Missing identifier (password only) is rejected with HTTP 400');
    const res4 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    const json4 = await res4.json();
    assert(res4.status === 400, 'Missing identifier returned HTTP 400', `got ${res4.status}`);
    assert(json4.success === false, 'success is false');
    assert(
      json4.message === 'Validation failed' || json4.message?.includes('required'),
      'Validation message indicates failure',
      json4.message
    );
    const hasIdentifierError = json4.errors?.some(
      (e) => e.field === 'identifier' && e.message.includes('required')
    );
    assert(hasIdentifierError, 'Error details specifically cite required identifier');

    // 5. Verification that NO request can authenticate by supplying only a password
    console.log('\nTest 5: Password-only request CANNOT authenticate (legacy fallback eliminated)');
    assert(res4.status !== 200, 'Password-only request did not receive HTTP 200');
    assert(!json4.data?.token, 'No token issued for password-only request');

    // 6. Empty identifier string is rejected with HTTP 400
    console.log('\nTest 6: Empty identifier string is rejected with HTTP 400');
    const res6 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: adminPassword }),
    });
    const json6 = await res6.json();
    assert(res6.status === 400, 'Empty username string returned HTTP 400', `got ${res6.status}`);
    assert(json6.success === false, 'Empty username success is false');

    // 7. Whitespace-only identifier is rejected with HTTP 400
    console.log('\nTest 7: Whitespace-only identifier is rejected with HTTP 400');
    const res7 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '   ', password: adminPassword }),
    });
    const json7 = await res7.json();
    assert(res7.status === 400, 'Whitespace email returned HTTP 400', `got ${res7.status}`);
    assert(json7.success === false, 'Whitespace email success is false');

    // 8. Invalid / non-existent identifier is rejected with HTTP 401
    console.log('\nTest 8: Invalid identifier is rejected with HTTP 401');
    const res8 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user_xyz_999', password: adminPassword }),
    });
    const json8 = await res8.json();
    assert(res8.status === 401, 'Invalid identifier returned HTTP 401', `got ${res8.status}`);
    assert(json8.success === false, 'success is false');
    assert(json8.message === 'Invalid credentials', 'Returned "Invalid credentials"');

    // 9. Valid identifier + incorrect password is rejected with HTTP 401
    console.log('\nTest 9: Valid identifier + incorrect password is rejected with HTTP 401');
    const res9 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'WrongPassword123!' }),
    });
    const json9 = await res9.json();
    assert(res9.status === 401, 'Wrong password returned HTTP 401', `got ${res9.status}`);
    assert(json9.success === false, 'success is false');
    assert(json9.message === 'Invalid credentials', 'Returned "Invalid credentials"');

    console.log('\n====================================');
    console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('====================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
