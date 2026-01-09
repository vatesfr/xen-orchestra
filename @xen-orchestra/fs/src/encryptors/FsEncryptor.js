// @ts-check

import { AbstractEncryptor } from './AbstractEncryptor.js'
import { RollingEncryptor } from './RollingEncryptor.js'
import { SingleEncryptor } from './SingleEncryptor.js'

export class FsEncryptor extends AbstractEncryptor {
  #handler
  /**
   * @type {AbstractEncryptor|undefined}
   */
  #encryptor

  /**
   *
   * @param {*} handler
   */
  constructor(handler) {
    super(handler)
    this.#handler = handler
  }

  async init() {
    await super.init()
    const { algorithm, updateMode } = await this.getAlgorithm()
    let encryptor
    switch (updateMode) {
      case 'rolling': {
        const currentEncryptor = new SingleEncryptor(this.#handler, algorithm)
        encryptor = new RollingEncryptor(currentEncryptor)
        break
      }
      case 'single':
        encryptor = new SingleEncryptor(this.#handler, algorithm)
        break
      default:
        throw new Error(`remote encryption mode ${updateMode} is not supported`)
    }
    await encryptor.init()
    await encryptor.check(algorithm)
    this.#encryptor = encryptor
  }

  /**
   *
   * @param {Buffer} key
   * @param {string} algorithm
   * @returns
   */

  updateEncryptionKey(key, algorithm) {
    return this.#encryptor.updateEncryptionKey(key, algorithm)
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  encryptBuffer(buffer) {
    return this.#encryptor.encryptBuffer(buffer)
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  decryptBuffer(buffer) {
    return this.#encryptor.decryptBuffer(buffer)
  }
  /**
   *
   * @param {Readable} stream
   * @returns {Promise<Readable>}
   */
  encryptStream(stream) {
    return this.#encryptor.encryptStream(stream)
  }
  /**
   *
   * @param {Readable} stream
   * @returns {Promise<Readable>}
   */
  decryptStream(stream) {
    return this.#encryptor.decryptStream(stream)
  }
}
