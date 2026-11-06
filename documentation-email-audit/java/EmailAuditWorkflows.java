//<gen>audit_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

final class AuditSetup {
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
public final class EmailAuditWorkflows {
    private EmailAuditWorkflows() {}

    //<gen>audit_docs_audit_html
    public static EmailAuditDto auditHtml(ApiClient client, String html) throws ApiException {
        // Checks links, images, spelling and content before you send the campaign.
        EmailAuditDto audit = new EmailAuditControllerApi(client).createEmailAudit(new CreateEmailAuditOptions()
            .subject("Spring sale: 20% off")
            .fromAddress("news@example.com")
            .htmlBody(html)).execute();
        System.out.println("Health score " + audit.getAnalysis().getHealthScore()
            + ", failing checks " + audit.getAnalysis().getFailingChecks());
        return audit;
    }
    //</gen>

    //<gen>audit_docs_read_issues
    public static List<String> readIssues(ApiClient client, UUID auditId) throws ApiException {
        EmailAuditAnalysisResult analysis = new EmailAuditControllerApi(client).getEmailAudit(auditId).execute().getAnalysis();
        List<String> issues = analysis.getBrokenLinks().stream()
            .map(issue -> "Broken link: " + issue.getUrl()).collect(Collectors.toList());
        if (analysis.getContentReview() != null) {
            analysis.getContentReview().stream()
                .filter(check -> check.getStatus() != EmailAuditCheck.StatusEnum.PASS)
                .forEach(check -> issues.add(check.getTitle() + ": " + check.getRecommendation()));
        }
        return issues;
    }
    //</gen>

    //<gen>audit_docs_list
    public static List<String> listAudits(ApiClient client) throws ApiException {
        return new EmailAuditControllerApi(client).getEmailAudits().limit(10).execute().stream()
            .map(audit -> audit.getSubject() + " score " + audit.getAnalysis().getHealthScore())
            .collect(Collectors.toList());
    }
    //</gen>
}
