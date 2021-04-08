defmodule HoundTest do
  use ExUnit.Case
  use Hound.Helpers
  use Tesla

  hound_session()

  test "User sign up", _ do
    # create a tesla client for MailSlurp controllers
    middleware = [
      # set x-api-key header with MailSlurp API Key
      {Tesla.Middleware.Headers, [{"x-api-key", System.get_env("API_KEY")}]},
      {Tesla.Middleware.BaseUrl, "https://api.mailslurp.com"},
      {Tesla.Middleware.EncodeJson, engine: Poison}
    ]

    # use hackney adapter instead of httpc
    adapter = {Tesla.Adapter.Hackney, [recv_timeout: 30_000]}
    # create a connection
    connection = Tesla.client(middleware, adapter)

    # create test email address
    {:ok, inbox} = MailSlurpAPI.Api.InboxController.create_inbox(connection)
    assert inbox.emailAddress =~ "@mailslurp."

    # load test application
    navigate_to("https://playground.mailslurp.com")
    assert page_title() == "React App"

    # click sign up button
    click({:css, "[data-test=sign-in-create-account-link]"})

    # fill sign up form
    fill_field({:name, "email"}, inbox.emailAddress)
    fill_field({:name, "password"}, "test-password")
    click({:css, "[data-test=sign-up-create-account-button]"})

    # now wait for confirmation email to arrive
    {:ok, email} =
      MailSlurpAPI.Api.WaitForController.wait_for_latest_email(connection, [
        :inboxId = inbox.id,
        :timeout = 30_000,
        :unreadOnly = true
      ])
  end
end
