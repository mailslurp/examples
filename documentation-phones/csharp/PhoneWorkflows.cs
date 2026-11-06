//<gen>phones_docs_setup
using System;
using System.Collections.Generic;
using System.Linq;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class PhoneSetup
{
    public static Configuration CreateConfiguration()
    {
        var apiKey = Environment.GetEnvironmentVariable("MAILSLURP_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Set MAILSLURP_API_KEY");
        var configuration = new Configuration { Timeout = TimeSpan.FromSeconds(75) };
        configuration.ApiKey.Add("x-api-key", apiKey);
        return configuration;
    }
}
//</gen>

// Independent helpers: building this library makes no requests.
public static class PhoneWorkflows
{
    //<gen>phones_docs_list_numbers
    public static List<string> ListNumbers(Configuration configuration)
    {
        // Phone numbers are created in the dashboard or API; list them to find the one for your test.
        return new PhoneControllerApi(configuration).GetPhoneNumbers(size: 20).Content
            .Select(phone => $"{phone.Id} {phone.PhoneNumber}")
            .ToList();
    }
    //</gen>

    //<gen>phones_docs_wait_latest
    public static SmsDto WaitForSms(Configuration configuration, Guid phoneNumberId, DateTime since)
    {
        // Waits until an unread SMS arrives after `since`, or throws after the timeout.
        return new WaitForControllerApi(configuration).WaitForLatestSms(new WaitForSingleSmsOptions(
            phoneNumberId: phoneNumberId, timeout: 60_000, unreadOnly: true, since: since));
    }
    //</gen>

    //<gen>phones_docs_extract_code
    public static string ExtractCode(Configuration configuration, Guid smsId)
    {
        // MailSlurp finds the one-time code in the message body.
        var result = new SmsControllerApi(configuration).GetSmsCodes(smsId);
        if (!result.Found) throw new InvalidOperationException("No code found in the SMS");
        return result.Code;
    }
    //</gen>

    //<gen>phones_docs_send_sms
    public static SentSmsDto SendSms(Configuration configuration, Guid fromPhoneId, string to)
    {
        // `to` is an E.164 number, for example +15555550100.
        return new SmsControllerApi(configuration).SendSms(
            new SmsSendOptions(to: to, body: "Your appointment is confirmed for 3pm."), fromPhoneId: fromPhoneId);
    }
    //</gen>

    //<gen>phones_docs_list_sms
    public static List<string> ListSms(Configuration configuration, Guid phoneNumberId)
    {
        return new SmsControllerApi(configuration).GetAllSmsMessages(phoneNumber: phoneNumberId, size: 20).Content
            .Select(sms => $"{sms.FromNumber}: {sms.Body}")
            .ToList();
    }
    //</gen>
}
