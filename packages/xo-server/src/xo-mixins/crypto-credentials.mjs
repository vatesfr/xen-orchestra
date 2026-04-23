// @ts-check

import { createLogger } from '@xen-orchestra/log'
import { webcrypto, randomBytes } from 'node:crypto'
import * as XenStore from '../_XenStore.mjs'
import fs from 'fs-extra'

const XENSTORE_KEY_PATH = 'vm-data/xo-encryption-key'
const KEY_FILE_PATH = '/var/lib/xo-server/data/xo-encryption-key'
const BACKUP_FILE_PATH = '/var/lib/xo-server/data/pre-encryption-backup.json'

const CIPHER_ALGORITHM = 'AES-GCM'
const HASH_ALGORITHM = 'SHA-256'
const KDF_ALGORITHM = 'HKDF'
const HMAC_ALGORITHM = 'HMAC'
const IV_LENGTH = 12

export const ENCRYPTION_PREFIX = 'enc:'

const log = createLogger('xo:crypto-credentials')

export default class CryptoCredentials {
  /**
   * @returns {CryptoCredentials | null}
   */
  get cryptoCredentials() {
    return (this._app.config.getOptional('redis.encryptCredentialDatabase') ?? false) ? this : null
  }

  /**
   * @type {webcrypto.CryptoKey | undefined}
   */
  #encryptionKey

  /**
   * Reserved for spec 2
   * @type {webcrypto.CryptoKey | undefined}
   */
  #hmacKey

  /**
   * @type {boolean}
   */
  #migrationRequired = false

  /**
   * @type {boolean}
   */
  #degraded = false

  /**
   * @param {any} app
   */
  constructor(app) {
    this._app = app

    this._app.hooks.on('start core', () => {
      if (app.config.getOptional('redis.encryptCredentialDatabase') ?? false) {
        return this.initialize()
      }
    })

    this._app.hooks.on('start', async () => {
      if (this.#migrationRequired) {
        try {
          await this._migrateToEncrypted()
        } catch (error) {
          this.#degraded = true
          log.error('Credential database migration failed - running in degraded mode', {
            cause: error,
            backupPath: BACKUP_FILE_PATH,
          })
        }
      }
    })
  }

  async initialize() {
    const readOrUndefined = async (/** @type () => Promise<Buffer | undefined> */ fn) => {
      try {
        return await fn()
      } catch {
        return undefined
      }
    }

    this.#degraded = true

    /** @type {Buffer | undefined} */
    let xenStoreKey, fileKey

    xenStoreKey = await readOrUndefined(async () => Buffer.from((await XenStore.read(XENSTORE_KEY_PATH)).trim(), 'hex'))
    fileKey = await readOrUndefined(() => fs.readFile(KEY_FILE_PATH))

    if (xenStoreKey && fileKey) {
      await this._loadKey(xenStoreKey, fileKey)
    } else {
      xenStoreKey = randomBytes(32)
      fileKey = randomBytes(32)

      try {
        await XenStore.write(XENSTORE_KEY_PATH, xenStoreKey.toString('hex'))
        await fs.writeFile(KEY_FILE_PATH, fileKey, { mode: 0o400 })

        await this._loadKey(xenStoreKey, fileKey)

        if (!this.#degraded) {
          this.#migrationRequired = true
        }
      } catch (error) {
        XenStore.rm(XENSTORE_KEY_PATH).catch(() => {})
        fs.unlink(KEY_FILE_PATH).catch(() => {})

        log.error('Credential database encryption failed — running in degraded mode', { cause: error })
      }
    }
  }

