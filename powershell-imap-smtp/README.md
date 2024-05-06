# Powershell IMAP and SMTP examples using MailKit/MimeKit
Ensure you have the [`MailKit`](https://www.nuget.org/packages/MailKit/) and [`MimeKit`](https://www.nuget.org/packages/MimeKit/) libraries installed. You can install them using the `NuGet` package manager.

Then ensure you have a MailSlurp API_KEY variable set. You can get one from the [MailSlurp dashboard](https://app.mailslurp.com).

```ps1
$env:API_KEY = "your-api-key"
```

Then run the examples:

```ps1
./imap-mailkit.ps1
./smtp-mailkit.ps1
```