'use strict'

const { dirname } = require('node:path')
const { mkdir, readFile, writeFile, unlink } = require('node:fs/promises')
const { X509Certificate } = require('node:crypto')

const { genSelfSignedCert } = require('./index.js')

const identity = value => value

const noop = Function.prototype

async function outputFile(path, content, mode) {
  for (let attempt = 0; attempt < 5; ++attempt) {
    try {
      return await writeFile(path, content, { mode })
    } catch (error) {
      const { code } = error
      if (code === 'ENOENT') {
        await mkdir(dirname(path), { mode, recursive: true })
      } else if (code === 'EACCES') {
        await unlink(path)
      } else {
        throw error
      }
    }
  }
}

exports.readCert = async function readCert(
  certPath,
  keyPath,
  {
    autoCert = false,
    use = identity,
    info = noop,
    mode = 0o400,
    warn = noop,

    ...opts
  }
) {
  let useError = false

  try {
    const cert = await readFile(certPath)

    if (autoCert) {
      const x509 = new X509Certificate(cert)

      const now = Date.now()
      if (now < Date.parse(x509.validFrom) || now > Date.parse(x509.validTo)) {
        const e = new Error('certificate is not valid')

        // same code used when attempting to connect to a server with an expired certificate
        e.code = 'CERT_HAS_EXPIRED'

        throw e
      }
    }

    const key = await readFile(keyPath)

    useError = true
    return await use({ cert, key })
  } catch (error) {
    // only regen if not a use error or if the use error was ERR_SSL_EE_KEY_TOO_SMALL
    if (!(autoCert && (!useError || error.code === 'ERR_SSL_EE_KEY_TOO_SMALL'))) {
      throw error
    }
    warn(error)

    const { cert, key } = await genSelfSignedCert(opts)

    info('new certificate generated', { cert, key })

    await Promise.all([outputFile(certPath, cert, mode).catch(warn), outputFile(keyPath, key, mode).catch(warn)])

    return use({ cert, key })
  }
}
