Imports System.Text.Json.Serialization
Imports NUnit.Framework

Namespace visualbasic
    Public Class Tests
        <SetUp>
        Public Sub Setup()
        End Sub

        <Test>
        Public Sub Test1()
            Dim webClient As New Net.WebClient
            Dim apiKey As String = Environment.GetEnvironmentVariable("API_KEY")
            Assert.IsNotEmpty(apiKey)
            webClient.Headers.Add("x-api-key", apiKey)
            Dim username = webClient.DownloadString("https://api.mailslurp.com/user/smtp/username")
            Dim password = webClient.DownloadString("https://api.mailslurp.com/user/smtp/password")
            Dim port = webClient.DownloadString("https://api.mailslurp.com/user/smtp/port")
            Dim host = webClient.DownloadString("https://api.mailslurp.com/user/smtp/host")
        End Sub
    End Class
End Namespace