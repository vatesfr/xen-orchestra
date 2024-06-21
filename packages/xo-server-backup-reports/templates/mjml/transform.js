'use strict'

const mjml2html = require('mjml')

exports.transform = function transform(source) {
  return mjml2html(source).html
}
