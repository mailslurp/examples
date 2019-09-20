Feature: Can I Send and Receive Email?
  Send and receive real emails in Cucumber using MailSlurp

  Scenario: Generate test email accounts
    Given a new email address
    When I ask for email address
    Then it should contain "@mailslurp.com"

  Scenario: Send a test email and receive it in code
    Given a new email address
    When I create new email
    When I set subject to "Hello"
    When I set body to "World"
    When I send email to created address
    Then I can receive email
    Then I can see "Hello" in subject
    Then I can see "World" in body
