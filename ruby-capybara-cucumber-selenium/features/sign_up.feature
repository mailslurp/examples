@selenium
Feature: User authentication with verification

Testing an application with real email addresses

  Scenario: Sign up and confirm account
    Given a user has an email address and loads the app
    When user signs up with email address and password
    Then they receive a confirmation code and can confirm their account

