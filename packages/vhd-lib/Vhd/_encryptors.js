'use strict'

const crypto = require('crypto')
const secretStore = require('./_secretStore.js')

function getEncryptor(id = '{}') {
  const { algorithm, key, ivLength } = secretStore.get(id)
  if (algorithm === undefined) {
    return {
      id: 'NULL_COMPRESSOR',
      algorithm,
      key,
      ivLength,
      encrypt: buffer => buffer,
      decrypt: buffer => buffer,
    }
  }

  function encrypt(buffer) {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
    const encrypted = cipher.update(buffer)
    return Buffer.concat([iv, encrypted, cipher.final()])
  }

  function decrypt(buffer) {
    const iv = buffer.slice(0, ivLength)
    const encrypted = buffer.slice(ivLength)
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
    const decrypted = decipher.update(encrypted)
    return Buffer.concat([decrypted, decipher.final()])
  }

  return {
    id,
    algorithm,
    key,
    ivLength,
    encrypt,
    decrypt,
  }
}

exports._getEncryptor = getEncryptor
