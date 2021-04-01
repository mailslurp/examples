Sign Up User
Narrative:
In order to use an authenticated application
As a user with an email address
I want to sign up to an application and verify my acount

Scenario: Sign Up User
Given the user has email address and is on the example application page
When the user signs up with an email address and password 'test-password'
Then they receive a confirmation code, confirm their account, login with 'test-password' and see 'Welcome'