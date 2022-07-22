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
            Dim apiKey As String = "wus_test"
            Assert.IsNotEmpty(apiKey)
            webClient.Headers.Add("x-api-key", apiKey)
            Dim result = webClient.DownloadString("https://api.mailslurp.com/inboxes/imap-smtp-access")
            Dim Json As Object
            Assert.AreEqual(result, 1)
        End Sub
    End Class
End Namespace