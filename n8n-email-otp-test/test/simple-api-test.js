#!/usr/bin/env node

/**
 * Simple API Test (No Browser)
 * 
 * Tests just the MailSlurp API flow:
 * 1. Create inbox
 * 2. Send test email to inbox
 * 3. Wait for email
 * 4. Extract OTP from email
 */

const https = require('https');
const extractOTP = require('../scripts/extract-otp');

const API_KEY = process.env.MAILSLURP_API_KEY;
const API_HOST = 'api.mailslurp.com';
const TIMEOUT = 60000;

if (!API_KEY) {
  console.error('❌ Error: MAILSLURP_API_KEY environment variable not set');
  process.exit(1);
}

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

async function runTest() {
  console.log('='.repeat(60));
  console.log('SIMPLE API TEST (No Browser)');
  console.log('='.repeat(60));

  try {
    // Step 1: Create inbox
    console.log('\n📬 Step 1: Creating MailSlurp inbox...');
    const inbox = await makeRequest('POST', '/inboxes');
    console.log(`✅ Created inbox: ${inbox.emailAddress}`);
    console.log(`   Inbox ID: ${inbox.id}`);

    // Step 2: Send test email to inbox
    console.log('\n📧 Step 2: Sending test email with OTP code...');
    const emailBody = {
      to: [inbox.emailAddress],
      subject: 'Test OTP Verification Email',
      body: 'Your verification code is:\n\n123456',
      isHTML: false
    };
    
    await makeRequest('POST', '/send-email', emailBody);
    console.log('✅ Test email sent');

    // Step 3: Wait for email
    console.log('\n⏳ Step 3: Waiting for email...');
    const params = new URLSearchParams({
      inboxId: inbox.id,
      timeout: TIMEOUT.toString(),
      unreadOnly: 'true'
    });
    
    const email = await makeRequest('GET', `/waitForLatestEmail?${params}`);
    console.log(`✅ Received email: ${email.subject}`);

    // Step 4: Extract OTP
    console.log('\n🔍 Step 4: Extracting OTP code...');
    const otpCode = extractOTP(email.body);
    
    if (!otpCode) {
      throw new Error('Failed to extract OTP code');
    }
    
    console.log(`✅ Extracted OTP code: ${otpCode}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Email Address: ${inbox.emailAddress}`);
    console.log(`Inbox ID: ${inbox.id}`);
    console.log(`Email Subject: ${email.subject}`);
    console.log(`OTP Code: ${otpCode}`);
    console.log(`Expected: 123456`);
    console.log(`Match: ${otpCode === '123456' ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(60));

    if (otpCode === '123456') {
      console.log('\n🎉 TEST PASSED: API flow working correctly!');
      return { success: true, emailAddress: inbox.emailAddress, inboxId: inbox.id, otpCode };
    } else {
      console.log('\n❌ TEST FAILED: OTP mismatch');
      return { success: false, error: 'OTP mismatch' };
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

runTest()
  .then(result => {
    console.log('\nFinal result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
