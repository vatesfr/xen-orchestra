'use strict'

const escapeRegExp = require('lodash/escapeRegExp')

const compareLengthDesc = (a, b) => b.length - a.length

exports.compileTemplate = function compileTemplate(pattern, rules) {
  const matches = Object.keys(rules).sort(compareLengthDesc).map(escapeRegExp).join('|')
  const regExp = new RegExp(`\\\\(?:\\\\|${matches})|${matches}`, 'g')
  return (...params) =>
    pattern.replace(regExp, match => {
      if (match[0] === '\\') {
        return match.slice(1)
      }
      const rule = rules[match]
      return typeof rule === 'function' ? rule(...params) : rule
    })
}
