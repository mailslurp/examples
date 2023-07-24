import 'dart:io';

import 'package:test/test.dart';
//<gen>dart_import
// https://pub.dev/packages/mailslurp
import 'package:mailslurp/api.dart';
//</gen>

void main() async {
  setUp(() {
    //<gen>dart_config
    // read api key from environment variable
    var apiKey = Platform.environment["API_KEY"];
    expect(apiKey != null, true);

    // set api key on default client
    defaultApiClient.addDefaultHeader('x-api-key', apiKey!);
    //</gen>
  });

  test('can create email addresses', () async {
    //<gen>dart_create_inbox
    var inboxController = InboxControllerApi(defaultApiClient);
    var inbox = await inboxController.createInboxWithOptions(CreateInboxDto());
    expect(inbox!.emailAddress.contains("@mailslurp"), true);
    //</gen>
  });

  test('can send and receive emails', () async {
    var inboxController = InboxControllerApi(defaultApiClient);
    var waitForController = WaitForControllerApi(defaultApiClient);

    var inbox = await inboxController.createInboxWithOptions(CreateInboxDto());
    //<gen>dart_send_email
    var confirmation = await inboxController.sendEmailAndConfirm(inbox!.id,
        SendEmailOptions(
            to: [inbox.emailAddress],
            subject: "Test email",
            body: "<html>My message</html>",
            isHTML: true
        )
    );
    expect(confirmation!.inboxId, inbox.id);
    //</gen>
    //<gen>dart_wait
    var email = await waitForController.waitForLatestEmail(
        inboxId: inbox.id,
        timeout: 60000,
        unreadOnly: true
    );
    expect(email!.subject, "Test email");
    //</gen>
  });
}