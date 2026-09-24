import { defineConfig } from 'cypress'
import { config } from 'dotenv'

// Load a local .env first, then the shared examples/.env without exposing the key.
config({ path: ['.env', '../.env'], quiet: true })

export default defineConfig({
  requestTimeout: 30000,
  responseTimeout: 30000,
  defaultCommandTimeout: 30000,
  env: {
    MAILSLURP_API_KEY: process.env.MAILSLURP_API_KEY || process.env.API_KEY,
  },
  e2e: {
    baseUrl: 'https://playground.mailslurp.com',
  },
})
