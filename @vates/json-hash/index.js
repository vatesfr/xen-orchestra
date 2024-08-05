'use strict'

const { createHash } = require('node:crypto')

function updateJsonHash(value, hash) {
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      hash.update('[')
      for (const item of value) {
        updateJsonHash(item, hash)

        // trailing is not a big deal because it does not need to be valid JSON
        hash.update(',')
      }
      hash.update(']')
    } else {
      hash.update('{')
      for (const key of Object.keys(value).sort()) {
        updateJsonHash(key, hash)
        hash.update(':')
        updateJsonHash(value[key], hash)

        // trailing is not a big deal because it does not need to be valid JSON
        hash.update(',')
      }
      hash.update('}')
    }
  } else {
    hash.update(JSON.stringify(value))
  }
}

exports.jsonHash = function jsonHash(value) {
  // this hash does not need to be secure, it just needs to be fast and with low collisions
  const hash = createHash('sha256')
  updateJsonHash(value, hash)
  return hash.digest('base64')
}
