package dev.mailslurp

import io.gatling.core.Predef.{Simulation, atOnceUsers, configuration, global, scenario}
import io.gatling.core.Predef._
import io.gatling.http.Predef._

class EmailLoadTest extends Simulation {
  val httpProtocol = http
    .baseUrl("https://api.mailslurp.com")
    .acceptHeader("application/json")

  val scn = scenario("One‐time Health Check")
    .exec(
      http("GET /health")
        .get("/health")
        .check(status.in(200 to 299))
    )

  setUp(
    // run 1 virtual user once
    scn.inject(atOnceUsers(1))
  ).protocols(httpProtocol)
}