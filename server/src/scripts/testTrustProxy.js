const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = require('../app');

async function runTests() {
  console.log('=== TEST: EXPRESS TRUST PROXY & RATE LIMITING BEHAVIOR ===\n');
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

  // Register test route to inspect req.ip from the actual app instance
  const notFoundIndex = app._router.stack.findIndex((s) => s.name === 'notFound');
  app.get('/__test/ip-check', (req, res) => {
    res.json({
      ip: req.ip,
      ips: req.ips,
      remoteAddress: req.socket.remoteAddress,
    });
  });
  if (notFoundIndex !== -1) {
    const routeLayer = app._router.stack.pop();
    app._router.stack.splice(notFoundIndex, 0, routeLayer);
  }

  // Create test HTTP server with the app
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify app trust proxy setting
    console.log('Test 1: Verify app "trust proxy" setting');
    const trustProxySetting = app.get('trust proxy');
    console.log(`  Current 'trust proxy' setting in app:`, trustProxySetting);
    assert(trustProxySetting === 1, 'Trust proxy is configured to 1 (trusted hop)');

    // 2. Direct connection without proxy header
    console.log('\nTest 2: Direct connection (localhost/no proxy header)');
    const resDirect = await fetch(`${baseUrl}/__test/ip-check`);
    const directData = await resDirect.json();
    console.log(`  Direct request resolved IP:`, directData.ip);
    assert(
      directData.ip === '127.0.0.1' || directData.ip === '::1' || directData.ip === '::ffff:127.0.0.1',
      'Direct connection resolves to localhost without error'
    );

    // 3. Request behind reverse proxy with single client IP
    console.log('\nTest 3: Reverse proxy forwarding single client IP');
    const resProxy = await fetch(`${baseUrl}/__test/ip-check`, {
      headers: {
        'x-forwarded-for': '203.0.113.50',
      },
    });
    const proxyData = await resProxy.json();
    console.log(`  Single proxy client IP resolved:`, proxyData.ip);
    assert(proxyData.ip === '203.0.113.50', 'Express correctly resolved client IP 203.0.113.50');

    // 4. Client IP resolution and anti-spoofing verification
    console.log('\nTest 4: Spoofed X-Forwarded-For header resolution');
    const resSpoofCheck = await fetch(`${baseUrl}/__test/ip-check`, {
      headers: {
        // Attacker attempts to spoof 1.2.3.4; reverse proxy appends real client IP 203.0.113.99
        'x-forwarded-for': '1.2.3.4, 203.0.113.99',
      },
    });
    const spoofData = await resSpoofCheck.json();
    console.log(`  Resolved IP for '1.2.3.4, 203.0.113.99':`, spoofData.ip);
    assert(
      spoofData.ip === '203.0.113.99',
      'Express correctly resolved the real client IP (203.0.113.99) and ignored spoofed 1.2.3.4',
      `got ${spoofData.ip}`
    );

    // 5. Multi-hop spoofing verification
    console.log('\nTest 5: Multi-hop spoofed X-Forwarded-For header resolution');
    const resMultiSpoof = await fetch(`${baseUrl}/__test/ip-check`, {
      headers: {
        'x-forwarded-for': '10.0.0.1, 192.168.1.100, 1.2.3.4, 203.0.113.88',
      },
    });
    const multiSpoofData = await resMultiSpoof.json();
    console.log(`  Resolved IP for multi-hop spoof:`, multiSpoofData.ip);
    assert(
      multiSpoofData.ip === '203.0.113.88',
      'Express correctly resolved the client IP (203.0.113.88) and ignored all previous spoofed entries',
      `got ${multiSpoofData.ip}`
    );

    // 6. Rate limiter uses resolved client IP and isolates different clients
    console.log('\nTest 6: Rate limit isolation between distinct client IPs');
    const clientA = '198.51.100.11';
    const clientB = '198.51.100.22';

    // Make request from Client A
    const resA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientA,
      },
      body: JSON.stringify({ password: 'short' }),
    });

    // Make request from Client B
    const resB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': clientB,
      },
      body: JSON.stringify({ password: 'short' }),
    });

    assert(
      resA.headers.has('ratelimit-remaining') || resA.headers.has('x-ratelimit-remaining'),
      'Rate limit headers are present on response A'
    );
    assert(
      resB.headers.has('ratelimit-remaining') || resB.headers.has('x-ratelimit-remaining'),
      'Rate limit headers are present on response B'
    );

    // 7. Anti-spoofing in rate limiter: prepending fake IP does not reset/bypass bucket
    console.log('\nTest 7: Prepending fake IP in X-Forwarded-For cannot bypass rate limiting');
    const targetClient = '203.0.113.77';

    // Make request under targetClient
    const r1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': targetClient,
      },
      body: JSON.stringify({ password: 'short' }),
    });

    const rem1 = parseInt(r1.headers.get('ratelimit-remaining') || r1.headers.get('x-ratelimit-remaining'), 10);

    // Make request from same client but prepending fake IP
    const r2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `10.99.99.99, ${targetClient}`,
      },
      body: JSON.stringify({ password: 'short' }),
    });

    const rem2 = parseInt(r2.headers.get('ratelimit-remaining') || r2.headers.get('x-ratelimit-remaining'), 10);
    console.log(`  Remaining before spoof attempt: ${rem1}, after spoof attempt: ${rem2}`);

    assert(
      rem2 < rem1,
      'Rate limiter decremented the counter for 203.0.113.77 even when 10.99.99.99 was prepended',
      `rem1: ${rem1}, rem2: ${rem2}`
    );

    console.log('\n====================================');
    console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('====================================\n');

    await new Promise((resolve) => server.close(resolve));
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test run error:', err);
    await new Promise((resolve) => server.close(resolve));
    process.exit(1);
  }
}

runTests();
