#!/usr/bin/env node

/**
 * Browser Verify Script
 * 
 * Enters OTP code, logs in, and verifies the welcome message.
 * 
 * Usage: node browser-verify.js <otp-code> <email-address>
 */

const puppeteer = require('puppeteer');

const PLAYGROUND_URL = 'https://playground.mailslurp.com';
const TEST_PASSWORD = 'test-password';
const TIMEOUT = 60000;

async function browserVerify(otpCode, emailAddress, existingBrowser, existingPage) {
  console.log('Starting browser verification...');
  console.log(`OTP Code: ${otpCode}`);
  console.log(`Email: ${emailAddress}`);

  let browser = existingBrowser;
  let page = existingPage;
  let newBrowser = false;

  try {
    // Use existing browser if provided, otherwise launch new one
    if (!browser || !page) {
      console.log('No existing browser, launching new one...');
      newBrowser = true;
      
      const os = require('os');
      const path = require('path');
      let executablePath;
      
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      } else {
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

      console.log(`Navigating to ${PLAYGROUND_URL}...`);
      await page.goto(PLAYGROUND_URL, { waitUntil: 'networkidle2' });
    } else {
      console.log('Using existing browser session...');
    }

    // Wait for verification code input
    console.log('Waiting for verification code input...');
    await page.waitForSelector('input[name="code"]', { visible: true });

    // Enter OTP code
    console.log(`Entering OTP code: ${otpCode}...`);
    await page.type('input[name="code"]', otpCode);

    // Click confirm button
    console.log('Clicking confirm button...');
    await page.click('[data-test=confirm-sign-up-confirm-button]');

    // Wait for redirect/navigation
    await page.waitForTimeout(2000);

    // Navigate back to login page
    console.log('Navigating to login...');
    await page.goto(PLAYGROUND_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Check if we're on login page
    const usernameExists = await page.$('input[name="username"]');
    
    if (usernameExists) {
      // Fill login form
      console.log('Filling login form...');
      await page.type('input[name="username"]', emailAddress);
      await page.type('input[name="password"]', TEST_PASSWORD);

      // Submit login and wait for navigation
      console.log('Submitting login...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }),
        page.click('[data-test=sign-in-sign-in-button]')
      ]).catch(() => {
        console.log('Navigation timeout or no navigation occurred');
      });

      // Additional wait for React to render
      await page.waitForTimeout(5000);
    }

    // Check for welcome message
    console.log('Checking for welcome message...');
    
    // Try to find h1 with "Welcome"
    const welcomeH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });

    // Fallback: check body text
    const bodyText = await page.evaluate(() => document.body.textContent);
    const hasWelcome = (welcomeH1 && welcomeH1.includes('Welcome')) || 
                       bodyText.includes('Welcome');

    if (hasWelcome) {
      console.log('✅ Welcome message found! Verification successful.');
      return {
        success: true,
        verified: true,
        emailAddress,
        otpCode,
        welcomeMessage: welcomeH1 || 'Found in body'
      };
    } else {
      console.log('⚠️  Welcome message not found');
      console.log('H1 text:', welcomeH1);
      console.log('Body excerpt:', bodyText.substring(0, 200));
      return {
        success: false,
        verified: false,
        error: 'Welcome message not found',
        h1Text: welcomeH1,
        bodyExcerpt: bodyText.substring(0, 200)
      };
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    // Always close browser after verification (whether new or existing)
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
  }
}

// Run if called directly
if (require.main === module) {
  const otpCode = process.argv[2];
  const emailAddress = process.argv[3];

  if (!otpCode || !emailAddress) {
    console.error('Usage: node browser-verify.js <otp-code> <email-address>');
    process.exit(1);
  }

  browserVerify(otpCode, emailAddress)
    .then(result => {
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = browserVerify;
