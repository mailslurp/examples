package dev.mailslurp

import io.gatling.core.Predef._
import io.gatling.http.Predef._

object Static {
  val SIGNUP_URL = "https://api.mailslurp.com/test-application/magic-link"
  val SERVER_HOST = "https://api.mailslurp.com"
  val TIMEOUT_MILLIS = 120_000
}

val MAILSLURP_API_KEY = sys.env.getOrElse("API_KEY", "your-api-key-here")

class EmailLoadTest extends Simulation {

  //<gen>scala_gatling_test
  val scn = scenario("User signup + email received")
    // 1. Create inbox via MailSlurp HTTP API
    .exec(
      http("Create inbox")
        .post("/inboxes")
        .header("x-api-key", MAILSLURP_API_KEY)
        .check(status.is(201))
        .check(jsonPath("$.id").saveAs("inboxId"))
        .check(jsonPath("$.emailAddress").saveAs("emailAddress"))
    )
    // 2. Call signup on our application using the created email address
    .exec(
      http("Sign up with email")
        .post(Static.SIGNUP_URL)
        .formParam("emailAddress", session => session("emailAddress").as[String])
        .check(status.in(200 to 299))
    )
    // 3. Wait for latest email using MailSlurp's wait endpoint
    .exec(
      http("Wait for latest email")
        .get("https://api.mailslurp.com/waitForLatestEmail")
        .queryParam("inboxId", session => session("inboxId").as[String])
        .queryParam("timeout", Static.TIMEOUT_MILLIS)
        .header("x-api-key", MAILSLURP_API_KEY)
        .check(status.is(200))
        .check(jsonPath("$.id").exists)
    )
  //</gen>
  setUp(
    scn.inject(atOnceUsers(1))
  ).protocols(http.baseUrl(Static.SERVER_HOST))
}
