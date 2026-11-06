//<gen>phones_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

final class PhoneSetup {
    static ApiClient createClient() {
        String apiKey = System.getenv("MAILSLURP_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Set MAILSLURP_API_KEY");
        }
        ApiClient client = new ApiClient();
        client.setApiKey(apiKey);
        client.setConnectTimeout(10_000);
        client.setReadTimeout(75_000);
        return client;
    }
}
//</gen>

/** Independent examples. No main method: loading or compiling this file makes no requests. */
public final class PhoneWorkflows {
    private PhoneWorkflows() {}

    //<gen>phones_docs_list_numbers
    public static List<String> listNumbers(ApiClient client) throws ApiException {
        // Phone numbers are created in the dashboard or API; list them to find the one for your test.
        return new PhoneControllerApi(client).getPhoneNumbers().size(20).execute().getContent().stream()
            .map(phone -> phone.getId() + " " + phone.getPhoneNumber())
            .collect(Collectors.toList());
    }
    //</gen>

    //<gen>phones_docs_wait_latest
    public static SmsDto waitForSms(ApiClient client, UUID phoneNumberId, OffsetDateTime since) throws ApiException {
        // Waits until an unread SMS arrives after `since`, or throws after the timeout.
        return new WaitForControllerApi(client).waitForLatestSms(new WaitForSingleSmsOptions()
            .phoneNumberId(phoneNumberId)
            .timeout(60_000L)
            .unreadOnly(true)
            .since(since)).execute();
    }
    //</gen>

    //<gen>phones_docs_extract_code
    public static String extractCode(ApiClient client, UUID smsId) throws ApiException {
        // MailSlurp finds the one-time code in the message body.
        ExtractCodesResult result = new SmsControllerApi(client).getSmsCodes(smsId).execute();
        if (!Boolean.TRUE.equals(result.getFound())) throw new IllegalStateException("No code found in the SMS");
        return result.getCode();
    }
    //</gen>

    //<gen>phones_docs_send_sms
    public static SentSmsDto sendSms(ApiClient client, UUID fromPhoneId, String to) throws ApiException {
        // `to` is an E.164 number, for example +15555550100.
        return new SmsControllerApi(client).sendSms(new SmsSendOptions()
            .to(to)
            .body("Your appointment is confirmed for 3pm.")).fromPhoneId(fromPhoneId).execute();
    }
    //</gen>

    //<gen>phones_docs_list_sms
    public static List<String> listSms(ApiClient client, UUID phoneNumberId) throws ApiException {
        return new SmsControllerApi(client).getAllSmsMessages().phoneNumber(phoneNumberId).size(20).execute()
            .getContent().stream()
            .map(sms -> sms.getFromNumber() + ": " + sms.getBody())
            .collect(Collectors.toList());
    }
    //</gen>
}
