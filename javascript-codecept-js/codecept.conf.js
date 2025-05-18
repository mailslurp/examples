exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    MailSlurp: {
      apiKey: process.env.API_KEY,
      require: '@codeceptjs/mailslurp-helper'
    },
    Playwright: {
      url: "https://playground.mailslurp.com",
      show: process.env.HEADED,
      browser: 'chromium'
    }
  },
  bootstrap: null,
  mocha: {},
  name: 'codeceptjs'
};
