'use strict'

describe('VM', function () {
  beforeEach('login', () => {
    cy.login()
  })

  it('should add a VM', function () {
    cy.addServers()
    cy.visit('/#/home?t=VM')
    cy.get('a:contains("New VM")').click()
    cy.contains('Create a new VM on').should('exist')
    cy.contains('Select pool').closest('.Select-control').click()
    cy.contains('ci-test-xcp-ng-lts').should('exist').click()
    cy.get('h4:contains("Performance")').should('exist')
  })
})
