'use strict'

// ===================================================================

// Fix URL if necessary.
var URL_RE = /^(?:(?:http|ws)(s)?:\/\/)?(.*?)\/*(?:\/api\/)?(\?.*?)?(?:#.*)?$/
function fixUrl (url) {
  var matches = URL_RE.exec(url)
  var isSecure = !!matches[1]
  var hostAndPath = matches[2]
  var search = matches[3]

  return [
    isSecure ? 'wss' : 'ws',
    '://',
    hostAndPath,
    '/api/',
    search
  ].join('')
}
module.exports = fixUrl
