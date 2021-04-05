require 'mailslurp_client'

# configure the mailslurp client with an API Key
MailSlurpClient.configure do |config|
	api_key = ENV['API_KEY']
	if api_key == "" or api_key == nil then
		raise "No API_KEY environment variable set for MailSlurp API KEY"
	end
  config.api_key['x-api-key'] = api_key
end

inbox = nil

Given /a user has an email address and loads the app/ do
	# create a test email account for the user
  inbox_controller = MailSlurpClient::InboxControllerApi.new
  inbox = inbox_controller.create_inbox 
	
	# load the playground application
	visit '/'
  expect(page).to have_title 'React App'
end

When /user signs up with email address and password/ do
	# click the sign up link
	find('[data-test="sign-in-create-account-link"]').click

	# fill out the form
	within('[data-test="sign-up-body-section"]') do
		fill_in 'email', with: inbox.email_address
		fill_in 'password', with: 'test-password'
	end

	# click submit and wait for confirm page to load
	find('[data-test="sign-up-create-account-button"]').click
	find('[data-test="confirm-sign-up-body-section"]').visible?
end

Then /they receive a confirmation code and can confirm their account/ do
	# wait for first unread email to arrive in user's inbox
  wait_controller = MailSlurpClient::WaitForControllerApi.new
  email = wait_controller.wait_for_latest_email({ inbox_id: inbox.id, unread_only: true, timeout: 30_000 })

	# assert the email is a confirmation 
	expect(email.subject).to include("Please confirm your email address")

	# extract a 6 digit code from the email body
	match = email.body.match(/code is ([0-9]{6})/)
	if match == nil then
		raise "Could not find match in body #{email.body}" 
	end 
	code, * = match.captures

	expect(code).to be_truthy	

	# submit confirmation code
	within('[data-test="confirm-sign-up-body-section"]') do
		fill_in 'code', with: code
	end
	find('[data-test="confirm-sign-up-confirm-button"]').click

	# load the main page again
	visit '/'	

	# login and see a welcome
	fill_in 'username', with: inbox.email_address
	fill_in 'password', with: "test-password"
	find('[data-test="sign-in-sign-in-button"]').click

	# wait for welcome to load
	expect(find('h1', wait: 30).text).to include("Welcome")
end