  /**
   * Encrypts credentials.
   * All encrypted values have a plaintext prefix string added.
   *
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async encrypt(plaintext) {
    if (!this.#encryptionKey) {
      throw new Error('The encryption key needs to be extracted before encrypt can be used')
    }

    const iv = randomBytes(IV_LENGTH)

    const ciphertext = await webcrypto.subtle.encrypt(
      { name: CIPHER_ALGORITHM, iv },
      this.#encryptionKey,
      Buffer.from(plaintext)
    )

    return ENCRYPTION_PREFIX + Buffer.concat([iv, Buffer.from(ciphertext)]).toString('base64')
  }

  /**
   * Decrypts credentials.
   * All encrypted values have a plaintext prefix string,
   * only decrypt if the prefix is present.
   *
   * @param {string} value
   * @returns {Promise<string>}
   */
  async decrypt(value) {
    if (!value.startsWith(ENCRYPTION_PREFIX)) {
      return value
    }
    value = value.slice(ENCRYPTION_PREFIX.length)

    if (!this.#encryptionKey) {
      throw new Error('The encryption key needs to be extracted before decrypt can be used')
    }

    const buf = Buffer.from(value, 'base64')
    const iv = buf.subarray(0, IV_LENGTH)
    const ciphertext = buf.subarray(IV_LENGTH)

    return Buffer.from(
      await webcrypto.subtle.decrypt({ name: CIPHER_ALGORITHM, iv }, this.#encryptionKey, ciphertext)
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
  async _migrateToEncrypted() {
    /**
     * Redis content to be backuped then encrypted
     * @type {Record<string, Record<string, string | null>>}
     */
    const redisContent = {}

    /** @type {string[]} */
    const namespaces = await this._app._redis.sMembers('xo::namespaces')
    for (const namespace of namespaces) {
      redisContent[namespace] = {}

      /** @type {string[]} */
      const ids = await this._app._redis.sMembers('xo:' + namespace + '_ids')

      for (const id of ids) {
        /** @type {string} */
        const value = await this._app._redis.get('xo:' + namespace + ':' + id)

        redisContent[namespace][id] = value
      }
    }

    // Write backup file
    await fs.writeFile(BACKUP_FILE_PATH, JSON.stringify(redisContent), { mode: 0o400 })

    // Encrypt content then write to redis
    for (const namespace in redisContent) {
      for (const id in redisContent[namespace]) {
        if (redisContent[namespace][id] != null && !redisContent[namespace][id].startsWith(ENCRYPTION_PREFIX)) {
          await this._app._redis.set('xo:' + namespace + ':' + id, await this._app.encrypt(redisContent[namespace][id]))
        }
      }
    }

    // Check that encrypted content is decryptable
    for (const namespace in redisContent) {
      // Skip namespace if it's empty
      if (Object.keys(redisContent[namespace]).length === 0) continue

      const testedId = Object.keys(redisContent[namespace])[0]
      // Skip namespace if first entry returns null
      if (redisContent[namespace][testedId] === null) continue

      const testedValue = await this._app._redis.get('xo:' + namespace + ':' + testedId)
      if (!testedValue.startsWith(ENCRYPTION_PREFIX)) {
        throw new Error(`Missing prefix when checking migrated data, got ${testedValue}`)
      }

      await this._app.decrypt(testedValue)
    }

    // Delete backup file if the verification has not thrown
    await fs.rm(BACKUP_FILE_PATH)
  }

  /**
   * Derives the encryption and hmac keys from the xenStore and file keys.
   * @param {Buffer} halfA
   * @param {Buffer} halfB
   */
  async _loadKey(halfA, halfB) {
    try {
      const fullKey = Buffer.concat([halfA, halfB])
      // Input key material
      const ikm = await webcrypto.subtle.importKey('raw', fullKey, KDF_ALGORITHM, false, ['deriveKey'])

      // Memory safety
      halfA.fill(0)
      halfB.fill(0)
      fullKey.fill(0)

      this.#encryptionKey = await webcrypto.subtle.deriveKey(
        { name: KDF_ALGORITHM, hash: HASH_ALGORITHM, salt: new Uint8Array(0), info: Buffer.from('xo-credentials-aes') },
        ikm,
        { name: CIPHER_ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
      )

      this.#hmacKey = await webcrypto.subtle.deriveKey(
        {
          name: KDF_ALGORITHM,
          hash: HASH_ALGORITHM,
          salt: new Uint8Array(0),
          info: Buffer.from('xo-credentials-hmac'),
        },
        ikm,
        { name: HMAC_ALGORITHM, hash: HASH_ALGORITHM },
        false,
        ['sign', 'verify']
      )

      this.#degraded = false
    } catch (error) {
      log.error('Credential database decryption failed — running in degraded mode', { error })
    }
  }
}
