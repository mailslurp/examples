# MailSlurp Examples 📨

> Create email addresses on demand then send and receive emails in code and tests. Test apps end-to-end with *real* email addresses

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks. See the `README.md` or `Makefile` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/). If you notice an issue in the examples please open an issue, pull request, or [contact support](https://www.mailslurp.com/support/).

## Projects

- [csharp-dotnet-core2-selenium](./csharp-dotnet-core2-selenium)
- [csharp-dotnet-core3](./csharp-dotnet-core3)
- [csharp-smtp-client-xunit](./csharp-smtp-client-xunit)
- [csharp-specflow-mstest-selenium](./csharp-specflow-mstest-selenium)
- [dart-email-testing](./dart-email-testing)
- [deno-email-api](./deno-email-api)
- [elixir-phoenix-hound](./elixir-phoenix-hound)
- [fsharp-email-mstest](./fsharp-email-mstest)
- [golang-email-test](./golang-email-test)
- [golang-smtp-client-test](./golang-smtp-client-test)
- [java-gradle-junit5](./java-gradle-junit5)
- [java-jakarta-mail](./java-jakarta-mail)
- [java-maven-junit4](./java-maven-junit4)
- [java-maven-selenium](./java-maven-selenium)
- [java-serenity-jbehave](./java-serenity-jbehave)
- [java-spring-boot](./java-spring-boot)
- [java-testng-selenium](./java-testng-selenium)
- [javascript-axios](./javascript-axios)
- [javascript-codecept-js](./javascript-codecept-js)
- [javascript-cypress-js](./javascript-cypress-js)
- [javascript-cypress-mailslurp-plugin](./javascript-cypress-mailslurp-plugin)
- [javascript-cypress-sms-testing](./javascript-cypress-sms-testing)
- [javascript-jest-puppeteer](./javascript-jest-puppeteer)
- [javascript-testcafe](./javascript-testcafe)
- [javascript-webdriver-io](./javascript-webdriver-io)
- [kotlin-email-test-example](./kotlin-email-test-example)
- [nim-unittests](./nim-unittests)
- [nodejs-nodemailer-smtp-example](./nodejs-nodemailer-smtp-example)
- [nodejs-smtp-email-attachments-test](./nodejs-smtp-email-attachments-test)
- [php-codeception-acceptance](./php-codeception-acceptance)
- [php-composer-phpunit](./php-composer-phpunit)
- [php-laravel-email-examples](./php-laravel-email-examples)
- [playwright-email-testing](./playwright-email-testing)
- [playwright-sms-testing](./playwright-sms-testing)
- [powershell-email-send-ps1](./powershell-email-send-ps1)
- [python2-pytest](./python2-pytest)
- [python3-conda-unittest-example](./python3-conda-unittest-example)
- [python3-robotframework](./python3-robotframework)
- [rlang-email-sending-in-r](./rlang-email-sending-in-r)
- [ruby-capybara-cucumber-selenium](./ruby-capybara-cucumber-selenium)
- [ruby-cucumber-test](./ruby-cucumber-test)
- [ruby-rspec](./ruby-rspec)
- [rust-selenium-email-testing](./rust-selenium-email-testing)
- [scala-scalatest-email](./scala-scalatest-email)
- [sendgrid](./sendgrid)
- [shortcodes](./shortcodes)
- [swift-email-smtp-examples](./swift-email-smtp-examples)
- [visualbasic](./visualbasic)

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## CI
Examples are tested with each major release and on a schedule using Github actions and CircleCI.
