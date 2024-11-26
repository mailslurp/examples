# Playwright low-code example
Test user sign-up and email verification flow using the low-code MailSlurp [test interface](https://test.mailslurp.com).

## Setup

Set the `API_KEY` environment variable to your [MailSlurp API KEY](https://app.mailslurp.com) value.

### Setting the `API_KEY` Environment Variable

#### Visual Studio Code
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Search for `Preferences: Open Settings (UI)`.
3. In the search bar, type `env`.
4. Click on `Edit in settings.json`.
5. Add the following line to your `settings.json` file:
    ```json
    "terminal.integrated.env.osx": {
        "API_KEY": "your-mailslurp-api-key"
    },
    "terminal.integrated.env.linux": {
        "API_KEY": "your-mailslurp-api-key"
    },
    "terminal.integrated.env.windows": {
        "API_KEY": "your-mailslurp-api-key"
    }
    ```

#### Terminal
- **Mac/Linux:**
    ```sh
    export API_KEY=your-mailslurp-api-key
    ```
- **Windows (Command Prompt):**
    ```cmd
    set API_KEY=your-mailslurp-api-key
    ```
- **Windows (PowerShell):**
    ```powershell
    $env:API_KEY="your-mailslurp-api-key"
    ```

#### Playwright Configuration
Add the following to your `playwright.config.ts` or `playwright.config.js`:
```javascript
// playwright.config.ts or playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    env: {
      API_KEY: process.env.API_KEY || 'your-mailslurp-api-key',
    },
  },
});
```