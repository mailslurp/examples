import 'dart:io';

import 'package:test/test.dart';
// <gen>dart_import
// https://pub.dev/packages/mailslurp
import 'package:mailslurp/api.dart';
// </gen>

void main() async {
  setUp(() {
    // read api key from environment variable
    var apiKey = Platform.environment["API_KEY"];
    expect(apiKey != null, true);

    // set api key and instantiate controllers
    defaultApiClient.addDefaultHeader('x-api-key', apiKey!);
  });

  test('can create email addresses', () async {
    var inboxController = InboxControllerApi(defaultApiClient);
    var inbox = await inboxController.createInboxWithOptions(CreateInboxDto());
    expect(inbox!.emailAddress.contains("@mailslurp"), true);
  });

  test('can send and receive emails', () async {
    var inboxController = InboxControllerApi(defaultApiClient);
    var waitForController = WaitForControllerApi(defaultApiClient);

    var inbox = await inboxController.createInboxWithOptions(CreateInboxDto());

    var confirmation = await inboxController.sendEmailAndConfirm(inbox!.id,
        SendEmailOptions(
            to: [inbox.emailAddress],
            subject: "Test email",
            body: "<html>My message</html>",
            isHTML: true
        )
    );
    expect(confirmation!.inboxId, inbox.id);

    var email = await waitForController.waitForLatestEmail(inboxId: inbox.id, timeout: 30000, unreadOnly: true);
    expect(email!.subject, "Test email");
  });
}