'use strict'

const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/

module.exports = str => {
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    throw new Error('no opaque ref found')
  }
  return matches[0]
}
