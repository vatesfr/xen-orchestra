'use strict'

import './commands'

before('Restore VMs from snapshot', () => {
  cy.exec(
    `node scripts/restore-vm.js && wait-on ${Cypress.config('baseUrl')} && wait-on tcp:${Cypress.env('xcpNgLts').host}:80`,
    { timeout: 300e3 },
  )
})
