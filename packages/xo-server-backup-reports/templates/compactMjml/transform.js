'use strict'

const mjml2html = require('mjml')

module.exports = async function transform(source) {
  return { compactHtml: mjml2html(source).html }
}
