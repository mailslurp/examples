defmodule HoundTest do
  use ExUnit.Case
  use Hound.Helpers

  hound_session()

  test "User sign up", meta do
    navigate_to("https://playground.mailslurp.com")
    assert page_title() == "React App"
  end

end
