exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    MailSlurp: {
      apiKey: process.env.API_KEY,
      require: '@codeceptjs/mailslurp-helper'
    }
  },
  bootstrap: null,
  mocha: {},
  name: 'codeceptjs'
};
