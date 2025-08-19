const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      MAILSLURP_API_KEY: process.env.API_KEY
    }
  },
});
