'use strict'

const PARSE_UUID_RE = /-/g

exports.packUuid = function packUuid(uuid) {
  return Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')
}
