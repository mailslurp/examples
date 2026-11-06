//<gen>emails_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

final class EmailSetup {
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
public final class EmailWorkflows {
    private EmailWorkflows() {}

    //<gen>emails_docs_send_html
    public static SentEmailDto sendHtml(ApiClient client, UUID inboxId, String to) throws ApiException {
        // sendEmailAndConfirm returns the sent email record once MailSlurp accepts it.
        return new InboxControllerApi(client).sendEmailAndConfirm(inboxId, new SendEmailOptions()
            .to(Collections.singletonList(to))
            .subject("Your order has shipped")
            .body("<h1>On its way</h1><p>Track it at <a href=\"https://example.com/track\">example.com</a></p>")
            .isHTML(true)).execute();
    }
    //</gen>

    //<gen>emails_docs_send_attachment
    public static SentEmailDto sendAttachment(ApiClient client, UUID inboxId, String to) throws ApiException {
        // Upload the file first, then send its attachment ID with the email.
        List<String> attachmentIds = new AttachmentControllerApi(client).uploadAttachment(new UploadAttachmentOptions()
            .base64Contents(Base64.getEncoder().encodeToString("id,total\n1001,49.00\n".getBytes(StandardCharsets.UTF_8)))
            .contentType("text/csv")
            .filename("invoice.csv")).execute();
        return new InboxControllerApi(client).sendEmailAndConfirm(inboxId, new SendEmailOptions()
            .to(Collections.singletonList(to))
            .subject("Invoice attached")
            .body("See attached.")
            .attachments(attachmentIds)).execute();
    }
    //</gen>

    //<gen>emails_docs_get_email
    public static Email getEmail(ApiClient client, UUID emailId) throws ApiException {
        Email email = new EmailControllerApi(client).getEmail(emailId).execute();
        System.out.println(email.getFrom() + " " + email.getSubject());
        return email;
    }
    //</gen>

    //<gen>emails_docs_links_codes
    public static List<String> linksAndCode(ApiClient client, UUID emailId) throws ApiException {
        // MailSlurp parses links and one-time codes from the email body for you.
        EmailControllerApi emails = new EmailControllerApi(client);
        List<String> links = emails.getEmailLinks(emailId).execute().getLinks();
        ExtractCodesResult codes = emails.getEmailCodes(emailId).execute();
        if (Boolean.TRUE.equals(codes.getFound())) System.out.println("Code: " + codes.getCode());
        return links;
    }
    //</gen>

    //<gen>emails_docs_download_attachment
    public static byte[] downloadAttachment(ApiClient client, UUID emailId) throws ApiException {
        Email email = new EmailControllerApi(client).getEmail(emailId).execute();
        String attachmentId = email.getAttachments().get(0);
        DownloadAttachmentDto file = new AttachmentControllerApi(client)
            .downloadAttachmentAsBase64Encoded(attachmentId).execute();
        return Base64.getDecoder().decode(file.getBase64FileContents());
    }
    //</gen>

    //<gen>emails_docs_reply
    public static SentEmailDto reply(ApiClient client, UUID emailId) throws ApiException {
        // Replies keep the original thread headers and send from the receiving inbox.
        return new EmailControllerApi(client).replyToEmail(emailId, new ReplyToEmailOptions()
            .body("Thanks, received.")
            .isHTML(false)).execute();
    }
    //</gen>
}
