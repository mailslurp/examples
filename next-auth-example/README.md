# Next.js Auth magic link example 
Example project demonstrating end-to-end testing of next-auth email access links using Playwright and MailSlurp.

## Setup from scratch
Following the [NextAuth email guide](https://next-auth.js.org/providers/email):

```
npm install --save next next-auth nodemailer mailslurp-client
```

Email provider requires a database, let's use [sequelize](https://authjs.dev/reference/adapter/sequelize):

```
npm install --save sequelize sqlite3 @auth/sequelize-adapter
```

For testing:

```
npm install --save-dev playwright
```
