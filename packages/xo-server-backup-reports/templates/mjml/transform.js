'use strict'

const mjml2html = require('mjml')

exports.transform = async function transform(source) {
  return { html: mjml2html(source).html }
}
