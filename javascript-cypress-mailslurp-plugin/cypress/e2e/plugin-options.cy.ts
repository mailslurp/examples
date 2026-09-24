/// <reference types="cypress-mailslurp" />

// Exercise controller requests through the installed package, including custom fetch.
describe('MailSlurp plugin configuration', () => {
    for (const explicitKey of [false, true]) {
        it(`preserves client options with an ${explicitKey ? 'explicit' : 'environment'} API key`, () => {
            const requests: Array<{ url: string; headers: Headers }> = []
            cy.mailslurp({
                ...(explicitKey ? { apiKey: 'example-key' } : {}),
                basePath: 'https://mail.example.test',
                headers: { 'x-example': 'custom-header' },
                fetchApi: async (url, init) => {
                    requests.push({ url: String(url), headers: new Headers(init?.headers) })
                    return new Response(JSON.stringify({ id: 'example-user' }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    })
                },
            })
                .then(mailslurp => mailslurp.userController.getUserInfo())
                .then(user => {
                    expect(user.id).to.equal('example-user')
                    expect(requests).to.have.length(1)
                    expect(requests[0].url).to.equal('https://mail.example.test/user/info')
                    expect(requests[0].headers.get('x-example')).to.equal('custom-header')
                })
        })
    }
})
