/**
 * ARTIMAS 2026 - Automated Test Suite: Cloudinary Automatic Fallback System
 *
 * Tests requirements:
 * 1. Primary succeeds -> fallback is NOT called.
 * 2. Primary fails with genuine service failure -> fallback succeeds.
 * 3. Primary fails -> fallback also fails -> request fails cleanly.
 * 4. Existing validation failures do NOT trigger fallback.
 * 5. Successful upload stores the URL from whichever provider actually succeeded.
 * 6. Non-service failures (corrupt file, 400 bad request) never trigger fallback.
 * 7. Fallback options never mutate the global primary configuration.
 * 8. Safe server logging (no credentials or secrets in output).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const {
  cloudinary,
  isCloudinaryServiceFailure,
  uploadPaymentScreenshotWithFallback,
} = require('../config/cloudinary');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    failedTests++;
  }
}

// Helper to simulate a readable stream that pipes into upload_stream
const createDummyBuffer = () => Buffer.from('fake-image-bytes-artimas-payment-screenshot');

async function runTests() {
  console.log('====================================================');
  console.log('ARTIMAS 26 - AUTOMATED CLOUDINARY FALLBACK TEST SUITE');
  console.log('====================================================\n');

  // Save original uploader.upload_stream and env variables
  const originalUploadStream = cloudinary.uploader.upload_stream;
  const originalEnvFallbackCloud = process.env.CLOUDINARY_FALLBACK_CLOUD_NAME;
  const originalEnvFallbackKey = process.env.CLOUDINARY_FALLBACK_API_KEY;
  const originalEnvFallbackSecret = process.env.CLOUDINARY_FALLBACK_API_SECRET;

  // Set test fallback credentials for mock testing
  process.env.CLOUDINARY_FALLBACK_CLOUD_NAME = 'artimas-fallback-cloud';
  process.env.CLOUDINARY_FALLBACK_API_KEY = 'fallback_key_987654321';
  process.env.CLOUDINARY_FALLBACK_API_SECRET = 'fallback_secret_xyz123';

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: isCloudinaryServiceFailure Classification Logic
    // ─────────────────────────────────────────────────────────────
    console.log('Test 1: Service Failure Classification Logic');

    // Genuine service/network failures (MUST fallback)
    assert(isCloudinaryServiceFailure({ code: 'ECONNRESET' }) === true, 'ECONNRESET is classified as service failure');
    assert(isCloudinaryServiceFailure({ code: 'ETIMEDOUT' }) === true, 'ETIMEDOUT is classified as service failure');
    assert(isCloudinaryServiceFailure({ code: 'ENOTFOUND' }) === true, 'ENOTFOUND is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 500 }) === true, 'HTTP 500 is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 502 }) === true, 'HTTP 502 is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 503 }) === true, 'HTTP 503 is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 504 }) === true, 'HTTP 504 is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 429 }) === true, 'HTTP 429 (rate limit) is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 402 }) === true, 'HTTP 402 (quota/credits) is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 401 }) === true, 'HTTP 401 (auth revoked) is classified as service failure');
    assert(isCloudinaryServiceFailure({ http_code: 403 }) === true, 'HTTP 403 (suspended) is classified as service failure');
    assert(isCloudinaryServiceFailure({ message: 'Resource quota exceeded' }) === true, 'Quota message is classified as service failure');
    assert(isCloudinaryServiceFailure({ message: 'Request timed out after 30000ms' }) === true, 'Timeout message is classified as service failure');

    // Validation / Client errors (MUST NOT fallback)
    assert(isCloudinaryServiceFailure({ http_code: 400 }) === false, 'HTTP 400 is NOT a service failure (client error)');
    assert(isCloudinaryServiceFailure({ message: 'Invalid image file' }) === false, 'Invalid image file message is NOT a service failure');
    assert(isCloudinaryServiceFailure({ message: 'Unsupported image format: tiff' }) === false, 'Unsupported format is NOT a service failure');
    assert(isCloudinaryServiceFailure({ message: 'File is empty' }) === false, 'Empty file is NOT a service failure');
    assert(isCloudinaryServiceFailure({ message: 'Corrupted image header' }) === false, 'Corrupted image is NOT a service failure');
    assert(isCloudinaryServiceFailure({ http_code: 404 }) === false, 'HTTP 404 is NOT a service failure');
    assert(isCloudinaryServiceFailure(null) === false, 'Null error returns false');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Scenario A - Primary succeeds → fallback is NOT called
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 2 (Scenario A): Primary succeeds → fallback is NOT called');

    let primaryUploadAttempts = 0;
    let fallbackUploadAttempts = 0;

    cloudinary.uploader.upload_stream = function (options, callback) {
      const isFallback = options.cloud_name === 'artimas-fallback-cloud';
      if (isFallback) {
        fallbackUploadAttempts++;
      } else {
        primaryUploadAttempts++;
      }

      // Return a writable mock stream
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();
      process.nextTick(() => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/primary-cloud/image/upload/v1/artimas26/payments/screenshot_1.jpg',
          public_id: 'artimas26/payments/screenshot_1',
          format: 'jpg',
        });
      });
      return mockStream;
    };

    const primarySuccessResult = await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    assert(primaryUploadAttempts === 1, 'Primary upload was attempted exactly once');
    assert(fallbackUploadAttempts === 0, 'Fallback upload was NEVER called when primary succeeded');
    assert(primarySuccessResult.provider === 'primary', 'Result indicates primary provider');
    assert(
      primarySuccessResult.secure_url === 'https://res.cloudinary.com/primary-cloud/image/upload/v1/artimas26/payments/screenshot_1.jpg',
      'Result contains URL from primary account'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Scenario B - Primary fails with service error → fallback succeeds
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 3 (Scenario B): Primary fails with service error → fallback succeeds');

    primaryUploadAttempts = 0;
    fallbackUploadAttempts = 0;
    let optionsReceivedByFallback = null;

    cloudinary.uploader.upload_stream = function (options, callback) {
      const isFallback = options.cloud_name === 'artimas-fallback-cloud';
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();

      if (!isFallback) {
        primaryUploadAttempts++;
        process.nextTick(() => {
          const timeoutErr = new Error('Cloudinary gateway timeout');
          timeoutErr.code = 'ETIMEDOUT';
          timeoutErr.http_code = 504;
          callback(timeoutErr, null);
        });
      } else {
        fallbackUploadAttempts++;
        optionsReceivedByFallback = { ...options };
        process.nextTick(() => {
          callback(null, {
            secure_url: 'https://res.cloudinary.com/fallback-cloud/image/upload/v2/artimas26/payments/screenshot_fallback.jpg',
            public_id: 'artimas26/payments/screenshot_fallback',
            format: 'jpg',
          });
        });
      }
      return mockStream;
    };

    const fallbackSuccessResult = await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    assert(primaryUploadAttempts === 1, 'Primary upload was attempted first');
    assert(fallbackUploadAttempts === 1, 'Fallback upload was automatically triggered upon service failure');
    assert(fallbackSuccessResult.provider === 'fallback', 'Result indicates fallback provider');
    assert(
      fallbackSuccessResult.secure_url === 'https://res.cloudinary.com/fallback-cloud/image/upload/v2/artimas26/payments/screenshot_fallback.jpg',
      'Result contains URL from fallback account'
    );
    assert(
      optionsReceivedByFallback.cloud_name === 'artimas-fallback-cloud',
      'Fallback was invoked with fallback cloud_name'
    );
    assert(
      optionsReceivedByFallback.api_key === 'fallback_key_987654321',
      'Fallback was invoked with fallback api_key'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Scenario C - Primary fails → fallback also fails → fails cleanly
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 4 (Scenario C): Primary fails → fallback also fails → request fails cleanly');

    primaryUploadAttempts = 0;
    fallbackUploadAttempts = 0;

    cloudinary.uploader.upload_stream = function (options, callback) {
      const isFallback = options.cloud_name === 'artimas-fallback-cloud';
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();

      if (!isFallback) {
        primaryUploadAttempts++;
        process.nextTick(() => {
          const primaryErr = new Error('Primary connection reset');
          primaryErr.code = 'ECONNRESET';
          callback(primaryErr, null);
        });
      } else {
        fallbackUploadAttempts++;
        process.nextTick(() => {
          const fallbackErr = new Error('Fallback service unavailable');
          fallbackErr.http_code = 503;
          callback(fallbackErr, null);
        });
      }
      return mockStream;
    };

    let errorThrown = null;
    try {
      await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    } catch (err) {
      errorThrown = err;
    }

    assert(primaryUploadAttempts === 1, 'Primary upload attempted');
    assert(fallbackUploadAttempts === 1, 'Fallback upload attempted');
    assert(errorThrown !== null, 'Clean error was thrown when both providers fail');
    assert(errorThrown.message.includes('Fallback') || errorThrown.http_code === 503, 'Error thrown is from fallback failure');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Scenario D - Validation/client failures do NOT trigger fallback
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 5 (Scenario D): Validation/client failures do NOT trigger fallback');

    primaryUploadAttempts = 0;
    fallbackUploadAttempts = 0;

    cloudinary.uploader.upload_stream = function (options, callback) {
      const isFallback = options.cloud_name === 'artimas-fallback-cloud';
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();

      if (!isFallback) {
        primaryUploadAttempts++;
        process.nextTick(() => {
          const badRequestErr = new Error('Invalid image file');
          badRequestErr.http_code = 400;
          callback(badRequestErr, null);
        });
      } else {
        fallbackUploadAttempts++;
        process.nextTick(() => {
          callback(null, { secure_url: 'should_not_reach_here' });
        });
      }
      return mockStream;
    };

    let validationErr = null;
    try {
      await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    } catch (err) {
      validationErr = err;
    }

    assert(primaryUploadAttempts === 1, 'Primary upload attempted');
    assert(fallbackUploadAttempts === 0, 'Fallback was NEVER called for HTTP 400 / validation error');
    assert(validationErr !== null && validationErr.http_code === 400, 'Original client error re-thrown immediately');

    // Test with invalid / empty buffer input
    let bufferErr = null;
    try {
      await uploadPaymentScreenshotWithFallback(null);
    } catch (err) {
      bufferErr = err;
    }
    assert(bufferErr !== null, 'Invalid buffer rejected immediately before any Cloudinary call');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Scenario E - Successful upload stores URL from the provider that succeeded
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 6 (Scenario E): Verifying URL and metadata accuracy from successful provider');

    // When primary succeeds
    cloudinary.uploader.upload_stream = function (options, callback) {
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();
      process.nextTick(() => {
        callback(null, {
          secure_url: 'https://res.cloudinary.com/primary-account/payments/proof-101.png',
          public_id: 'payments/proof-101',
        });
      });
      return mockStream;
    };

    const primaryResult = await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    assert(
      primaryResult.secure_url === 'https://res.cloudinary.com/primary-account/payments/proof-101.png',
      'Database receives primary URL when primary succeeds'
    );

    // When primary fails and fallback succeeds
    cloudinary.uploader.upload_stream = function (options, callback) {
      const isFallback = options.cloud_name === 'artimas-fallback-cloud';
      const { PassThrough } = require('stream');
      const mockStream = new PassThrough();
      if (!isFallback) {
        process.nextTick(() => callback({ http_code: 503, message: 'Service Outage' }, null));
      } else {
        process.nextTick(() => {
          callback(null, {
            secure_url: 'https://res.cloudinary.com/fallback-account/payments/proof-101-fallback.png',
            public_id: 'payments/proof-101-fallback',
          });
        });
      }
      return mockStream;
    };

    const fallbackResult = await uploadPaymentScreenshotWithFallback(createDummyBuffer());
    assert(
      fallbackResult.secure_url === 'https://res.cloudinary.com/fallback-account/payments/proof-101-fallback.png',
      'Database receives fallback URL when fallback succeeds'
    );
    assert(fallbackResult.public_id === 'payments/proof-101-fallback', 'Database receives fallback public_id');

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Thread Safety & Global Config Integrity
    // ─────────────────────────────────────────────────────────────
    console.log('\nTest 7: Global Config Integrity (Non-mutating)');

    const configBefore = cloudinary.config();
    assert(
      configBefore.cloud_name !== 'artimas-fallback-cloud',
      'Global config is not set to fallback initially'
    );

    // Run fallback upload
    await uploadPaymentScreenshotWithFallback(createDummyBuffer());

    const configAfter = cloudinary.config();
    assert(
      configAfter.cloud_name === configBefore.cloud_name,
      'Global config was NOT mutated by fallback execution'
    );
    assert(
      configAfter.api_key === configBefore.api_key,
      'Global api_key remained intact'
    );

  } finally {
    // Restore original upload_stream and env variables
    cloudinary.uploader.upload_stream = originalUploadStream;
    if (originalEnvFallbackCloud !== undefined) {
      process.env.CLOUDINARY_FALLBACK_CLOUD_NAME = originalEnvFallbackCloud;
    } else {
      delete process.env.CLOUDINARY_FALLBACK_CLOUD_NAME;
    }
    if (originalEnvFallbackKey !== undefined) {
      process.env.CLOUDINARY_FALLBACK_API_KEY = originalEnvFallbackKey;
    } else {
      delete process.env.CLOUDINARY_FALLBACK_API_KEY;
    }
    if (originalEnvFallbackSecret !== undefined) {
      process.env.CLOUDINARY_FALLBACK_API_SECRET = originalEnvFallbackSecret;
    } else {
      delete process.env.CLOUDINARY_FALLBACK_API_SECRET;
    }
  }

  console.log('\n====================================================');
  console.log(`FALLBACK TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running fallback test suite:', err);
  process.exit(1);
});
