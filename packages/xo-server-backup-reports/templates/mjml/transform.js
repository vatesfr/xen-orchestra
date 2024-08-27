'use strict'

const mjml2html = require('mjml')

module.exports = async function transform(source) {
  return { html: mjml2html(source).html }
}
