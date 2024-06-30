/// <reference types="cypress" />
/// <reference types="cypress-downloadfile"/>

describe('export PDF', function() {
  it('exports each PDF file', function() {
    cy.on('uncaught:exception', () => false)

    cy.visit('/login/')

    cy.task('status', 'Authenticating...')
    cy.get('#email').type(Cypress.env('user'))
    cy.get('[type="password"]').type(Cypress.env('password'))
    cy.get('[type="submit"]').click()

    cy.task('status', 'Loading documents...')
    cy.get('#menu_documents').click()
    cy.get('#menu_office-invoice').click()
    cy.get('.icon-calendar').click()
    cy.get('#list-filter-start').type(Cypress.env('start'), { force: true })
    cy.get('#list-filter-end').type(Cypress.env('end'), { force: true })
    cy.get('#office-list-filter > [type="submit"]').click({ force: true })

    cy.wait(2000)
    cy.get('body').then(function(body) {
      if (body.find(':contains("Sem Documentos em Faturação.")').length > 0) {
        cy.task('status', 'No documents in this date window!')
        this.skip()
      }
    })

    cy.get('#office-export-cancel').then(function(button) {
      if (button.is(':visible')) {
        button.trigger('click')
      }
    })

    cy.wait(2000)
    cy.task('status', 'Exporting documents...')
    cy.get('#office-export-btn').click()
    cy.wait(2000)
    cy.get('#office-export-done-link:visible', { timeout: 600000 }).then(function(button) {
      cy.task('parsePath', Cypress.env('output')).then(function({ base, dir }) {
        cy.task('status', `Downloading "${base}" file into "${dir}"...`)
        cy.downloadFile(button.attr('href'), dir, base)
      })
    })
  })
})
