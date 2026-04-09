// @ts-check

import { createLogger } from '@xen-orchestra/log'
import { webcrypto, randomBytes } from 'node:crypto'

const log = createLogger('xo:crypto-credentials')

export default class CryptoCredentials {
  /**
   * @type {webcrypto.CryptoKey | undefined}
   */
  #encryptionKey

  /**
   * @type {webcrypto.CryptoKey | undefined}
   */
  #hmacKey

  /**
   * @type {boolean}
   */
  #degraded = true

  /**
   * @param {unknown} app
   */
  constructor(app) {
    this._app = app
  }

  async initialize() {}

  /**
   * Encrypts credentials.
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async encrypt(plaintext) {
    if (!this.#encryptionKey) {
      throw new Error('The encryption key needs to be extracted before encypt can be used')
    }

    const iv = randomBytes(12)

    const ciphertext = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.#encryptionKey,
      Buffer.from(plaintext)
    )

    return Buffer.concat([iv, Buffer.from(ciphertext)]).toString('base64')
  }

  /**
   * Decrypts credentials.
   * @param {string} blob
   * @returns {Promise<string>}
   */
  async decrypt(blob) {
    if (!this.#encryptionKey) {
      throw new Error('The encryption key needs to be extracted before decypt can be used')
    }

    const buf = Buffer.from(blob, 'base64')
    const iv = buf.subarray(0, 12)
    const ciphertext = buf.subarray(12)

    return Buffer.from(
      await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.#encryptionKey, ciphertext)
    ).toString('utf8')
  }

  /**
   * Is XO running in degraded mode due to decryption fail.
   * @returns {boolean}
   */
  isDegraded() {
    return this.#degraded
  }

  /**
   * Run the initial encryption process with backup for recovery in case of failure.
   */
  async _migrateToEncrypted() {}

  /**
   * Derives the encryption and hmac keys from the xenstore and file keys.
   * @param {Buffer} halfA
   * @param {Buffer} halfB
   */
  async _loadKey(halfA, halfB) {
    try {
      // Input key material
      const ikm = await webcrypto.subtle.importKey('raw', Buffer.concat([halfA, halfB]), 'HKDF', false, ['deriveKey'])

      this.#encryptionKey = await webcrypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: Buffer.from('xo-credentials-aes') },
        ikm,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )

      this.#hmacKey = await webcrypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: Buffer.from('xo-credentials-hmac') },
        ikm,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      )

      this.#degraded = false
    } catch (error) {
      log.error('Credential database decryption failed — running in degraded mode', { error })
    }
  }
}
