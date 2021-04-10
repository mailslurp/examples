#[cfg(test)]
mod tests {
    use mailslurp::apis::configuration;
    use mailslurp::apis::inbox_controller_api;
    use std::env;
    use thirtyfour::prelude::*;
    use reqwest;
    use tokio;
    use mailslurp::apis::inbox_controller_api::SendEmailAndConfirmParams;
    use mailslurp::apis::wait_for_controller_api;
    use std::time::Duration;
    use reqwest::Client;
    use thirtyfour::http::reqwest_async::ReqwestDriverAsync;
    use thirtyfour::GenericWebDriver;
    use color_eyre::Report;

    const TIMEOUT: Duration = Duration::from_millis(60_000);

    #[tokio::test]
    async fn run_test() -> color_eyre::Result<()> {
        // use color-eyre for better result reports
        color_eyre::install()?;

        // setup driver (selenium with geckodriver should be running)
        let caps = DesiredCapabilities::firefox();
        let driver: GenericWebDriver<ReqwestDriverAsync> = WebDriver::new_with_timeout(
            "http://localhost:4444/wd/hub",
            &caps,
            Some(TIMEOUT)
        ).await?;


        // allow a long timeout to wait for emails to arrive
        let client: Client = reqwest::ClientBuilder::new()
            .timeout(TIMEOUT)
            .connect_timeout(TIMEOUT)
            .build()?;

        // read mailslurp api key from environment variable
        let api_key: String = env::var("API_KEY")?;

        // configure mailslurp with base path, api key, and reqwest client
        let configuration = configuration::Configuration {
            // required fields
            base_path: "https://api.mailslurp.com".to_owned(),
            api_key: Some(configuration::ApiKey {
                prefix: None,
                key: api_key,
            }),
            client,
            // optional extras
            user_agent: None,
            basic_auth: None,
            oauth_access_token: None,
            bearer_access_token: None,
        };

        // create an inbox
        let create_inbox_params = inbox_controller_api::CreateInboxParams{
            allow_team_access: None,
            description: None,
            email_address: None,
            expires_at: None,
            expires_in: None,
            favourite: None,
            name: None,
            tags: None,
            use_domain_pool: Some(true)
        };
        let inbox = inbox_controller_api::create_inbox(&configuration, create_inbox_params).await.ok().unwrap();
        assert!(inbox.email_address.unwrap().contains("@mailslurp"));

        // load playground application
        driver.get("https://playground.mailslurp.com").await?;
        Ok(())
    }
}
