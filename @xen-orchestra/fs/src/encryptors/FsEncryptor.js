// @ts-check
/**
 * @typedef {import('node:stream').Readable} Readable
 */
import { AbstractEncryptor } from './AbstractEncryptor.js'
import { RollingEncryptor } from './RollingEncryptor.js'
import { SingleEncryptor } from './SingleEncryptor.js'

export class FsEncryptor extends AbstractEncryptor {
  #handler
  /**
   * @type {SingleEncryptor| RollingEncryptor|undefined}
   */
  #encryptor
  get encryptor(){
    if(this.#encryptor === undefined){
        throw new Error("Can't access encryptor before init")
    }
    return this.#encryptor
    }

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
    const { algorithm, updateMode } = await this.getEncryptionMetadata()
    console.log('received', { algorithm, updateMode })
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
    // check if 
    await encryptor.check()
    console.log(('CHECK OK ', { algorithm, updateMode }))
    this.#encryptor = encryptor
  }

  /**
   *
   * @param {Buffer} key
   * @param {string} algorithm
   * @returns
   */

  updateEncryptionKey(key, algorithm) {
    return this.encryptor.updateEncryptionKey(key, algorithm)
  }


  updateEncryptionMetadata() {
    return this.encryptor.updateEncryptionMetadata()
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  encryptBuffer(buffer) {
    return this.encryptor.encryptBuffer(buffer)
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  decryptBuffer(buffer) {
    return this.encryptor.decryptBuffer(buffer)
  }
  /**
   *
   * @param {Readable} stream
   * @returns {Readable}
   */
  encryptStream(stream) {
    return this.encryptor.encryptStream(stream)
  }
  /**
   *
   * @param {Readable} stream
   * @returns {Readable}
   */
  decryptStream(stream) {
    return this.encryptor.decryptStream(stream)
  }
}
