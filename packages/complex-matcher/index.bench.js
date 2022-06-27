'use strict'

const { parse } = require('./')
const { ast, pattern } = require('./index.fixtures')

module.exports = ({ benchmark }) => {
  benchmark('parse', () => {
    parse(pattern)
  })

  benchmark('toString', () => {
    ast.toString()
  })
}
