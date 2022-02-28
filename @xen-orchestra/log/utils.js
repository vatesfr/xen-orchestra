'use strict'

const escapeRegExp = require('lodash/escapeRegExp')

// ===================================================================

const TPL_RE = /\{\{(.+?)\}\}/g
const evalTemplate = (tpl, data) => {
  const getData = typeof data === 'function' ? (_, key) => data(key) : (_, key) => data[key]

  return tpl.replace(TPL_RE, getData)
}
exports.evalTemplate = evalTemplate

// -------------------------------------------------------------------

const compileGlobPatternFragment = pattern => pattern.split('*').map(escapeRegExp).join('.*')

const compileGlobPattern = pattern => {
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
exports.compileGlobPattern = compileGlobPattern

// -------------------------------------------------------------------

const required = name => {
  throw new Error(`missing required arg ${name}`)
}
exports.required = required

// -------------------------------------------------------------------

const serializeError = error => ({
  ...error, // Copy enumerable properties.
  code: error.code,
  message: error.message,
  name: error.name,
  stack: error.stack,
})
exports.serializeError = serializeError
