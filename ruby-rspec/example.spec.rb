RSpec.describe 'client' do

  require 'mailslurp_client'

  # configure the mailslurp client with an API Key
  MailSlurpClient.configure do |config|
    config.api_key['x-api-key'] = ENV['API_KEY']
  end

  it 'can create email addresses' do
    inbox_controller = MailSlurpClient::InboxControllerApi.new
    inbox = inbox_controller.create_inbox

    expect(inbox.id).not_to be_nil
    expect(inbox.email_address).to include("mailslurp.com")
  end

  it 'can send and receive emails' do
    # create two inboxes
    inbox_controller = MailSlurpClient::InboxControllerApi.new
    inbox_1 = inbox_controller.create_inbox
    inbox_2 = inbox_controller.create_inbox

    # send an email from inbox 1 to inbox 2 (sends a real email)
    inbox_controller.send_email(inbox_1.id, {
        send_email_options: {
            to: [inbox_2.email_address],
            subject: "Test",
            body: "Hello",
        }
    })

    # get emails from inbox2
    waitfor_controller = MailSlurpClient::WaitForControllerApi.new
    email = waitfor_controller.wait_for_latest_email({
         inbox_id: inbox_2.id,
         unread_only: true
     })

    # verify email contents
    expect(email.subject).to include("Test")
    expect(email.body).to include("Hello")
  end
end
