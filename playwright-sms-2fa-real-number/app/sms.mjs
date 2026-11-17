// SMS senders for the demo app. The app only calls send({ to, body }).
// memory: keeps messages in this process, like an emulator. Nothing reaches a phone.
// twilio: Twilio Messaging API. Test credentials return a queued message but deliver nothing.
// mailslurp: sends from a MailSlurp number, so one account can run the whole real flow.

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Set ${name} for SMS_PROVIDER=${env.SMS_PROVIDER}.`);
  return value;
}

export function createSender(env = process.env) {
  const provider = (env.SMS_PROVIDER ?? "memory").trim();

  if (provider === "memory") {
    const outbox = [];
    return {
      provider,
      outbox,
      async send({ to, body }) {
        outbox.push({ to, body, sentAt: new Date().toISOString() });
        return { id: `memory-${outbox.length}` };
      },
    };
  }

  if (provider === "twilio") {
    const sid = required(env, "TWILIO_ACCOUNT_SID");
    const token = required(env, "TWILIO_AUTH_TOKEN");
    const from = required(env, "TWILIO_FROM");
    return {
      provider,
      async send({ to, body }) {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
          body: new URLSearchParams({ From: from, To: to, Body: body }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(`Twilio rejected the message: ${result.code ?? response.status}`);
        return { id: result.sid, status: result.status };
      },
    };
  }

  if (provider === "mailslurp") {
    const apiKey = required(env, "MAILSLURP_API_KEY");
    const senderId = required(env, "MAILSLURP_SENDER_PHONE_ID");
    return {
      provider,
      async send({ to, body }) {
        const response = await fetch(`https://api.mailslurp.com/phone/numbers/${senderId}/sms`, {
          method: "POST",
          headers: { "x-api-key": apiKey, "content-type": "application/json" },
          body: JSON.stringify({ to, body }),
        });
        if (!response.ok) throw new Error(`MailSlurp could not send the message: HTTP ${response.status}`);
        const result = await response.json();
        return { id: result.id };
      },
    };
  }

  throw new Error(`Unknown SMS_PROVIDER "${provider}". Use memory, twilio or mailslurp.`);
}
