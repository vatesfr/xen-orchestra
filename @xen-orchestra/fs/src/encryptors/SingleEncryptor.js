// @ts-check
/**
 *
 * @typedef {import('node:crypto').Cipheriv} Cipheriv
 * @typedef {import('node:crypto').Decipheriv} Decipheriv
 */
import { AbstractEncryptor, CHACHA20, DEFAULT_ENCRYPTION_ALGORITHM } from './AbstractEncryptor.js'
import assert from 'node:assert'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { readChunkStrict } from '@vates/read-chunk'

export class SingleEncryptor extends AbstractEncryptor {
  /**
   * @type {number}
   */
  #ivLength = 0
  /**
   * @type {number}
   */
  #authTagLength = 0

  /**
   * @type {string}
   */
  #algorithm
  get algorithm() {
    return this.#algorithm
  }
  /**
   * @type {Buffer}
   */
  #key
  get key() {
    return this.#key
  }
  #handler
  get handler() {
    return this.#handler
  }
  /**
   *
   * @param {*} handler
   * @param {string} algorithm
   * @param {Buffer|undefined} key
   * @returns
   */
  constructor(handler, algorithm, key = undefined) {
    super(handler)
    this.#handler = handler
    this.#key = key ?? handler._remote.encryptionKey
    if (!this.#key) {
      this.#algorithm = 'none'
      this.#ivLength = 0
      return
    } else {
      this.#algorithm = algorithm
    }
    const info = crypto.getCipherInfo(algorithm, { keyLength: this.#key.length })
    if (info === undefined) {
      const error = new Error(
        `Either the algorithm ${algorithm} is not available, or the key length ${
          this.#key.length
        } is incorrect. Supported algorithm are ${crypto.getCiphers()}`
      )
      error.code = 'BAD_ALGORITHM'
      throw error
    }
    const { ivLength, mode } = info
    this.#ivLength = ivLength ?? 0
    const authTagLength = ['gcm', 'ccm', 'ocb'].includes(mode) || algorithm === CHACHA20 ? 16 : 0
    this.#authTagLength = authTagLength
  }

  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  async encryptBuffer(buffer) {
    if (this.#algorithm === 'none') {
      return Promise.resolve(buffer)
    }

    const iv = crypto.randomBytes(this.#ivLength)
    const cipher = crypto.createCipheriv(this.#algorithm, Buffer.from(this.#key), iv)
    const encrypted = cipher.update(buffer)
    return Buffer.concat([
      iv,
      encrypted,
      cipher.final(),
      this.#authTagLength > 0 ? cipher.getAuthTag() : Buffer.alloc(0),
    ])
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  async decryptBuffer(buffer) {
    if (this.#algorithm === 'none') {
      return Promise.resolve(buffer)
    }
    const iv = buffer.slice(0, this.#ivLength)
    /**
     * @type {Decipheriv}
     */
    const decipher = crypto.createDecipheriv(this.#algorithm, Buffer.from(this.#key), iv)
    let encrypted
    if (this.#authTagLength > 0) {
      const authTag = buffer.slice(buffer.length - this.#authTagLength)
      decipher.setAuthTag(authTag)
      encrypted = buffer.slice(this.#ivLength, buffer.length - this.#authTagLength)
    } else {
      encrypted = buffer.slice(this.#ivLength)
    }
    const decrypted = decipher.update(encrypted)
    return Buffer.concat([decrypted, decipher.final()])
  }

  /**
   *
   * @param {Readable} input
   * @returns {Promise<Readable>}
   */
  async encryptStream(input) {
    if (this.#algorithm === 'none') {
      return Promise.resolve(input)
    }
    const iv = crypto.randomBytes(this.#ivLength)
    const cipher = crypto.createCipheriv(this.#algorithm, Buffer.from(this.#key), iv)
    const authTagLength = this.#authTagLength
    async function* generator() {
      yield iv
      for await (const data of input) {
        const encrypted = cipher.update(data)
        yield encrypted
      }
      yield cipher.final()
      // must write the auth tag at the end of the encryption stream
      if (authTagLength > 0) {
        yield cipher.getAuthTag()
      }
    }
    return Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
  }

  /**
   *
   * @param {Readable} encryptedStream
   * @returns {Promise<Readable>}
   */
  async decryptStream(encryptedStream) {
    if (this.#algorithm === 'none') {
      return Promise.resolve(encryptedStream)
    }
    const iv = await readChunkStrict(encryptedStream, this.#ivLength)
    const cipher = crypto.createDecipheriv(this.#algorithm, Buffer.from(this.#key), iv)
    const authTagLength = this.#authTagLength
    let authTag = Buffer.alloc(0)

    async function* generator() {
      for await (const data of encryptedStream) {
        // auth tag length is stored at the end of the stream
        // we want to keep it and use at the end to validate the decrypted stream
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
        assert.strictEqual(authTagLength, authTag.length)
        cipher.setAuthTag(authTag)
      }
      yield cipher.final()
    }
    return Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
  }

  #isFsEmpty() {
    return Promise.resolve(true)
  }

  /**
   *
   * @param {Buffer} key
   * @param {string} algorithm
   */
  async updateEncryptionKey(key, algorithm = DEFAULT_ENCRYPTION_ALGORITHM) {
    if (!(await this.#isFsEmpty())) {
      throw new Error(`Can't update the encryption of a non empty remote`)
    }
    this.#algorithm = algorithm
    this.#key = key
    await super.updateEncryptionKey(key, algorithm)
  }
}
