'use strict'

describe('Remote', function () {
  beforeEach('login', () => {
    cy.login()
  })

  it('should add a remote', function () {
    cy.addServers()
    cy.visit('/#/settings/remotes')
    cy.contains('New file system remote').should('exist')
    cy.get('select[name="type"]').select('Local')
    cy.get('input[name="name"]').type('Test local file remote 2')
    cy.get('input[name="path"]').type('var/tmp/test-remote')
    cy.contains('Save configuration').click()
    cy.contains('Local remote selected')
    cy.get('button:contains("OK")').click()
    cy.get('td:contains("Test local file remote 2")').closest('tr').find('button:contains("Enabled")')
  })
})
