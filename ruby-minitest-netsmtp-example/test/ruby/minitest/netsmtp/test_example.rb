# frozen_string_literal: true

require "test_helper"

class Ruby::Minitest::Netsmtp::TestExample < Minitest::Test
  def test_that_it_has_a_version_number
    refute_nil ::Ruby::Minitest::Netsmtp::Example::VERSION
  end

  def test_it_does_something_useful
    assert false
  end
end
