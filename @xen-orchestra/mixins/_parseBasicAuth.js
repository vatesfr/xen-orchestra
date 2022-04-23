'use strict'

const RE = /^\s*basic\s+(.+?)\s*$/i

exports.parseBasicAuth = function parseBasicAuth(header) {
  if (header === undefined) {
    return
  }

  const matches = RE.exec(header)
  if (matches === null) {
    return
  }

  const credentials = Buffer.from(matches[1], 'base64').toString()

  // https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1
  let user, password
  const i = credentials.indexOf(':')
  if (i === -1) {
    user = credentials
    password = ''
  } else {
    user = credentials.slice(0, i)
    password = credentials.slice(i + 1)
  }

  return { user, password }
}
