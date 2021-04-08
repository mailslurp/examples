defmodule Hound.MixProject do
  use Mix.Project

  def project do
    [
      app: :hound,
      version: "0.1.0",
      elixir: "~> 1.7",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:hound, "~> 1.1"}
#      {:mailslurp, "~> 11.6.0"}
    ]
  end
end
