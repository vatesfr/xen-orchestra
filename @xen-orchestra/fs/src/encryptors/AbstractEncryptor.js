// @ts-check
/**
 * @typedef {import('node:stream').Readable} Readable
 */
import { randomUUID } from 'crypto'
import { createLogger } from '@xen-orchestra/log'

export const CHACHA20 = 'chacha20-poly1305'
export const AES256 = 'aes-256-gcm'
export const DEFAULT_ENCRYPTION_ALGORITHM = CHACHA20
export const UNENCRYPTED_ALGORITHM = 'none'
export const SUPPORTED_ALGORITHM = new Set([UNENCRYPTED_ALGORITHM, AES256, CHACHA20, DEFAULT_ENCRYPTION_ALGORITHM])

export const DEFAULT_UPDATE_MODE = 'single'
export const ENCRYPTION_DESC_FILENAME = '/encryption.json'
export const ENCRYPTION_METADATA_FILENAME = '/metadata.json'

const { warn } = createLogger('xo:fs:encryptor:abstract')
export class AbstractEncryptor {
  #handler

  constructor(handler) {
    this.#handler = handler
  }
  /**
   * @returns {Promise<void>}
   */
  async init() {}
  /**
   * @param {Readable} stream
   * @returns {Promise<Readable>}
   */
  encryptStream(stream) {
    throw new Error('not implemented')
  }
  /**
   * @param {Readable}  stream
   * @returns {Promise<Readable>}
   */
  decryptStream(stream) {
    throw new Error('not implemented')
  }

  /**
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  encryptBuffer(buffer) {
    throw new Error('not implemented')
  }

  /**
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  decryptBuffer(buffer) {
    throw new Error('not implemented')
  }

  /**
   * @param {Buffer} key
   * @param {string} algorithm
   * @returns {Promise<void>}
   */
  async updateEncryptionKey(key, algorithm) {
    await Promise.all([
      // this one is not encrypted,but only contains the algorithm
      this.#handler._writeFile(ENCRYPTION_DESC_FILENAME, JSON.stringify({ algorithm }), {
        flags: 'w',
      }),
      // this one is encrypted and used as an encryption test
      this.#handler.__writeFile(ENCRYPTION_METADATA_FILENAME, `{"random":"${randomUUID()}"}`, { flags: 'w' }),
    ])
  }

  /**
   *
   * @param {string} algorithm
   */
  async check(algorithm) {
    try {
      const encryptedRawData = await this.#handler._readFile(ENCRYPTION_METADATA_FILENAME)
      const decrypted = (await this.decryptBuffer(encryptedRawData)).toString()
      JSON.parse(decrypted)
    } catch (error) {
      if (error.code !== 'ENOENT' || algorithm !== 'none') {
        warn(
          `The encryptionKey settings of this remote does not match the key used to create it. You won't be able to read any data from this remote`,
          { error }
        )
        // will probably send a ERR_OSSL_EVP_BAD_DECRYPT if key is incorrect
        throw error
      }
    }
  }

  /**
   *
   * @returns {Promise<{algorithm:string, updateMode: string}>}
   */
  async getAlgorithm() {
    try {
      // read file unencrypted
      const data = await this.#handler._readFile(ENCRYPTION_DESC_FILENAME)
      const json = JSON.parse(data)
      return { algorithm: json.algorithm, updateMode: json.updateMode }
    } catch (error) {
      if (error.code === 'ENOENT' && !this.#handler._remote.encryptionKey) {
        return { algorithm: 'none', updateMode: DEFAULT_UPDATE_MODE }
      }
      throw error
    }
  }
}
