import http from 'k6/http';
import {check, sleep} from 'k6';

export const options = {
    iterations: 1,
};
const MAILSLURP_API_KEY = __ENV.API_KEY;
const YOUR_APPLICATION_SIGNUP_URL = `https://api.mailslurp.com/test-application/magic-link`

export default function () {
    //<gen>k6_signup_createinbox
    // 1. create fresh email account for test run
    let inboxRes = http.post(`https://api.mailslurp.com/inboxes`, null, {
        headers: {
            'x-api-key': MAILSLURP_API_KEY,
            'Content-Type': 'application/json',
        },
    });
    check(inboxRes, {'create inbox =201': (r) => r.status === 201});
    // store values
    let inbox = inboxRes.json();
    let inboxId = inbox.id;
    let emailAddress = inbox.emailAddress;
    //</gen>

    //<gen>k6_signup_signup
    // 2. sign up with email address in our application
    let form = `emailAddress=${encodeURIComponent(emailAddress)}`;
    let signupRes = http.post(
        `${YOUR_APPLICATION_SIGNUP_URL}`,
        form,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );
    check(signupRes, {'magic-link =200': (r) => r.status === 200});
    //</gen>

    //<gen>k6_signup_wait
    // 3. wait for confirmation email to arrive
    let waitUrl = `https://api.mailslurp.com/waitForLatestEmail`
        + `?inboxId=${inboxId}&timeout=60000&unreadOnly=true`;
    let waitRes = http.get(waitUrl, {
        headers: {'x-api-key': MAILSLURP_API_KEY},
    });
    check(waitRes, {'email arrived =200': (r) => r.status === 200});
    let email = waitRes.json();
    check(email, {'email.id exists': (e) => e.id !== undefined});
    //</gen>

    sleep(1);
}