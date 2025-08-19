import { defineConfig } from 'cypress'

export default defineConfig({
  requestTimeout: 30000,
  responseTimeout: 30000,
  defaultCommandTimeout: 30000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    env: {
      MAILSLURP_API_KEY: process.env.API_KEY || process.env.MAILSLURP_API_KEY
    }
  },
})
