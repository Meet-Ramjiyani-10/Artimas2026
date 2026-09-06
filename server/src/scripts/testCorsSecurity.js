const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = require('../app');
const connectDB = require('../config/db');

async function runTests() {
  console.log('=== TEST: PRODUCTION CORS SECURITY FIX ===\n');
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

  // Connect to database for authenticated API test
  await connectDB();

  // Create ephemeral HTTP server with the actual app
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ----------------------------------------------------
    // Scenario A: Development Environment Tests
    // ----------------------------------------------------
    process.env.NODE_ENV = 'development';
    console.log('--- Suite 1: Development Environment (NODE_ENV=development) ---');

    // 1. Allowed localhost development origin
    console.log('Test 1: Allowed localhost development origin (http://localhost:3000)');
    const devRes1 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'http://localhost:3000' },
    });
    assert(devRes1.status === 200, 'Localhost dev request returned 200');
    assert(
      devRes1.headers.get('access-control-allow-origin') === 'http://localhost:3000',
      'access-control-allow-origin header set to http://localhost:3000'
    );
    assert(
      devRes1.headers.get('access-control-allow-credentials') === 'true',
      'access-control-allow-credentials header is true'
    );

    // 2. Allowed 127.0.0.1 development origin
    console.log('\nTest 2: Allowed 127.0.0.1 development origin (http://127.0.0.1:3000)');
    const devRes2 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'http://127.0.0.1:3000' },
    });
    assert(devRes2.status === 200, '127.0.0.1 request returned 200');
    assert(
      devRes2.headers.get('access-control-allow-origin') === 'http://127.0.0.1:3000',
      'access-control-allow-origin header set to http://127.0.0.1:3000'
    );

    // 3. Arbitrary malicious origin in development MUST be blocked
    console.log('\nTest 3: Arbitrary malicious origin (https://malicious-attacker.com) blocked in dev');
    const devRes3 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://malicious-attacker.com' },
    });
    assert(
      devRes3.headers.get('access-control-allow-origin') === null,
      'CORS blocked: access-control-allow-origin is omitted for malicious origin',
      `got ${devRes3.headers.get('access-control-allow-origin')}`
    );

    // 4. Arbitrary Vercel preview origin in development MUST be blocked
    console.log('\nTest 4: Arbitrary Vercel preview (https://random-app.vercel.app) blocked in dev');
    const devRes4 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://random-app.vercel.app' },
    });
    assert(
      devRes4.headers.get('access-control-allow-origin') === null,
      'CORS blocked: access-control-allow-origin is omitted for arbitrary .vercel.app',
      `got ${devRes4.headers.get('access-control-allow-origin')}`
    );

    // ----------------------------------------------------
    // Scenario B: Production Environment Tests
    // ----------------------------------------------------
    console.log('\n--- Suite 2: Production Environment (NODE_ENV=production) ---');
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://artimas.in,https://admin.artimas.in,https://staging-allowed.vercel.app';
    process.env.CLIENT_URL = 'https://artimas.in';

    // 5. Allowed production origin (artimas.in)
    console.log('Test 5: Configured production origin (https://artimas.in) allowed in production');
    const prodRes1 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://artimas.in' },
    });
    assert(prodRes1.status === 200, 'Production origin returned status 200');
    assert(
      prodRes1.headers.get('access-control-allow-origin') === 'https://artimas.in',
      'access-control-allow-origin matches https://artimas.in'
    );
    assert(
      prodRes1.headers.get('access-control-allow-credentials') === 'true',
      'Credentials allowed for production origin'
    );

    // 6. Secondary allowed origin from comma-separated ALLOWED_ORIGINS
    console.log('\nTest 6: Secondary configured origin (https://admin.artimas.in) allowed');
    const prodRes2 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://admin.artimas.in' },
    });
    assert(
      prodRes2.headers.get('access-control-allow-origin') === 'https://admin.artimas.in',
      'Secondary configured origin permitted'
    );

    // 7. Explicitly configured preview origin allowed
    console.log('\nTest 7: Explicitly whitelisted preview origin (https://staging-allowed.vercel.app) allowed');
    const prodRes3 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://staging-allowed.vercel.app' },
    });
    assert(
      prodRes3.headers.get('access-control-allow-origin') === 'https://staging-allowed.vercel.app',
      'Explicitly whitelisted Vercel preview domain permitted'
    );

    // 8. Arbitrary unlisted Vercel preview origin MUST be blocked in production
    console.log('\nTest 8: Arbitrary unlisted Vercel preview (https://attacker-phishing.vercel.app) blocked');
    const prodRes4 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://attacker-phishing.vercel.app' },
    });
    assert(
      prodRes4.headers.get('access-control-allow-origin') === null,
      'Arbitrary Vercel preview strictly blocked in production',
      `got ${prodRes4.headers.get('access-control-allow-origin')}`
    );

    // 9. Arbitrary Netlify origin MUST be blocked
    console.log('\nTest 9: Arbitrary Netlify origin (https://evil.netlify.app) blocked');
    const prodRes5 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'https://evil.netlify.app' },
    });
    assert(
      prodRes5.headers.get('access-control-allow-origin') === null,
      'Arbitrary Netlify site strictly blocked'
    );

    // 10. Localhost NOT allowed in production unless explicitly in ALLOWED_ORIGINS
    console.log('\nTest 10: Localhost blocked in production when not explicitly in ALLOWED_ORIGINS');
    const prodRes6 = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'http://localhost:3000' },
    });
    assert(
      prodRes6.headers.get('access-control-allow-origin') === null,
      'Localhost blocked in production mode when unconfigured'
    );

    // 11. Preflight OPTIONS request for allowed production origin
    console.log('\nTest 11: Preflight OPTIONS request for allowed origin');
    const preflightRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: 'https://artimas.in',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });
    assert(preflightRes.status === 204, 'Preflight returns 204 No Content', `got ${preflightRes.status}`);
    assert(
      preflightRes.headers.get('access-control-allow-origin') === 'https://artimas.in',
      'Preflight includes access-control-allow-origin'
    );
    assert(
      preflightRes.headers.get('access-control-allow-credentials') === 'true',
      'Preflight includes credentials'
    );

    // 12. Preflight OPTIONS request for unauthorized origin
    console.log('\nTest 12: Preflight OPTIONS request for unauthorized origin');
    const unauthorizedPreflight = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: 'https://malicious-site.com',
        'access-control-request-method': 'POST',
      },
    });
    assert(
      unauthorizedPreflight.headers.get('access-control-allow-origin') === null,
      'Unauthorized preflight omits access-control-allow-origin'
    );

    // 13. No-origin / server-to-server / curl request
    console.log('\nTest 13: Request with no origin (server-to-server / curl)');
    const noOriginRes = await fetch(`${baseUrl}/api/health`);
    assert(noOriginRes.status === 200, 'Direct request without origin succeeds with status 200');

    // 14. Existing authenticated API behavior preserved
    console.log('\nTest 14: Existing authenticated login API with allowed origin');
    const adminPassword = process.env.ADMIN_PASSWORD || 'QWERTYUIOP1234567890';
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://artimas.in',
      },
      body: JSON.stringify({
        username: 'admin',
        password: adminPassword,
      }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && loginJson.success === true, 'Admin login succeeded with 200');
    assert(
      loginRes.headers.get('access-control-allow-origin') === 'https://artimas.in',
      'Login response has correct CORS origin'
    );
    assert(Boolean(loginJson.data?.token), 'Login response returned JWT token');

    console.log('\n====================================');
    console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('====================================\n');

    await new Promise((resolve) => server.close(resolve));
    const mongoose = require('mongoose');
    await mongoose.connection.close();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test run error:', err);
    await new Promise((resolve) => server.close(resolve));
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
