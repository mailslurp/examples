#!/usr/bin/env node

/**
 * OTP Verification Test (Standalone)
 * 
 * Tests the complete OTP email verification workflow:
 * 1. Create MailSlurp inbox
 * 2. Browser signup on playground
 * 3. Wait for verification email
 * 4. Extract OTP code
 * 5. Browser verify OTP
 * 6. Check for welcome message
 */

const https = require('https');
const browserSignup = require('../scripts/browser-signup');
const browserVerify = require('../scripts/browser-verify');
const extractOTP = require('../scripts/extract-otp');

const API_KEY = process.env.MAILSLURP_API_KEY;
const API_HOST = 'api.mailslurp.com';
const TIMEOUT = 60000;

if (!API_KEY) {
  console.error('❌ Error: MAILSLURP_API_KEY environment variable not set');
  console.error('   Export it: export MAILSLURP_API_KEY=your_key_here');
  process.exit(1);
}

/**
 * Make HTTPS request to MailSlurp API
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Create MailSlurp inbox
 */
async function createInbox() {
  console.log('\n📬 Step 1: Creating MailSlurp inbox...');
  const inbox = await makeRequest('POST', '/inboxes');
  console.log(`✅ Created inbox: ${inbox.emailAddress}`);
  console.log(`   Inbox ID: ${inbox.id}`);
  return inbox;
}

/**
 * Wait for latest email
 */
async function waitForEmail(inboxId) {
  console.log('\n📧 Step 3: Waiting for verification email...');
  const params = new URLSearchParams({
    inboxId,
    timeout: TIMEOUT.toString(),
    unreadOnly: 'true'
  });
  
  const email = await makeRequest('GET', `/waitForLatestEmail?${params}`);
  console.log(`✅ Received email: ${email.subject}`);
  return email;
}

/**
 * Run the complete test
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('OTP EMAIL VERIFICATION TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Create inbox
    const inbox = await createInbox();

    // Step 2: Browser signup
    console.log('\n🌐 Step 2: Opening browser and filling signup form...');
    const signupResult = await browserSignup(inbox.emailAddress);
    const { browser, page } = signupResult;

    // Step 3: Wait for email
    const email = await waitForEmail(inbox.id);

    // Step 4: Extract OTP
    console.log('\n🔍 Step 4: Extracting OTP code...');
    const otpCode = extractOTP(email.body);
    
    if (!otpCode) {
      throw new Error('Failed to extract OTP code from email');
    }
    
    console.log(`✅ Extracted OTP code: ${otpCode}`);

    // Step 5: Browser verify (reuse browser from signup)
    console.log('\n✅ Step 5: Verifying OTP and logging in...');
    const verifyResult = await browserVerify(otpCode, inbox.emailAddress, browser, page);

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Email Address: ${inbox.emailAddress}`);
    console.log(`Inbox ID: ${inbox.id}`);
    console.log(`OTP Code: ${otpCode}`);
    console.log(`Verified: ${verifyResult.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`Welcome Message: ${verifyResult.welcomeMessage || 'Not found'}`);
    console.log('='.repeat(60));

    if (verifyResult.verified) {
      console.log('\n🎉 TEST PASSED: OTP email verification successful!');
      return {
        success: true,
        emailAddress: inbox.emailAddress,
        inboxId: inbox.id,
        otpCode,
        verified: true
      };
    } else {
      console.log('\n❌ TEST FAILED: Could not verify OTP');
      return {
        success: false,
        error: 'Verification failed',
        details: verifyResult
      };
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest()
  .then(result => {
    console.log('\nFinal result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
