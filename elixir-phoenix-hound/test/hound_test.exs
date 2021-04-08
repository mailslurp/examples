defmodule HoundTest do
  use ExUnit.Case
  use Hound.Helpers
  use Tesla

  hound_session()

  test "User sign up", _ do
    # create a tesla client for controllers and set api key header
    middleware = [
      {Tesla.Middleware.Headers, [{"x-api-key", System.get_env("API_KEY")}]}
    ]
    connection = Tesla.client(middleware)

    # create test email address
    { :ok, inbox } = MailSlurpAPI.Api.InboxController.create_inbox_with_options(connection, %{})
    assert inbox.emailAddress =~ "@mailslurp."
#
#    # load test application
#    navigate_to("https://playground.mailslurp.com")
#    assert page_title() == "React App"
  end

end
