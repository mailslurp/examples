package com.mailslurp.examples;


import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
//<gen>java_demo_imports
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.*;
//</gen>

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class AISchemaUsageTest {
  private static final String YOUR_API_KEY = System.getenv("API_KEY");
  private static final Boolean UNREAD_ONLY = true;
  //    private static final Long TIMEOUT_MILLIS = 30000L;
  private static final Integer TIMEOUT_MILLIS = 30000;

  //<gen>java_ai_output_desired
  public record DesiredOutput(
          @JsonProperty("invoiceId") String invoiceId,
          @JsonProperty("status") InvoiceStatus status,
          @JsonProperty("lineItems") List<LineItem> lineItems
  ) {
    public enum InvoiceStatus {
      @JsonProperty("paid") PAID,
      @JsonProperty("pending") PENDING
    }

    public record LineItem(
            @JsonProperty("name") String name,
            @JsonProperty("amount") BigDecimal amount
    ) {}
  }
  //</gen>

  @BeforeAll
  public static void Setup() {
    assertNotNull(YOUR_API_KEY);
  }

  @Test
  public void CanUseAISchema() throws Exception {
    ApiClient secureClient = Configuration.getDefaultApiClient();
    secureClient.setApiKey(YOUR_API_KEY);
    secureClient.setBasePath("https://api-staging.mailslurp.com");
    secureClient.setConnectTimeout(TIMEOUT_MILLIS.intValue());
    AiControllerApi inboxControllerApi = new AiControllerApi(secureClient);

    //<gen>java_ai_output_schema_large
    var schema =
        new StructuredOutputSchema()
            .type(StructuredOutputSchema.TypeEnum.OBJECT)
            .description("Schema for an invoice email")
            .properties(Map.ofEntries(
                Map.entry("invoiceId",
                    new StructuredOutputSchema()
                        .type(StructuredOutputSchema.TypeEnum.STRING)
                        .description("The invoice ID")),
                Map.entry("status",
                    new StructuredOutputSchema()
                        .type(StructuredOutputSchema.TypeEnum.STRING)
                        .format("enum")
                        .description("The status of the invoice")
                        ._enum(List.of("paid", "pending"))),
                Map.entry("lineItems",
                    new StructuredOutputSchema()
                        .type(StructuredOutputSchema.TypeEnum.ARRAY)
                        .description("The items on the invoice")
                        .items(new StructuredOutputSchema()
                            .type(StructuredOutputSchema.TypeEnum.OBJECT)
                            .description("A line item")
                            .properties(Map.ofEntries(
                                Map.entry("name",
                                    new StructuredOutputSchema()
                                        .type(StructuredOutputSchema.TypeEnum.STRING)
                                        .description("Name of the line item")),
                                Map.entry("amount",
                                    new StructuredOutputSchema()
                                        .type(StructuredOutputSchema.TypeEnum.NUMBER)
                                        .description("Price in $"))
                            ))
                        )
                )
            ));
    //</gen>

    var validate = inboxControllerApi.validateStructuredOutputSchema(schema).execute();
    assertTrue(validate.getValid());
    String jsonString = validate.getExampleOutput();
    var objectMapper = new ObjectMapper();
    //<gen>java_ai_deserialize_json
    DesiredOutput obj = objectMapper.readValue(jsonString, DesiredOutput.class);
    assertNotNull(obj.invoiceId());
    assertTrue(obj.status() == DesiredOutput.InvoiceStatus.PAID
        || obj.status() == DesiredOutput.InvoiceStatus.PENDING);
    assertFalse(obj.lineItems().isEmpty());
    //</gen>
  }
}
