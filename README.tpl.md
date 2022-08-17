# MailSlurp Examples 📨

> Create email addresses on demand then send and receive emails in code and tests. Test apps end-to-end with *real* email addresses

This repository contains examples of [MailSlurp](https://www.mailslurp.com) usage with a range of different languages and frameworks. See the `README.md` or `Makefile` in each module for more information.

See developer page for [more guides and documentation](https://www.mailslurp.com/developers/). If you notice an issue in the examples please open an issue, pull request, or [contact support](https://www.mailslurp.com/support/).

## Projects

{{#topLevelDirs}}
- [{{.}}](./{{.}})
{{/topLevelDirs}}

## Running locally
If you wish to run these examples yourself:
- clone the repository. 
- create an `.env` file in the root directory containing `API_KEY=your-mailslurp-api-key`. 
- to run an example `cd` into the directory and run `make test` or `API_KEY=your-api-key make test`.

## CI
Examples are tested with each major release and on a schedule using Github actions and CircleCI.
