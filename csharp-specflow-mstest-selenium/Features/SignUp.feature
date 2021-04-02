Feature: SignUp
Create a MailSlurp email address and sign up for a demo application. Receive a confirmation code by email and verify the account. Login to the web app and see a happy dog.

@signup
Scenario: User sign up and email verification
	Given a user visits the demo app
	And has a test email address
	When the user signs up
	Then they receive a confirmation code by email and can verify their account