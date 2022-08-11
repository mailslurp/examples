Imports NUnit.Framework

Namespace visualbasic
    Public Class Tests
        <SetUp>
        Public Sub Setup()
        End Sub

        <Test>
        Public Sub Test1()
            '<gen>vb_setup_slurp
            Dim webClient As New Net.WebClient
            Dim jsonClient As New Net.WebClient
            Dim apiKey As String = Environment.GetEnvironmentVariable("API_KEY")
            Assert.IsNotEmpty(apiKey)
            Assert.IsNotNull(apiKey)
            webClient.Headers.Add("x-api-key", apiKey)
            Dim imapSmtpAccessJson = webClient.DownloadString("https://api.mailslurp.com/inboxes/imap-smtp-access")
            jsonClient.Headers.Add("Content-Type", "application/json")
            Dim username = jsonClient.UploadString("https://api.mailslurp.com/user/json/pluck?property=smtpUsername", imapSmtpAccessJson)
            jsonClient.Headers.Add("Content-Type", "application/json")
            Dim password = jsonClient.UploadString("https://api.mailslurp.com/user/json/pluck?property=smtpPassword", imapSmtpAccessJson)
            jsonClient.Headers.Add("Content-Type", "application/json")
            Dim port = jsonClient.UploadString("https://api.mailslurp.com/user/json/pluck?property=smtpServerPort", imapSmtpAccessJson)
            jsonClient.Headers.Add("Content-Type", "application/json")
            Dim host = jsonClient.UploadString("https://api.mailslurp.com/user/json/pluck?property=smtpServerHost", imapSmtpAccessJson)
            '</gen>
            Dim inboxResult = webClient.DownloadString("https://api.mailslurp.com/inboxes/paginated?page=0&size=1")
            jsonClient.Headers.Add("Content-Type", "application/json")
            Dim emailAddress = jsonClient.UploadString("https://api.mailslurp.com/user/json/pluck?property=content.0.emailAddress", inboxResult)
            Assert.IsNotNull(emailAddress)
            Assert.AreEqual(emailAddress, "213")
            Dim toAddress = emailAddress
            Dim fromAddress = emailAddress
            '<gen>vb_configure_smtp
            Dim Smtp_Server As New Net.Mail.SmtpClient
            Smtp_Server.UseDefaultCredentials = False
            Smtp_Server.Credentials = New Net.NetworkCredential(username, password)
            Smtp_Server.EnableSsl = False
            Smtp_Server.Port = Integer.Parse(port)
            Smtp_Server.Host = host
            '</gen>
            '<gen>vb_send_email
            Dim email As New Net.Mail.MailMessage()
            email = New Net.Mail.MailMessage()
            email.From = New Net.Mail.MailAddress(fromAddress)
            email.To.Add(toAddress)
            email.Subject = "Send email with VB"
            email.IsBodyHtml = False
            email.Body = "Hello this is me"
            Smtp_Server.Send(email)
            '</gen>
        End Sub
    End Class
End Namespace