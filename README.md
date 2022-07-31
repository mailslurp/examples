# MailSlurp Examples 📨

> Create email addresses on demand then send and receive emails in code and tests. Test apps end-to-end with *real* email addresses

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks. See the `README.md` or `Makefile` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/). If you notice an issue in the examples please open an issue, pull request, or [contact support](https://www.mailslurp.com/support/).

### Featured projects

| Project |
| --- |
| [Cypress JS Email Test](./javascript-cypress-js) | 
| [Cypress Mailslurp Plugin Email Test](./javascript-cypress-mailslurp-plugin) | 
| [Jest Puppeteer Email Test](./javascript-jest-puppeteer) | 
| [Testcafe Email Test](./javascript-testcafe) | 
| [Webdriver WDIO Email Test](./javascript-webdriver-io) | 

## Example projects

### Golang

|---------|
| Project | 
| --- | 
| [Golang Email Test](./golang-email-test) |


### C\# (DotNet)

|---------|
| Project | 
| --- | 
| [.NET 2.1 Selenium](./csharp-dotnet-core2-selenium) | 
| [.NET Core 3](./csharp-dotnet-core3) | 
| [.NET Core 5 Specflow Selenium](./csharp-specflow-mstest-selenium) | 

### Javascript / Typescript

|---------|
| Project | 
| --- | 
| [Axios Email Test](./javascript-axios) | 
| [Codecept JS Email Test](./javascript-codecept-js) |
| [Cypress JS Email Test](./javascript-cypress-js) | 
| [Cypress Mailslurp Plugin Email Test](./javascript-cypress-mailslurp-plugin) | 
| [Jest Puppeteer Email Test](./javascript-jest-puppeteer) |
| [Testcafe Email Test](./javascript-testcafe) | 
| [Webdriver WDIO Email Test](./javascript-webdriver-io) |

### PHP 

|---------|
| Project | Test status |
| --- | --- | 
| [PHP Composer PHPUnit](./php-composer-phpunit) | ![php-composer-phpunit](https://github.com/mailslurp/examples/actions/workflows/php-composer-phpunit.yml/badge.svg?branch=master) |         

### Python

|---------|
| Project | 
| --- | 
| [Python2 PyTest](./python2-pytest) | 
| [Python3 Robot Framework](./python3-robotframework) | 

### Ruby

|---------|
| Project | 
| --- | 
| [Ruby RSpec email test](./ruby-rspec) |

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## CI
Examples are tested with each major release and on a schedule using Github actions and CircleCI.
