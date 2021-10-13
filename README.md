# MailSlurp Examples 📨

> Create email addresses on demand then send and receive emails in code and tests. Test apps end-to-end with *real* email addresses

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks. See the `README.md` or `Makefile` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/). If you notice an issue in the examples please open an issue, pull request, or [contact support](https://www.mailslurp.com/support/).

### Featured projects

| Project | Test status |
| --- | --- | 
| [Cypress JS Email Test](./javascript-cypress-js) | ![javascript-cypress-js](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-js.yml/badge.svg?branch=master) |         
| [Cypress Mailslurp Plugin Email Test](./javascript-cypress-mailslurp-plugin) | ![javascript-cypress-mailslurp](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-mailslurp.yml/badge.svg?branch=master) |         
| [Jest Puppeteer Email Test](./javascript-jest-puppeteer) | ![javascript-jest-puppeteer](https://github.com/mailslurp/examples/actions/workflows/javascript-jest-puppeteer.yml/badge.svg?branch=master) |         
| [Testcafe Email Test](./javascript-testcafe) | ![javascript-testcafe](https://github.com/mailslurp/examples/actions/workflows/javascript-testcafe.yml/badge.svg?branch=master) |         
| [Webdriver WDIO Email Test](./javascript-webdriver-io) | ![javascript-webdriver-io](https://github.com/mailslurp/examples/actions/workflows/javascript-webdriver-io.yml/badge.svg?branch=master) |         

## Example projects

### Golang

| Project | Test status |
| --- | --- | 
| [Golang Email Test](./golang-email-test) | ![golang-email-test](https://github.com/mailslurp/examples/actions/workflows/golang-email-test.yml/badge.svg?branch=master) |


### C\# (DotNet)

| Project | Test status |
| --- | --- | 
| [.NET 2.1 Selenium](./csharp-dotnet-core2-selenium) | ![csharp-dotnet-core2-selenium](https://github.com/mailslurp/examples/actions/workflows/csharp-dotnet-core2-selenium.yml/badge.svg?branch=master) |
| [.NET Core 3](./csharp-dotnet-core3) | ![csharp-dotnet-core3](https://github.com/mailslurp/examples/actions/workflows/csharp-dotnet-core3.yml/badge.svg?branch=master) |
| [.NET Core 5 Specflow Selenium](./csharp-specflow-mstest-selenium) | ![csharp-specflow-mstest-selenium](https://github.com/mailslurp/examples/actions/workflows/csharp-specflow-mstest-selenium.yml/badge.svg?branch=master) |

### Javascript / Typescript

| Project | Test status |
| --- | --- | 
| [Axios Email Test](./javascript-axios) | ![javascript-axios](https://github.com/mailslurp/examples/actions/workflows/javascript-axios.yml/badge.svg?branch=master) |         
| [Codecept JS Email Test](./javascript-codecept-js) | ![javascript-codecept-js](https://github.com/mailslurp/examples/actions/workflows/javascript-codecept-js.yml/badge.svg?branch=master) |         
| [Cypress JS Email Test](./javascript-cypress-js) | ![javascript-cypress-js](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-js.yml/badge.svg?branch=master) |         
| [Cypress Mailslurp Plugin Email Test](./javascript-cypress-mailslurp-plugin) | ![javascript-cypress-mailslurp](https://github.com/mailslurp/examples/actions/workflows/javascript-cypress-mailslurp.yml/badge.svg?branch=master) |         
| [Jest Puppeteer Email Test](./javascript-jest-puppeteer) | ![javascript-jest-puppeteer](https://github.com/mailslurp/examples/actions/workflows/javascript-jest-puppeteer.yml/badge.svg?branch=master) |         
| [Testcafe Email Test](./javascript-testcafe) | ![javascript-testcafe](https://github.com/mailslurp/examples/actions/workflows/javascript-testcafe.yml/badge.svg?branch=master) |         
| [Webdriver WDIO Email Test](./javascript-webdriver-io) | ![javascript-webdriver-io](https://github.com/mailslurp/examples/actions/workflows/javascript-webdriver-io.yml/badge.svg?branch=master) | 

### PHP 

| Project | Test status |
| --- | --- | 
| [PHP Composer PHPUnit](./php-composer-phpunit) | ![php-composer-phpunit](https://github.com/mailslurp/examples/actions/workflows/php-composer-phpunit.yml/badge.svg?branch=master) |         

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## CI
Examples are tested with each major release and on a schedule using Github actions and CircleCI.
