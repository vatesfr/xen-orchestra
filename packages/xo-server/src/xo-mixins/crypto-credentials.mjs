// @ts-check

import { createLogger } from '@xen-orchestra/log'
import { webcrypto, randomBytes } from 'node:crypto'
import * as XenStore from '../_XenStore.mjs'
import fs from 'node:fs/promises'

/** @typedef {import('@vates/types/xo-app').XoApp} XoApp */
/** @typedef {import('../collection/redis.mjs').default} Collection */

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
   * @type {Collection[]}
   */
  #collections = []

  /**
   * @type {webcrypto.CryptoKey | undefined}
   */
  #encryptionKey

  /**
   * @type {webcrypto.CryptoKey | undefined}
   */
  #hmacKey

  /**
   * @type {'encryption'|'decryption'|false}
   */
  #migrationRequired = false

  /**
   * @type {Promise<void> | undefined}
   */
  #migrationLock

  /**
   * @type {boolean}
   */
  #degraded = false

  /**
   * @param {XoApp} app
   */
  constructor(app) {
    this._app = app

    this._app.hooks.on('start core', async () => this.#initialize())

    this._app.hooks.on('start', async () => {
      if (this.#migrationRequired === 'encryption') {
        try {
          await this.#migrateToEncrypted()

          log.info('Encryption keys generation and migration successful')
        } catch (error) {
          this.#degraded = true
          log.error('Credential database migration failed - running in degraded mode', {
            cause: error,
            backupPath: BACKUP_FILE_PATH,
          })
        }
      } else if (this.#migrationRequired === 'decryption') {
        try {
          await this.#migrateToDecrypted()

          log.info('Decryption migration successful')
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

  /**
   * Check if encryption is active, if a migration is needed and load keys.
   */
  async #initialize() {
    /**
     * @type {Buffer | undefined}
     */
    let xenStoreKey, fileKey

    try {
      xenStoreKey = Buffer.from((await XenStore.read(XENSTORE_KEY_PATH)).trim(), 'hex')
    } catch (/** @type {any} */ error) {
      if (!error.stderr?.includes(`couldn't read path`)) throw error
    }

    try {
      fileKey = await fs.readFile(KEY_FILE_PATH)
    } catch (/** @type {any} */ error) {
      if (error.code !== 'ENOENT') throw error
    }

    // Encryption is active, check if both key halves are present.
    // If so, load them to derive the encryption and hmac keys.
    // If not, generate both halves, save them, load them and
    // sets #migrationRequired to require encryption migration.
    if (this._app.config.getOptional('redis.encryptCredentialDatabase') ?? false) {
      this.#degraded = true

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
            this.#migrationRequired = 'encryption'
          }
        } catch (error) {
          XenStore.rm(XENSTORE_KEY_PATH).catch(() => {})
          fs.unlink(KEY_FILE_PATH).catch(() => {})

          log.error('Credential database encryption failed — running in degraded mode', { cause: error })
        }
      }
      // Encryption is inactive, we need to check if any key halves are present.
      // If so, sets #migrationRequired to require decryption migration.
    } else if (fileKey && xenStoreKey) {
      // Load existing keys to enable decryption.
      await this._loadKey(xenStoreKey, fileKey)

      this.#migrationRequired = 'decryption'
    }
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
      log.error('Credential database decryption failed — running in degraded mode', { cause: error })
    }
  }

  /**
   * Encrypts credentials.
   *
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async #encrypt(plaintext) {
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
   * Run the initial encryption process with backup for recovery in case of failure.
   * Holds the migration lock for the entire operation so no concurrent writes can
   * produce encrypted entries while migration is in an intermediate state.
   */
  async #migrateToEncrypted() {
    /**
     * @type {() => void}
     */
    let resolveLock = () => {}
    this.#migrationLock = new Promise(resolve => {
      resolveLock = resolve
    })

    try {
      // Start by collecting all existing redis entries.
      /**
       * @type {Record<string, Record<string, string | null>>}
       */
      const redisContent = {}
      const namespaces = await this._app._redis.sMembers('xo::namespaces')
      for (const namespace of namespaces) {
        redisContent[namespace] = {}
        const ids = await this._app._redis.sMembers('xo:' + namespace + '_ids')
        for (const id of ids) {
          redisContent[namespace][id] = await this._app._redis.get('xo:' + namespace + ':' + id)
        }
      }

      // Write all redis entries in a backup file in case migration fails.
      await fs.writeFile(BACKUP_FILE_PATH, JSON.stringify(redisContent), { mode: 0o400 })

      // Encrypt all plaintext redis entries.
      /**
       * @type {string[]}
       */
      const mSetArgs = []
      for (const namespace in redisContent) {
        for (const id in redisContent[namespace]) {
          const value = redisContent[namespace][id]

          // Check that the entry value is plaintext.
          if (value === null || value.startsWith(ENCRYPTION_PREFIX)) {
            delete redisContent[namespace][id]
            continue
          }

          // Check that the entry still exists.
          if (!(await this._app._redis.sIsMember('xo:' + namespace + '_ids', id))) {
            delete redisContent[namespace][id]
            continue
          }

          mSetArgs.push('xo:' + namespace + ':' + id, await this.#encrypt(value))
        }
      }

      // Write all encrypted values to redis atomically.
      if (mSetArgs.length > 0) {
        await this._app._redis.mSet(mSetArgs)
      }

      // Verify that encrypted content is decryptable
      for (const namespace in redisContent) {
        // Skip namespace if it's empty
        if (Object.keys(redisContent[namespace]).length === 0) continue

        const testedId = Object.keys(redisContent[namespace])[0]
        const testedValue = await this._app._redis.get('xo:' + namespace + ':' + testedId)
        if (testedValue === null || !testedValue.startsWith(ENCRYPTION_PREFIX)) {
          throw new Error(`Missing prefix when checking migrated data, got ${testedValue}`)
        }

        await this.decrypt(testedValue)
      }

      // Rebuild collection indexes to use blind indexes.
      for (const collection of this.#collections) {
        await collection.rebuildIndexes()
      }

      // Delete backup file if the the encryption, verification and index rebuild worked.
      await fs.rm(BACKUP_FILE_PATH)
    } finally {
      resolveLock()
      this.#migrationLock = undefined
    }
  }

  async #migrateToDecrypted() {
    // Start by collecting all existing redis entries.
    /**
     * @type {Record<string, Record<string, string | null>>}
     */
    const redisContent = {}
    const namespaces = await this._app._redis.sMembers('xo::namespaces')
    for (const namespace of namespaces) {
      redisContent[namespace] = {}
      const ids = await this._app._redis.sMembers('xo:' + namespace + '_ids')
      for (const id of ids) {
        redisContent[namespace][id] = await this._app._redis.get('xo:' + namespace + ':' + id)
      }
    }

    // Write all redis entries in a backup file in case migration fails.
    await fs.writeFile(BACKUP_FILE_PATH, JSON.stringify(redisContent), { mode: 0o400 })

    // Decrypt all encrypted redis entries.
    /**
     * @type {string[]}
     */
    const mSetArgs = []
    for (const namespace in redisContent) {
      for (const id in redisContent[namespace]) {
        const value = redisContent[namespace][id]

        // Check that the entry value is plaintext.
        if (value === null || !value.startsWith(ENCRYPTION_PREFIX)) {
          delete redisContent[namespace][id]
          continue
        }

        // Check that the entry still exists.
        if (!(await this._app._redis.sIsMember('xo:' + namespace + '_ids', id))) {
          delete redisContent[namespace][id]
          continue
        }

        mSetArgs.push('xo:' + namespace + ':' + id, await this.decrypt(value))
      }
    }

    // Write all decrypted values to redis atomically.
    if (mSetArgs.length > 0) {
      await this._app._redis.mSet(mSetArgs)
    }

    // Verify that decrypted content has no encryption prefix.
    for (const namespace in redisContent) {
      // Skip namespace if it's empty
      if (Object.keys(redisContent[namespace]).length === 0) continue

      const testedId = Object.keys(redisContent[namespace])[0]
      const testedValue = await this._app._redis.get('xo:' + namespace + ':' + testedId)
      if (testedValue === null || testedValue.startsWith(ENCRYPTION_PREFIX)) {
        throw new Error(`Found prefix when checking migrated data, got ${testedValue}`)
      }
    }

    // Rebuild collection indexes to normal indexes.
    for (const collection of this.#collections) {
      await collection.rebuildIndexes()
    }

    // Delete backup file if the the decryption, verification and index rebuild worked.
    await fs.rm(BACKUP_FILE_PATH)

    // Delete both key halves after successful decryption migration.
    await XenStore.rm(XENSTORE_KEY_PATH)
    await fs.unlink(KEY_FILE_PATH)
  }

  /**
   * @returns {CryptoCredentials | null}
   */
  get cryptoCredentials() {
    return (this._app.config.getOptional('redis.encryptCredentialDatabase') ?? false) ? this : null
  }

  /**
   * Registers the collection for indexe rebuilding
   *
   * @param {Collection} collection
   */
  registerCollection(collection) {
    this.#collections.push(collection)
  }

  /**
   * Computes HMAC blind index.
   *
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async hmacIndex(plaintext) {
    if (!this.#hmacKey) {
      throw new Error('The encryption key needs to be extracted before hmacIndex can be used')
    }

    return Buffer.from(
      await webcrypto.subtle.sign({ name: HMAC_ALGORITHM }, this.#hmacKey, Buffer.from(plaintext))
    ).toString('hex')
  }

  /**
   * Encrypts credentials.
   * All encrypted values have a plaintext prefix string added.
   * Waits for any in-progress migration to complete before encrypting.
   *
   * @param {string} plaintext
   * @returns {Promise<string>}
   */
  async encrypt(plaintext) {
    await this.#migrationLock
    return this.#encrypt(plaintext)
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
}
