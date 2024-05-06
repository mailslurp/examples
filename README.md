# MailSlurp Examples 📨

> Create email addresses on demand then send and receive emails in code and tests. Test apps end-to-end with *real* email addresses

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks. See the `README.md` or `Makefile` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/). If you notice an issue in the examples please open an issue, pull request, or [contact support](https://www.mailslurp.com/support/).

## Projects

- [bun-js-send-email](./bun-js-send-email)
- [csharp-dotnet-core-8-smtpclient](./csharp-dotnet-core-8-smtpclient)
- [csharp-dotnet-core2-selenium](./csharp-dotnet-core2-selenium)
- [csharp-dotnet-core3](./csharp-dotnet-core3)
- [csharp-dotnet-core7-nunit](./csharp-dotnet-core7-nunit)
- [csharp-smtp-client-xunit](./csharp-smtp-client-xunit)
- [csharp-specflow-mstest-selenium](./csharp-specflow-mstest-selenium)
- [curl-imap-smtp](./curl-imap-smtp)
- [dart-email-testing](./dart-email-testing)
- [deno-email-api](./deno-email-api)
- [elixir-phoenix-hound](./elixir-phoenix-hound)
- [firebase-examples](./firebase-examples)
- [flutter-email-test](./flutter-email-test)
- [fsharp-email-mstest](./fsharp-email-mstest)
- [golang-email-test](./golang-email-test)
- [golang-imap-examples](./golang-imap-examples)
- [golang-smtp-client-test](./golang-smtp-client-test)
- [imap-smtp-examples](./imap-smtp-examples)
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
- [javascript-cypress-js-open-email](./javascript-cypress-js-open-email)
- [javascript-cypress-mailslurp-plugin](./javascript-cypress-mailslurp-plugin)
- [javascript-cypress-newsletter-signup](./javascript-cypress-newsletter-signup)
- [javascript-cypress-sms-testing](./javascript-cypress-sms-testing)
- [javascript-email-screenshot](./javascript-email-screenshot)
- [javascript-jest-puppeteer](./javascript-jest-puppeteer)
- [javascript-react-email](./javascript-react-email)
- [javascript-testcafe](./javascript-testcafe)
- [javascript-webdriver-io](./javascript-webdriver-io)
- [kotlin-email-test-example](./kotlin-email-test-example)
- [next-auth-example](./next-auth-example)
- [nim-unittests](./nim-unittests)
- [nodejs-nodemailer-smtp-example](./nodejs-nodemailer-smtp-example)
- [nodejs-smtp-email-attachments-test](./nodejs-smtp-email-attachments-test)
- [php-codeception-acceptance](./php-codeception-acceptance)
- [php-composer-phpunit](./php-composer-phpunit)
- [php-laravel-phpunit](./php-laravel-phpunit)
- [playwright-email-testing](./playwright-email-testing)
- [playwright-sms-testing](./playwright-sms-testing)
- [powershell-email-send-ps1](./powershell-email-send-ps1)
- [powershell-imap-smtp](./powershell-imap-smtp)
- [powershell-windows-cmd](./powershell-windows-cmd)
- [python2-pytest](./python2-pytest)
- [python3-django-playwright](./python3-django-playwright)
- [python3-pyunit](./python3-pyunit)
- [python3-robotframework](./python3-robotframework)
- [rlang-email-sending-in-r](./rlang-email-sending-in-r)
- [ruby-capybara-cucumber-selenium](./ruby-capybara-cucumber-selenium)
- [ruby-cucumber-test](./ruby-cucumber-test)
- [ruby-minitest-netsmtp-example](./ruby-minitest-netsmtp-example)
- [ruby-rspec](./ruby-rspec)
- [rust-selenium-email-testing](./rust-selenium-email-testing)
- [scala-scalatest-email](./scala-scalatest-email)
- [sendgrid](./sendgrid)
- [shortcodes](./shortcodes)
- [swift-email-smtp-examples](./swift-email-smtp-examples)
- [telnet-imap-sh](./telnet-imap-sh)
- [visualbasic](./visualbasic)
- [wait-for-methods-vitest](./wait-for-methods-vitest)

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## Static site
Examples are hosted statically on [mailtesting.net](https://www.mailtesting.net/). The site is built using Jeykll and hosted on GitHub pages. To update the site run `make` in the root directory. This will build the site. Commit the site and push to GitHub to update the live site.