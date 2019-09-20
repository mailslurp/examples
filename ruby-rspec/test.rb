RSpec.describe 'client' do
  it 'can create email address' do
    require 'mailslurp-client'

    MailSlurpClient.configure do |config|
      config.api_key['x-api-key'] = 'test'
    end

    api_instance = MailSlurpClient::CommonOperationsApi.new

    result = api_instance.create_new_email_address_using_post
    expect(result.email_address).to include("mailslurp.com")
  end
end
