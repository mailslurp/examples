#!/usr/bin/env node

/**
 * OTP Extraction Script
 * 
 * Extracts 6-digit OTP code from email body using regex.
 * 
 * Usage: node extract-otp.js "<email-body-text>"
 */

/**
 * Extract OTP code from email body
 * @param {string} emailBody - Email body text
 * @returns {string|null} - 6-digit OTP code or null if not found
 */
function extractOTP(emailBody) {
  if (!emailBody) {
    return null;
  }

  // Try multiple regex patterns
  const patterns = [
    // 6 digits at end of line
    /([0-9]{6})$/m,
    // "code:" followed by 6 digits
    /code:\s*([0-9]{6})/i,
    // "verification code" followed by 6 digits
    /verification\s+code[:\s]+([0-9]{6})/i,
    // Just any 6 consecutive digits
    /([0-9]{6})/
  ];

  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Run if called directly
if (require.main === module) {
  const emailBody = process.argv[2];

  if (!emailBody) {
    console.error('Usage: node extract-otp.js "<email-body-text>"');
    console.error('');
    console.error('Example:');
    console.error('  node extract-otp.js "Your verification code is:\\n\\n123456"');
    process.exit(1);
  }

  const otpCode = extractOTP(emailBody);

  if (otpCode) {
    console.log(`✅ Extracted OTP: ${otpCode}`);
    console.log(JSON.stringify({ success: true, otpCode }, null, 2));
    process.exit(0);
  } else {
    console.error('❌ Could not extract OTP code from email body');
    console.error('Email body:', emailBody.substring(0, 200));
    console.log(JSON.stringify({ success: false, otpCode: null }, null, 2));
    process.exit(1);
  }
}

module.exports = extractOTP;
