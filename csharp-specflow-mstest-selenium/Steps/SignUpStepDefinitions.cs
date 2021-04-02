using System;
using TechTalk.SpecFlow;

namespace SpecflowSeleniumExample.Steps
{
    [Binding]
    public sealed class SignUpStepDefinitions
    {

        // For additional details on SpecFlow step definitions see https://go.specflow.org/doc-stepdef

        private readonly ScenarioContext _scenarioContext;

        public SignUpStepDefinitions(ScenarioContext scenarioContext)
        {
            _scenarioContext = scenarioContext;
        }

        [Given("a user visits the demo app")]
        public void GivenTheFirstNumberIs()
        {
            //TODO: implement arrange (precondition) logic
            // For storing and retrieving scenario-specific data see https://go.specflow.org/doc-sharingdata
            // To use the multiline text or the table argument of the scenario,
            // additional string/Table parameters can be defined on the step definition
            // method. 

            throw new ArgumentException("Boom");
        }

        [Given("has a test email address")]
        public void GivenTheSecondNumberIs()
        {
            //TODO: implement arrange (precondition) logic
            // For storing and retrieving scenario-specific data see https://go.specflow.org/doc-sharingdata
            // To use the multiline text or the table argument of the scenario,
            // additional string/Table parameters can be defined on the step definition
            // method. 

            _scenarioContext.Pending();
        }

        [When("the user signs up")]
        public void WhenTheTwoNumbersAreAdded()
        {
            //TODO: implement act (action) logic

            _scenarioContext.Pending();
        }

        [Then("they receive a confirmation code by email and can verify their account")]
        public void ThenTheResultShouldBe()
        {
            //TODO: implement assert (verification) logic

            _scenarioContext.Pending();
        }
    }
}
