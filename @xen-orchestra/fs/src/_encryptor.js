const { readChunk } = require('@vates/read-chunk')
const crypto = require('crypto')
const pumpify = require('pumpify')

function getEncryptor(key) {
  if (key === undefined) {
    return {
      id: 'NULL_ENCRYPTOR',
      algorithm: 'none',
      key: 'none',
      ivLength: 0,
      encryptData: buffer => buffer,
      encryptStream: stream => stream,
      decryptData: buffer => buffer,
      decryptStream: stream => stream,
    }
  }
  const algorithm = 'aes-256-cbc'
  const ivLength = 16

  function encryptStream(input) {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)

    const encrypted = pumpify(input, cipher)
    encrypted.unshift(iv)
    return encrypted
  }

  async function decryptStream(encryptedStream) {
    const iv = await readChunk(encryptedStream, ivLength)
    const cipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
    /**
     * WARNING
     *
     * the crytped size has an initializtion vector + a padding at the end
     * whe can't predict the decrypted size from the start of the encrypted size
     * thus, we can't set decrypted.length reliably
     *
     */
    return pumpify(encryptedStream, cipher)
  }

  function encryptData(buffer) {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
    const encrypted = cipher.update(buffer)
    return Buffer.concat([iv, encrypted, cipher.final()])
  }

  function decryptData(buffer) {
    const iv = buffer.slice(0, ivLength)
    const encrypted = buffer.slice(ivLength)
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
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

exports._getEncryptor = getEncryptor
