import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  iterations: 1,
};

export default function () {
  const apiKey = __ENV.API_KEY;
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
  const timeout = '60s'

  console.log('Creating inbox');
  // 1) Create a new inbox with defaults
  let createRes = http.post(
    `https://api.mailslurp.com/inboxes/withDefaults`,
    null,
    { headers, timeout }
  );
  check(createRes, {
    'create inbox status is 201': (r) => r.status === 201,
    'inboxId is present': (r) => !!r.json('id'),
    'emailAddress is present': (r) => !!r.json('emailAddress'),
  });
  const inboxId = createRes.json('id');
  const emailAddress = createRes.json('emailAddress');
  console.log('Sending test email from ' + inboxId + ' to ' + emailAddress);

  // 2) Send a confirmation/test email into that inbox
  const confirmPayload = JSON.stringify({
    to: [emailAddress],
    subject: 'test',
  });
  let confirmRes = http.post(
    `https://api.mailslurp.com/inboxes/${inboxId}/confirm`,
    confirmPayload,
    { headers, timeout }
  );
  check(confirmRes, {
    'confirm endpoint status is 200': (r) => r.status === 201,
  });

  console.log('Waiting for response with url: ' + waitUrl);
  // 3) Wait for the latest email to arrive
  //<gen>k6_wait_for_email
  const waitUrl = `https://api.mailslurp.com/waitForLatestEmail?inboxId=${inboxId}&timeout=60000&unreadOnly=true`;
  let emailRes = http.get(waitUrl, { headers, timeout });
  check(emailRes, {
    'status is 200': (r) => r.status === 200,
    'received email has correct subject': (r) => r.json('subject') === 'test',
    'received email to matches inbox': (r) => r.json('to')[0] === emailAddress,
  });
  //</gen>
  console.log('Email received');

  // pacing
  sleep(1);
}
