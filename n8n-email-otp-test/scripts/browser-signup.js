#!/usr/bin/env node

/**
 * Browser Signup Script
 * 
 * Opens playground.mailslurp.com and fills out the signup form
 * with the provided email address.
 * 
 * Usage: node browser-signup.js <email-address>
 */

const puppeteer = require('puppeteer');

const PLAYGROUND_URL = 'https://playground.mailslurp.com';
const TEST_PASSWORD = 'test-password';
const TIMEOUT = 60000;

async function browserSignup(emailAddress) {
  console.log('Starting browser signup...');
  console.log(`Email: ${emailAddress}`);
  
  let browser;
  let page;
  
  try {
    console.log('Launching browser...');
    
    // Use Puppeteer bundled Chrome or system Chrome
    const os = require('os');
    const path = require('path');
    let executablePath;
    
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
      // Try Puppeteer cache first
      const homeDir = os.homedir();
      executablePath = path.join(
        homeDir,
        '.cache/puppeteer/chrome/mac_arm-121.0.6167.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
      );
    }
    
    console.log(`Using Chrome at: ${executablePath}`);
    
    browser = await puppeteer.launch({
      executablePath,
      headless: process.env.HEADLESS === 'false' ? false : 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ],
      dumpio: false,
      protocolTimeout: TIMEOUT
    });

    console.log('Creating new page...');
    page = await browser.newPage();
    await page.setDefaultTimeout(TIMEOUT);
    await page.setDefaultNavigationTimeout(TIMEOUT);

    // Navigate to playground
    console.log(`Navigating to ${PLAYGROUND_URL}...`);
    await page.goto(PLAYGROUND_URL, { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForSelector('[data-test=sign-in-create-account-link]', { visible: true });

    // Click "Create Account" link
    console.log('Clicking create account link...');
    await page.click('[data-test=sign-in-create-account-link]');

    // Wait for signup form
    await page.waitForSelector('input[name="email"]', { visible: true });

    // Fill signup form
    console.log('Filling signup form...');
    await page.type('input[name="email"]', emailAddress);
    await page.type('input[name="password"]', TEST_PASSWORD);

    // Submit form
    console.log('Submitting signup form...');
    await page.click('[data-test=sign-up-create-account-button]');

    // Wait a moment for submission
    await page.waitForTimeout(2000);

    console.log('✅ Signup form submitted successfully');
    
    // Keep browser open and return it for verification step
    return {
      success: true,
      emailAddress,
      password: TEST_PASSWORD,
      browser: browser,
      page: page
    };

  } catch (error) {
    console.error('❌ Error during signup:', error.message);
    console.error('Error stack:', error.stack);
    // Close browser on error
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e.message);
      }
    }
    throw error;
  }
  // Don't close browser in finally - need to keep it open for verification
}

// Run if called directly
if (require.main === module) {
  const emailAddress = process.argv[2];

  if (!emailAddress) {
    console.error('Usage: node browser-signup.js <email-address>');
    process.exit(1);
  }

  browserSignup(emailAddress)
    .then(result => {
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = browserSignup;
