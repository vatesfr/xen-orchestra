'use strict'

describe('Sign In', () => {
  it('should not be able to sign in with bad credentials', () => {
    cy.visit('/')
    cy.get('[name="username"]').type('bad-user')
    cy.get('[name="password"]').type('bad-password')
    cy.get('.btn-info').click()
    cy.get('.text-danger')
    cy.url().should('not.include', '/#/home')
  })

  it('should be able to sign in', () => {
    cy.visit('/')
    cy.get('[name="username"]').type(Cypress.env('xenOrchestra').username)
    cy.get('[name="password"]').type(Cypress.env('xenOrchestra').password)
    cy.get('.btn-info').click()
    cy.url().should('include', '/#/home')
  })

  it('should sign in without UI', () => {
    cy.login()
    cy.visit('/')
    cy.url().should('include', '/#/home')
  })
})
