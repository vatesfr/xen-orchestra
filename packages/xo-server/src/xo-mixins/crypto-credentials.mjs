// @ts-check

import { createLogger } from '@xen-orchestra/log'
import { webcrypto, randomBytes } from 'node:crypto'
import * as XenStore from '../_XenStore.mjs'
import fs from 'node:fs/promises'

/** @typedef {import('@vates/types/xo-app').XoApp} XoApp */

const XENSTORE_KEY_PATH = 'vm-data/xo-encryption-key'
const KEY_FILE_PATH = '/var/lib/xo-server/data/xo-encryption-key'
const BACKUP_FILE_PATH = '/var/lib/xo-server/data/encryption-backup.json'

const CIPHER_ALGORITHM = 'AES-GCM'
const HASH_ALGORITHM = 'SHA-256'
const KDF_ALGORITHM = 'HKDF'
const HMAC_ALGORITHM = 'HMAC'
const IV_LENGTH = 12

export const ENCRYPTION_PREFIX = 'enc:'

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
   * @type {typeof XenStore}
   */
  #xenStore

  /**
   * @type {typeof fs}
   */
  #fs

  /**
   * XenStore and fs are injected here to allow unit tests to provide mocks
   *
   * @param {XoApp} app
   * @param {{ xenStore?: typeof XenStore, fsPromises?: typeof fs }} [deps]
   */
  constructor(app, { xenStore = XenStore, fsPromises = fs } = {}) {
    this._app = app

    this.#xenStore = xenStore
    this.#fs = fsPromises

    this._app.hooks.on('start core', async () => {
      await this.#initialize()

      if (this.#migrationRequired === 'encryption') {
        const backupFilePath = await this.#getBackupFilePath()
        try {
          await this.#migrateToEncrypted(backupFilePath)

          log.info('Encryption keys generation and migration successful')
        } catch (error) {
          this.#degraded = true
          log.error('Credential database migration failed - running in degraded mode', {
            cause: error,
            backupPath: backupFilePath,
          })
        }
      } else if (this.#migrationRequired === 'decryption') {
        const backupFilePath = await this.#getBackupFilePath()
        try {
          await this.#migrateToDecrypted(backupFilePath)

          log.info('Decryption migration successful')
        } catch (error) {
          this.#degraded = true
          log.error('Credential database migration failed - running in degraded mode', {
            cause: error,
            backupPath: backupFilePath,
          })
        }
      }
    })
  }

  async #getBackupFilePath() {
    try {
      await this.#fs.access(BACKUP_FILE_PATH)
    } catch {
      return BACKUP_FILE_PATH
    }

    for (let i = 1; ; i++) {
      const path = BACKUP_FILE_PATH.replace('.json', `_${i}.json`)
      try {
        await this.#fs.access(path)
      } catch {
        return path
      }
    }
  }

  /**
   * Reads the XenStore key, handling both "key missing" and "xenTools unavailable" cases.
   * Returns the key Buffer, undefined if the key path doesn't exist in xenstore,
   * or null if xen-tools are unavailable (already logged and #degraded set).
   *
   * @param {string} context - short description used in the error log if xen-tools are unavailable
   * @returns {Promise<Buffer | null | undefined>}
   */
  async #readXenStoreKey(context) {
    try {
      return Buffer.from((await this.#xenStore.read(XENSTORE_KEY_PATH)).trim(), 'hex')
    } catch (/** @type {any} */ error) {
      if (error.code === 'ENOENT') {
        this.#degraded = true
        log.error(`Xenstore tools not available, ${context} - running in degraded mode`, { cause: error })

        return null
      } else if (!error.message?.includes(`couldn't read path`)) {
        throw error
      }

      return undefined
    }
  }

  /**
   * Check if encryption is active, if an encryption or decryption migration is needed and load keys.
   * Read from xenStore only when encryption is active, or when a fileKey exists
   * and a decryption migration is needed.
   */
  async #initialize() {
    /**
     * @type {Buffer | null | undefined}
     */
    let xenStoreKey, fileKey

    try {
      fileKey = await this.#fs.readFile(KEY_FILE_PATH)
    } catch (/** @type {any} */ error) {
      if (error.code !== 'ENOENT') throw error
    }

    const encryptionEnabled = this._app.config.getOptional('redis.encryptCredentialDatabase') ?? false

    // Nothing to do: no encrypted data and no migration needed
    if (!encryptionEnabled && fileKey === undefined) return

    // Pessimistic guard; _loadKey resets #degraded to false on success
    this.#degraded = true

    // Encryption is active, check if both key halves are present.
    // If so, load them to derive the encryption and hmac keys.
    // If not, generate both halves, save them, load them and
    // set #migrationRequired to require encryption migration.
    if (encryptionEnabled) {
      xenStoreKey = await this.#readXenStoreKey(
        fileKey !== undefined ? 'credential database decryption failed' : 'credential database encryption failed'
      )
      // encryption enabled and migration has been done but no xenTools unavailable, #degraded set to true .
      if (xenStoreKey === null) return

      if (xenStoreKey !== undefined && fileKey !== undefined) {
        await this._loadKey(xenStoreKey, fileKey)
      } else {
        xenStoreKey = randomBytes(32)
        fileKey = randomBytes(32)

        try {
          await this.#xenStore.write(XENSTORE_KEY_PATH, xenStoreKey.toString('hex'))
          await this.#fs.writeFile(KEY_FILE_PATH, fileKey, { mode: 0o400 })

          await this._loadKey(xenStoreKey, fileKey)

          if (!this.#degraded) {
            this.#migrationRequired = 'encryption'
          }
        } catch (error) {
          await this.#xenStore.rm(XENSTORE_KEY_PATH).catch(() => {})
          await this.#fs.unlink(KEY_FILE_PATH).catch(() => {})

          log.error('Credential database encryption failed - running in degraded mode', { cause: error })
        }
      }
      // Encryption is inactive, we need to check if any key halves are present.
      // If so, set #migrationRequired to require decryption migration.
    } else if (fileKey !== undefined) {
      xenStoreKey = await this.#readXenStoreKey('credential database decryption failed')
      if (xenStoreKey === null) return

      if (xenStoreKey === undefined) {
        log.error('Only one encryption key half found - running in degraded mode')
        return
      }

      await this._loadKey(xenStoreKey, fileKey)

      if (this.#encryptionKey) {
        this.#migrationRequired = 'decryption'
      } else {
        log.error('Existing key loading failed, decryption migration impossible - running in degraded mode')
      }
    }
  }

  /**
   * Derives the encryption and hmac keys from the xenStore and file keys.
   *
   * @param {Buffer} halfA
   * @param {Buffer} halfB
   */
  async _loadKey(halfA, halfB) {
    const fullKey = Buffer.concat([halfA, halfB])
    try {
      // Input key material
      const ikm = await webcrypto.subtle.importKey('raw', fullKey, KDF_ALGORITHM, false, ['deriveKey'])

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
      log.error('Credential database decryption failed - running in degraded mode', { cause: error })
    } finally {
      // Memory safety
      halfA.fill(0)
      halfB.fill(0)
      fullKey.fill(0)
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
   *
   * Indexes are automatically rebuilt for each collection after the migration
   * through the clean hook which runs just after the start hook.
   *
   * @param {string} backupFilePath
   */
  async #migrateToEncrypted(backupFilePath) {
    /**
     * @type {() => void}
     */
    let resolveLock = () => {}
    this.#migrationLock = new Promise(resolve => {
      resolveLock = resolve
    })

    try {
      // Start by collecting all existing redis entries.
      const redisContent = await this.#getRedisContent()

      // Write all redis entries in a backup file in case migration fails.
      await this.#fs.writeFile(backupFilePath, JSON.stringify(redisContent), { mode: 0o400 })

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

      // Delete backup file if the the encryption and verification worked.
      await this.#fs.rm(backupFilePath)
    } finally {
      resolveLock()
      this.#migrationLock = undefined
    }
  }

  /**
   * Run the decryption process of an encrypted redis with backup for recovery
   * in case of failure.
   *
   * Indexes are automatically rebuilt for each collection after the migration
   * through the clean hook which runs just after the start hook.
   *
   * @param {string} backupFilePath
   */
  async #migrateToDecrypted(backupFilePath) {
    // Start by collecting all existing redis entries.
    const redisContent = await this.#getRedisContent()

    // Write all redis entries in a backup file in case migration fails.
    await this.#fs.writeFile(backupFilePath, JSON.stringify(redisContent), { mode: 0o400 })

    // Decrypt all encrypted redis entries.
    /**
     * @type {string[]}
     */
    const mSetArgs = []
    for (const namespace in redisContent) {
      for (const id in redisContent[namespace]) {
        const value = redisContent[namespace][id]

        // Skip entries that are already plaintext.
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

    // Delete backup file if the the decryption and verification worked.
    await this.#fs.rm(backupFilePath)

    // Delete both key halves after successful decryption migration.
    await this.#xenStore
      .rm(XENSTORE_KEY_PATH)
      .catch((/** @type {any} */ error) => log.warn('Failed to remove XenStore key', { cause: error }))
    await this.#fs
      .unlink(KEY_FILE_PATH)
      .catch((/** @type {any} */ error) => log.warn('Failed to remove key file', { cause: error }))
  }

  /**
   * Collects all existing redis entries
   *
   * @returns {Promise<Record<string, Record<string, string | null>>>}
   */
  async #getRedisContent() {
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

    return redisContent
  }

  /**
   * @returns {CryptoCredentials | null}
   */
  get cryptoCredentials() {
    return (this._app.config.getOptional('redis.encryptCredentialDatabase') ?? false) ? this : null
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
   *
   * @returns {boolean}
   */
  isDegraded() {
    return this.#degraded
  }
}
