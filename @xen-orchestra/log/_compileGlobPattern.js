'use strict'

const escapeRegExp = require('lodash/escapeRegExp')

const compileGlobPatternFragment = pattern => pattern.split('*').map(escapeRegExp).join('.*')

module.exports = function compileGlobPattern(pattern) {
  const no = []
  const yes = []
  pattern.split(/[\s,]+/).forEach(pattern => {
    if (pattern[0] === '-') {
      no.push(pattern.slice(1))
    } else {
      yes.push(pattern)
    }
  })

  const raw = ['^']

  if (no.length !== 0) {
    raw.push('(?!', no.map(compileGlobPatternFragment).join('|'), ')')
  }

  if (yes.length !== 0) {
    raw.push('(?:', yes.map(compileGlobPatternFragment).join('|'), ')')
  } else {
    raw.push('.*')
  }

  raw.push('$')

  return new RegExp(raw.join(''))
}
