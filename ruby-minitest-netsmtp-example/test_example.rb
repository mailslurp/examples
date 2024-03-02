require 'minitest/autorun'
#<gen>ruby_minitest_configure
require 'mailslurp_client'

MailSlurpClient.configure do |config|
  config.api_key['x-api-key'] = ENV['API_KEY']
end
#</gen>
class SmtpExample < Minitest::Test
  def test_can_create_inbox_send_and_receive
    #<gen>ruby_minitest_create_controller
    inbox_controller = MailSlurpClient::InboxControllerApi.new
    #</gen>
    #<gen>ruby_minitest_create_inbox
    options = {
      name: "My test inbox",
      inboxType: "SMTP_INBOX"
    }
    inbox = inbox_controller.create_inbox_with_options(options)
    assert_match /@mailslurp/, inbox.email_address
    #</gen>
    #<gen>ruby_minitest_send_email
    inbox_controller.send_email(inbox.id, {
      to: [inbox.email_address],
      subject: "Hello",
      body: "Welcome. Your code is: 123456",
    })
    #</gen>
    #<gen>ruby_minitest_receive_email
    wait_for_controller = MailSlurpClient::WaitForControllerApi.new
    wait_options = {
      inbox_id: inbox.id,
      timeout: 120000,
      unread_only: true
    }
    email = wait_for_controller.wait_for_latest_email(wait_options)
    assert_match /Welcome/, email.body
    #</gen>
    #<gen>ruby_minitest_extract_code
    code = email.body.match(/Your code is: ([0-9]{6})/)[1]
    assert_equal code, '123456'
    #</gen>
    #<gen>ruby_minitest_smtp_send
    require 'net/smtp'
    access_details = inbox_controller.get_imap_smtp_access(inbox_id: inbox.id)
    Net::SMTP.start(
      address= access_details.secure_smtp_server_host,
      port= access_details.secure_smtp_server_port,
      helo= inbox.email_address.match(/@(.+)/)[1],
      user= access_details.secure_smtp_username,
      secret= access_details.secure_smtp_password,
      authtype= :plain
    ) do |smtp|
      message = <<EOF
Subject: SMTP test

This is my body
EOF
      smtp.send_message message, inbox.email_address, inbox.email_address
      smtp.finish
    end
    #</gen>
    smtp_email = wait_for_controller.wait_for_latest_email(inbox_id: inbox.id, timeout: 120_000, unread_only: true)
    assert_match /SMTP test/, smtp_email.subject
    assert_match /This is my body/, smtp_email.body
  end
end