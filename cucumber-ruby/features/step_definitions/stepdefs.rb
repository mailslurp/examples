require 'mailslurp_client'

# Setup mailslurp
MailSlurpClient.configure do |config|
  config.api_key['x-api-key'] = ENV['API_KEY']
end

api_instance = MailSlurpClient::CommonOperationsApi.new
extra_instance = MailSlurpClient::ExtraOperationsApi.new

Given("a new email address") do
  @inbox = api_instance.create_new_email_address
end

When("I ask for email address") do
  @email_address = @inbox.email_address
end

Then("it should contain {string}") do |string|
    expect(@email_address).to include(string)
end

When("I create new email") do
    @email_options = MailSlurpClient::SendEmailOptions.new
end

When("I set subject to {string}") do |string|
    @email_options.subject = string
end

When("I set body to {string}") do |string|
    @email_options.body = string
end

When("I send email to created address") do
  @email_options.to = [@inbox.email_address]
  extra_instance.send_email(@inbox.id, @email_options)
end

Then("I can receive email") do
    opts = {
        'inbox_id': @inbox.id,
        'timeout': 10000
    }
    @received_email = api_instance.wait_for_latest_email(opts)
end

Then("I can see {string} in subject") do |string|
    expect(@received_email.subject).to include(string)
end

Then("I can see {string} in body") do |string|
    expect(@received_email.body).to include(string)
end
