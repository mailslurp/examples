# MailSlurp Examples

> Create email addresses on demand then send and receive emails in code and tests.

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks.

See the `README.md` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/).

## Javascript

| Project | Test status |
| --- | --- | 
| [Axios Email Test](./javascript-axios) | ![javascript-axios](https://github.com/mailslurp/examples/actions/workflows/javascript-axios.yml/badge.svg?branch=master) |         
| [Cypress JS Email Test](./javascript-cypress-js) | ![javascript-cypress-js](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-js.yml/badge.svg?branch=master) |         
| [Cypress Mailslurp Plugin Email Test](./javascript-cypress-mailslurp) | ![javascript-cypress-mailslurp](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-mailslurp.yml/badge.svg?branch=master) |         
| [Jest Puppeteer Email Test](./javascript-jest-puppeteer) | ![javascript-jest-puppeteer](https://github.com/mailslurp/examples/actions/workflows/javascript-jest-puppeteer.yml/badge.svg?branch=master) |         
| [Testcafe Email Test](./javascript-testcafe) | ![javascript-testcafe](https://github.com/mailslurp/examples/actions/workflows/javascript-testcafe.yml/badge.svg?branch=master) |         
| [Webdriver WDIO Email Test](./javascript-webdriver-io) | ![javascript-webdriver-io](https://github.com/mailslurp/examples/actions/workflows/javascript-webdriver-io.yml/badge.svg?branch=master) |         

<br/>
<hr/>

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## CI
Examples are tested using Github actions and CircleCI.
