const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 30000,
  requestTimeout: 30000,
  viewportHeight: 800,
  viewportWidth: 800,
  videoCompression: false,
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'https://playground.mailslurp.com',
    env: {
      API_KEY: process.env.API_KEY
    }
  },
})
