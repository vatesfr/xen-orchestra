const { pipeline } = require('node:stream')
const { readChunk } = require('@vates/read-chunk')
const crypto = require('crypto')

const CHACHA20 = 'chacha20-poly1305'
const AES256 = 'aes-256-gcm'
export const DEFAULT_ENCRYPTION_ALGORITHM = CHACHA20
export const UNENCRYPTED_ALGORITHM = 'none'
export const SUPPORTED_ALGORITHM = new Set([UNENCRYPTED_ALGORITHM, AES256, CHACHA20, DEFAULT_ENCRYPTION_ALGORITHM])

export function isLegacyEncryptionAlgorithm(algorithm) {
  return algorithm !== UNENCRYPTED_ALGORITHM && algorithm !== DEFAULT_ENCRYPTION_ALGORITHM
}

function getEncrypter(algorithm = DEFAULT_ENCRYPTION_ALGORITHM, key) {
  if (key === undefined) {
    return {
      id: 'NULL_ENCRYPTER',
      algorithm: 'none',
      key: 'none',
      ivLength: 0,
      encryptData: buffer => buffer,
      encryptStream: stream => stream,
      decryptData: buffer => buffer,
      decryptStream: stream => stream,
    }
  }
  const info = crypto.getCipherInfo(algorithm, { keyLength: key.length })
  if (info === undefined) {
    const error = new Error(
      `Either the algorithm ${algorithm} is not available, or the key length ${
        key.length
      } is incorrect. Supported algorithm are ${crypto.getCiphers()}`
    )
    error.code = 'BAD_ALGORITHM'
    throw error
  }
  const { ivLength, mode } = info
  const authTagLength = ['gcm', 'ccm', 'ocb'].includes(mode) || algorithm === CHACHA20 ? 16 : 0

  function encryptStream(input) {
    return pipeline(
      input,
      async function* (source) {
        const iv = crypto.randomBytes(ivLength)
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
        yield iv
        for await (const data of source) {
          yield cipher.update(data)
        }
        yield cipher.final()
        // must write the auth tag at the end of the encryption stream
        if (authTagLength > 0) {
          yield cipher.getAuthTag()
        }
      },
      () => {}
    )
  }

  function decryptStream(encryptedStream) {
    return pipeline(
      encryptedStream,
      async function* (source) {
        /**
         * WARNING
         *
         * the crypted size has an initializtion vector + eventually an auth tag + a padding at the end
         * whe can't predict the decrypted size from the start of the encrypted size
         * thus, we can't set decrypted.length reliably
         *
         */

        const iv = await readChunk(source, ivLength)
        const cipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
        let authTag = Buffer.alloc(0)
        for await (const data of source) {
          if (data.length >= authTagLength) {
            // fast path, no buffer concat
            yield cipher.update(authTag)
            authTag = data.slice(data.length - authTagLength)
            yield cipher.update(data.slice(0, data.length - authTagLength))
          } else {
            // slower since there is a concat
            const fullData = Buffer.concat([authTag, data])
            const fullDataLength = fullData.length
            if (fullDataLength > authTagLength) {
              authTag = fullData.slice(fullDataLength - authTagLength)
              yield cipher.update(fullData.slice(0, fullDataLength - authTagLength))
            } else {
              authTag = fullData
            }
          }
        }
        if (authTagLength > 0) {
          cipher.setAuthTag(authTag)
        }
        yield cipher.final()
      },
      () => {}
    )
  }

  function encryptData(buffer) {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
    const encrypted = cipher.update(buffer)
    return Buffer.concat([iv, encrypted, cipher.final(), authTagLength > 0 ? cipher.getAuthTag() : Buffer.alloc(0)])
  }

  function decryptData(buffer) {
    const iv = buffer.slice(0, ivLength)
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
    let encrypted
    if (authTagLength > 0) {
      const authTag = buffer.slice(buffer.length - authTagLength)
      decipher.setAuthTag(authTag)
      encrypted = buffer.slice(ivLength, buffer.length - authTagLength)
    } else {
      encrypted = buffer.slice(ivLength)
    }
    const decrypted = decipher.update(encrypted)
    return Buffer.concat([decrypted, decipher.final()])
  }

  return {
    id: algorithm,
    algorithm,
    key,
    ivLength,
    encryptData,
    encryptStream,
    decryptData,
    decryptStream,
  }
}

exports._getEncrypter = getEncrypter
