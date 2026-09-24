# Cypress MailSlurp plugin example

Sign up to the email playground with a new inbox, receive the verification email, confirm the code, and sign in.

Uses `cypress-mailslurp@2.0.0` and Cypress 16. The plugin requires Cypress 15.10 or newer for its secure `cy.env()` API. Install a supported Node.js version and Google Chrome before running.

## Run tests

Put `API_KEY=your-api-key` in this directory's `.env` or the shared `examples/.env`. The config loads it in Node and makes it available to the plugin without putting the key in the test source. An exported `CYPRESS_MAILSLURP_API_KEY` takes precedence.

```sh
npm ci
npm run typecheck
npm test
```

`make test` runs the same Chrome tests. Use `npm run dev` for the interactive Cypress runner.

The JavaScript example also waits for the verification email. The configuration tests exercise custom headers, API base paths, and `fetchApi` with both environment and explicit API keys; their HTTP responses are mocked.

## Documentation

- [Cypress Plugin source](https://github.com/mailslurp/cypress-mailslurp)
- [Plugin documentation](https://docs.mailslurp.com/cypress-mailslurp)

## Example test

{{{<gen_typescript_cypress_plugin_full>}}}
