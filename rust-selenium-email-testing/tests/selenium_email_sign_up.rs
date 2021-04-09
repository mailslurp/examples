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

    #[tokio::test]
    async fn my_test() -> color_eyre::Result<()> {
        // use color-eyre for better result reports
        color_eyre::install()?;

        let client = reqwest::Client::new();
        // read mailslurp api key from environment variable
        let api_key = env::var("API_KEY").ok().unwrap();
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


        // // setup driver (selenium with geckodriver should be running)
        // let caps = DesiredCapabilities::firefox();
        // let driver = WebDriver::new("http://localhost:4444/wd/hub", &caps).await?;
        //
        // // load playground application
        // driver.get("https://playground.mailslurp.com").await?;
        // let elem_form = driver.find_element(By::Id("search-form")).await?;
        //
        // // Find element from element.
        // let elem_text = elem_form.find_element(By::Id("searchInput")).await?;
        //
        // // Type in the search terms.
        // elem_text.send_keys("selenium").await?;
        //
        // // Click the search button.
        // let elem_button = elem_form
        //     .find_element(By::Css("button[type='submit']"))
        //     .await?;
        // elem_button.click().await?;
        //
        // // Look for header to implicitly wait for the page to load.
        // driver.find_element(By::ClassName("firstHeading")).await?;
        // assert_eq!(driver.title().await?, "Selenium - Wikipedia");
        //
        Ok(())
    }
}
