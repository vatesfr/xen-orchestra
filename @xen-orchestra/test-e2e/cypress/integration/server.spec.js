'use strict'

describe('Server', () => {
  beforeEach('login', () => {
    cy.login()
  })

  it('should add a server', () => {
    cy.visit('/#/settings/servers')

    cy.get('#form-add-server .form-group:nth-child(1) input').type('XCP-ng LTS')
    cy.get('#form-add-server .form-group:nth-child(2) input').type(Cypress.env('xcpNgLts').host)
    cy.get('#form-add-server .form-group:nth-child(3) input').type(Cypress.env('xcpNgLts').username)
    cy.get('#form-add-server .form-group:nth-child(4) input').type(Cypress.env('xcpNgLts').password)
    cy.get('#form-add-server .form-group:nth-child(5) .xo-icon-toggle-off').click()

    cy.get('span:contains("Connect")').click()
    cy.get(`td:contains("XCP-ng LTS")`)
  })

  it('should remove a server', () => {
    cy.get(`td:contains("XCP-ng LTS")`).closest('tr').find('.btn-danger').click()
    cy.get(`td:contains("XCP-ng LTS")`).should('not.exist')
  })

  it('should disable a server', () => {
    cy.addServers();
    cy.visit('/#/settings/servers')
    cy.contains('ci-test-xcp-ng-lts.localdomain').closest('tr').find('button:contains("Enabled")').click()
    cy.contains('ci-test-xcp-ng-lts.localdomain').closest('tr').find('button:contains("Disabled")')
  })

  it('should enable a server', () => {
    cy.visit('/#/settings/servers')
    cy.contains('ci-test-xcp-ng-lts.localdomain').closest('tr').find('button:contains("Disabled")').click()
    cy.contains('ci-test-xcp-ng-lts.localdomain').closest('tr').find('button:contains("Enabled")')
  })
})
