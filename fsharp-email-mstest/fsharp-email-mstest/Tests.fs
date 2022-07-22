namespace fsharp_email_mstest

open System
open Microsoft.VisualStudio.TestTools.UnitTesting
open mailslurp.Client

[<TestClass>]
type TestClass () =

    [<TestMethod>]
    member this.TestMethodPassing () =
        let apiKey = Environment.GetEnvironmentVariable("API_KEY")
        Assert.IsNotNull(apiKey)
        let config = Configuration()
        config.ApiKey.Add("x-api-key", apiKey);
        Assert.IsTrue(true)b