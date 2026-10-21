# frozen_string_literal: true

# <gen>inbox_docs_setup
require 'mailslurp_client'
require 'date'
require 'net/imap'
require 'openssl'

def create_client
  api_key = ENV.fetch('MAILSLURP_API_KEY')
  raise ArgumentError, 'Set MAILSLURP_API_KEY' if api_key.strip.empty?

  config = MailSlurpClient::Configuration.new
  config.api_key['x-api-key'] = api_key
  config.timeout = 75
  MailSlurpClient::ApiClient.new(config)
end
# </gen>

# <gen>inbox_docs_create_random
def create_random(client)
  options = MailSlurpClient::CreateInboxDto.new(
    name: 'Signup tests', tags: ['signup', 'staging']
  )
  MailSlurpClient::InboxControllerApi.new(client)
    .create_inbox_with_options(options)
end
# </gen>

# <gen>inbox_docs_create_pool
def create_pool(client)
  available = MailSlurpClient::DomainControllerApi.new(client)
    .get_available_domains
  pool_domains = available.domain_groups
    .select { |group| group.label == 'DOMAIN_POOL' }
    .flat_map(&:domains)
  options = MailSlurpClient::CreateInboxDto.new(use_domain_pool: true)
  inbox = MailSlurpClient::InboxControllerApi.new(client)
    .create_inbox_with_options(options)
  { pool_domains: pool_domains, inbox: inbox }
end
# </gen>

# <gen>inbox_docs_create_custom
def create_custom(client, verified_address)
  options = MailSlurpClient::CreateInboxDto.new(
    email_address: verified_address,
    name: 'Custom domain signup'
  )
  MailSlurpClient::InboxControllerApi.new(client)
    .create_inbox_with_options(options)
end
# </gen>

# <gen>inbox_docs_create_virtual
def create_virtual(client)
  options = MailSlurpClient::CreateInboxDto.new(
    name: 'Application mail capture', virtual_inbox: true
  )
  MailSlurpClient::InboxControllerApi.new(client)
    .create_inbox_with_options(options)
end
# </gen>

# <gen>inbox_docs_create_expiring
def create_expiring(client)
  options = MailSlurpClient::CreateInboxDto.new(
    name: 'One test run', expires_in: 5 * 60_000
  )
  MailSlurpClient::InboxControllerApi.new(client)
    .create_inbox_with_options(options)
end
# </gen>

# <gen>inbox_docs_catch_all
def catch_all(client, domain_id)
  domains = MailSlurpClient::DomainControllerApi.new(client)
  domains.add_domain_wildcard_catch_all(domain_id)
  domains.get_domain_wildcard_catch_all_inbox(domain_id)
end
# </gen>

# <gen>inbox_docs_plus_address
def plus_address(client, inbox, label)
  local_part, domain = inbox.email_address.split('@', 2)
  full_address = "#{local_part}+#{label}@#{domain}"
  inboxes = MailSlurpClient::InboxControllerApi.new(client)
  plus = inboxes.get_or_create_inbox_plus_address(inbox.id, full_address)
  emails = inboxes.get_inbox_plus_address_emails_for_plus_address_id(
    plus.id, inbox.id, page: 0, size: 20
  )
  { plus: plus, emails: emails }
end
# </gen>

# <gen>inbox_docs_send
def send_message(client, inbox_id, recipient)
  options = MailSlurpClient::SendEmailOptions.new(
    to: [recipient], subject: 'Welcome',
    body: '<p>Your account is ready.</p>', is_html: true
  )
  MailSlurpClient::InboxControllerApi.new(client)
    .send_email_and_confirm(inbox_id, options)
end
# </gen>

# <gen>inbox_docs_list_inboxes
def list_inboxes(client, tag = 'signup', page = 0)
  MailSlurpClient::InboxControllerApi.new(client)
    .get_all_inboxes(tag: tag, page: page, size: 20, sort: 'DESC')
end
# </gen>

# <gen>inbox_docs_list_emails
def list_emails(client, inbox_id, page = 0)
  MailSlurpClient::InboxControllerApi.new(client)
    .get_inbox_emails_paginated(inbox_id, page: page, size: 20, sort: 'DESC')
end
# </gen>

# <gen>inbox_docs_get_inbox
def get_inbox(client, inbox_id)
  MailSlurpClient::InboxControllerApi.new(client).get_inbox(inbox_id)
end
# </gen>

# <gen>inbox_docs_get_email
def get_email(client, email_id)
  MailSlurpClient::EmailControllerApi.new(client).get_email(email_id)
end
# </gen>

# <gen>inbox_docs_delete_inbox
def delete_inbox(client, inbox_id)
  MailSlurpClient::InboxControllerApi.new(client).delete_inbox(inbox_id)
end
# </gen>

# <gen>inbox_docs_webhook
def create_webhook(client, inbox_id, receiver_url)
  options = MailSlurpClient::CreateWebhookOptions.new(
    url: receiver_url, event_name: 'EMAIL_RECEIVED'
  )
  MailSlurpClient::WebhookControllerApi.new(client)
    .create_webhook(inbox_id, options)
end
# </gen>

# <gen>inbox_docs_access
def access(client, inbox_id)
  MailSlurpClient::InboxControllerApi.new(client)
    .get_imap_smtp_access(inbox_id: inbox_id)
end
# </gen>

# <gen>inbox_docs_wait_latest
def wait_latest(client, inbox_id, since)
  # Capture since = DateTime.now before triggering the application's send.
  MailSlurpClient::WaitForControllerApi.new(client).wait_for_latest_email(
    inbox_id: inbox_id, since: since, timeout: 60_000, unread_only: true
  )
end
# </gen>

# <gen>inbox_docs_wait_matching
def wait_matching(client, inbox_id, since, subject_fragment, recipient)
  matches = MailSlurpClient::MatchOptions.new(matches: [
    MailSlurpClient::MatchOption.new(
      field: 'SUBJECT', should: 'CONTAIN', value: subject_fragment
    ),
    MailSlurpClient::MatchOption.new(
      field: 'TO', should: 'CONTAIN', value: recipient
    )
  ])
  MailSlurpClient::WaitForControllerApi.new(client)
    .wait_for_matching_first_email(
      inbox_id, matches, since: since, timeout: 60_000, unread_only: true
    )
end
# </gen>

# <gen>inbox_docs_imap_tls
def imap_tls(client, inbox_id)
  details = MailSlurpClient::InboxControllerApi.new(client)
    .get_imap_smtp_access(inbox_id: inbox_id)
  imap = Net::IMAP.new(
    details.secure_imap_server_host,
    port: details.secure_imap_server_port,
    ssl: {
      verify_mode: OpenSSL::SSL::VERIFY_PEER,
      verify_hostname: true,
      min_version: OpenSSL::SSL::TLS1_2_VERSION
    },
    open_timeout: 30
  )
  begin
    imap.login(details.secure_imap_username, details.secure_imap_password)
    imap.examine(details.imap_mailbox)
    unread_uids = imap.uid_search(['UNSEEN'])
    imap.logout
    unread_uids
  ensure
    imap.disconnect unless imap.disconnected?
  end
end
# </gen>
