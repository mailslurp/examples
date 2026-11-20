// SMS sender for the demo app. The app only calls send({ to, body }).
// memory: keeps messages in this process, like an emulator. Nothing reaches a phone.
// The real-SMS test doesn't use this app: it signs up to MailSlurp's SMS playground instead.

export function createSender(env = process.env) {
  const provider = (env.SMS_PROVIDER ?? "memory").trim();
  if (provider !== "memory") throw new Error(`Unknown SMS_PROVIDER ${provider}. The demo app only simulates SMS.`);
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
