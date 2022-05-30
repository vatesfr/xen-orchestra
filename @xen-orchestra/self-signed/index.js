'use strict'

const { execFile } = require('child_process')

const RE =
  /^(-----BEGIN PRIVATE KEY-----.+-----END PRIVATE KEY-----\n)(-----BEGIN CERTIFICATE-----.+-----END CERTIFICATE-----\n)$/s
exports.genSelfSignedCert = async ({ days = 360 } = {}) =>
  new Promise((resolve, reject) => {
    execFile(
      'openssl',
      ['req', '-batch', '-new', '-x509', '-days', String(days), '-nodes', '-newkey', 'rsa:2048', '-keyout', '-'],
      (error, stdout) => {
        if (error != null) {
          return reject(error)
        }
        const matches = RE.exec(stdout)
        if (matches === null) {
          return reject(new Error('stdout does not match regular expression'))
        }
        const [, key, cert] = matches
        resolve({ cert, key })
      }
    )
  })
