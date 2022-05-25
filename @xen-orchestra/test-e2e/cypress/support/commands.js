'use strict'
// https://on.cypress.io/custom-commands

const { default: Xo } = require('xo-lib')
const { username: xoUsername, password: xoPassword } = Cypress.env('xenOrchestra')

Cypress.Commands.add('login', (username = xoUsername, password = xoPassword) => {
  cy.request({
    method: 'POST',
    url: '/signin/local',
    form: true,
    body: {
      username,
      password,
    },
  })
  cy.setCookie('previousDisclaimer', Date.now().toString())
})

Cypress.Commands.add('addServers', async () => {
  const xo = new Xo({ url: Cypress.config('baseUrl') })

  await xo.open()

  await xo.signIn({
    email: xoUsername,
    password: xoPassword,
  })

  const { host, username, password } = Cypress.env('xcpNgLts')

  await xo.call('server.add', {
    host,
    username,
    password,
    label: 'XCP-ng LTS',
    allowUnauthorized: true,
  })
})
