'use strict'

const TPL_RE = /\{\{(.+?)\}\}/g
const evalTemplate = (tpl, data) => {
  const getData = typeof data === 'function' ? (_, key) => data(key) : (_, key) => data[key]

  return tpl.replace(TPL_RE, getData)
}
exports.evalTemplate = evalTemplate

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
