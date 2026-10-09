// @ts-check

// Docker engine records (see `DockerEngineRecord` in `docker-engine.mjs`): field
// lists, validation and the application of API properties, as pure functions
// (no `app`, no I/O), used by `xo-mixins/docker.mjs`.

import { randomBytes } from 'node:crypto'
import { HOST_KEY_TYPES, parseFingerprint } from '@xen-orchestra/docker-ssh'
import { invalidParameters, objectAlreadyExists } from 'xo-common/api-errors.js'

export const DEFAULT_SOCKET_PATH = '/var/run/docker.sock'
export const DEFAULT_SSH_PORT = 22

const FINGERPRINT_RE = /^SHA256:[A-Za-z0-9+/]{43}$/

// public property → stored property
const WRITABLE_FIELDS = new Map([
  ['$VM', 'vm'],
  ['label', 'label'],
  ['host', 'host'],
  ['port', 'port'],
  ['username', 'username'],
  ['password', 'password'],
  ['privateKey', 'privateKey'],
  ['passphrase', 'passphrase'],
  ['socketPath', 'socketPath'],
  ['hostKeyFingerprint', 'hostKeyFingerprint'],
])
const TRANSIENT_FIELDS = new Set(['acceptUnknownHostKey'])
const STRING_FIELDS = ['vm', 'label', 'host', 'username', 'password', 'privateKey', 'passphrase', 'socketPath']

// stored properties which change the SSH connection itself: an update changing
// one of them (or the address resolved from the VM) connects first, and is only
// saved on success
export const CONNECTION_FIELDS = [
  'host',
  'port',
  'username',
  'password',
  'privateKey',
  'passphrase',
  'socketPath',
  'hostKeyFingerprint',
  'hostKeyAlgorithm',
]

// stored properties which change how to connect: changing any of them bumps the
// revision, which invalidates the pooled connection and the caches
export const IDENTITY_FIELDS = ['vm', ...CONNECTION_FIELDS]

// in the key of the pooled connection, see `#connectionKey()` in the mixin: not the host key,
// a change of it bumps the revision anyway, except for the pinning of an
// accepted unknown key, which must keep the connection which accepted it
export const KEYED_FIELDS = CONNECTION_FIELDS.filter(key => key !== 'hostKeyFingerprint' && key !== 'hostKeyAlgorithm')

// stored properties accepted by the config import, see `parseImportedEngines()`
const STORED_FIELDS = new Set([...WRITABLE_FIELDS.values(), 'hostKeyAlgorithm', 'revision'])

// pin a host key into the record (mutated, not saved)
export function setHostKey(record, { fingerprint, algorithm }) {
  record.hostKeyFingerprint = fingerprint
  if (algorithm === undefined) {
    delete record.hostKeyAlgorithm
  } else {
    record.hostKeyAlgorithm = algorithm
  }
}

// unique, never reused: two different identities never share a revision
export const newRevision = () => randomBytes(8).toString('hex')

// stored properties exposed as is by the API, secrets are NEVER in this list
export const PUBLIC_FIELDS = [
  'label',
  'host',
  'port',
  'username',
  'socketPath',
  'hostKeyFingerprint',
  'hostKeyAlgorithm',
]

export function validateRecord(record) {
  for (const key of STRING_FIELDS) {
    if (record[key] !== undefined && typeof record[key] !== 'string') {
      throw invalidParameters(`${key === 'vm' ? '$VM' : key} must be a string`)
    }
  }
  if (record.username === undefined || record.username === '') {
    throw invalidParameters('username is required')
  }
  if (record.password === undefined && record.privateKey === undefined) {
    throw invalidParameters('a password or a private key is required')
  }
  if (record.vm === undefined && record.host === undefined) {
    throw invalidParameters('host is required when the engine is not attached to a VM')
  }
  if (!Number.isInteger(record.port) || record.port < 1 || record.port > 65535) {
    throw invalidParameters('port must be an integer between 1 and 65535')
  }
  if (!record.socketPath.startsWith('/') || record.socketPath.includes('\0')) {
    throw invalidParameters('socketPath must be an absolute path')
  }
  if (record.hostKeyFingerprint !== undefined && !FINGERPRINT_RE.test(record.hostKeyFingerprint)) {
    throw invalidParameters('hostKeyFingerprint must be a SHA256 fingerprint, as printed by ssh-keygen -l')
  }
  if (record.hostKeyAlgorithm !== undefined && !HOST_KEY_TYPES.has(record.hostKeyAlgorithm)) {
    throw invalidParameters(`hostKeyAlgorithm must be one of ${Array.from(HOST_KEY_TYPES).join(', ')}`)
  }
}

/**
 * Apply API properties to a stored record (mutated).
 *
 * - omitted (`undefined`) properties are kept, `null` or `''` clears them
 *   (resets `port` and `socketPath` to their defaults); clearing `privateKey`
 *   also clears `passphrase`
 * - `hostKeyFingerprint` may be a whole `ssh-keygen -l` line
 */
export function applyProperties(record, properties) {
  for (const key of Object.keys(properties)) {
    if (!WRITABLE_FIELDS.has(key) && !TRANSIENT_FIELDS.has(key)) {
      throw invalidParameters(`unknown property ${key}`)
    }
  }
  for (const [publicKey, key] of WRITABLE_FIELDS) {
    const value = properties[publicKey]
    if (value === undefined) {
      continue
    }
    if (value === null || value === '') {
      if (key === 'port') {
        record.port = DEFAULT_SSH_PORT
      } else if (key === 'socketPath') {
        record.socketPath = DEFAULT_SOCKET_PATH
      } else {
        delete record[key]
        if (key === 'hostKeyFingerprint') {
          delete record.hostKeyAlgorithm
        } else if (key === 'privateKey') {
          // the passphrase of a removed key is meaningless
          delete record.passphrase
        }
      }
      continue
    }
    if (key === 'hostKeyFingerprint') {
      if (typeof value !== 'string') {
        throw invalidParameters('hostKeyFingerprint must be a string')
      }
      // a whole `ssh-keygen -l` line gives the type of the key
      const { fingerprint, algorithm } = parseFingerprint(value)
      if (fingerprint !== record.hostKeyFingerprint || algorithm !== undefined) {
        setHostKey(record, { fingerprint, algorithm })
      }
      continue
    }
    record[key] = value
  }
  if (properties.acceptUnknownHostKey !== undefined && typeof properties.acceptUnknownHostKey !== 'boolean') {
    throw invalidParameters('acceptUnknownHostKey must be a boolean')
  }
}

/**
 * Validate a config import (`addConfigManager`): every record is checked
 * before anything is written, and gets a new revision (nothing cached for the
 * previous parameters is reused).
 *
 * Only checks the import itself (e.g. two engines on the same VM in it), not
 * against the stored engines.
 *
 * @param {unknown} engines
 * @returns {{ ids: Set<string>, vms: Map<string, string>, records: object[] }} `vms`: VM id → engine id
 */
export function parseImportedEngines(engines) {
  if (!Array.isArray(engines)) {
    throw invalidParameters('dockerEngines must be an array')
  }
  const ids = new Set()
  const vms = new Map()
  const records = engines.map(engine => {
    if (engine === null || typeof engine !== 'object' || typeof engine.id !== 'string' || engine.id === '') {
      throw invalidParameters('each Docker engine must be an object with an id')
    }
    const { id, ...properties } = engine
    for (const key of Object.keys(properties)) {
      if (!STORED_FIELDS.has(key)) {
        throw invalidParameters(`Docker engine ${id}: unknown property ${key}`)
      }
    }
    if (ids.has(id)) {
      throw invalidParameters(`Docker engine ${id} is present twice`)
    }
    ids.add(id)
    const record = { port: DEFAULT_SSH_PORT, socketPath: DEFAULT_SOCKET_PATH, ...properties }
    try {
      if (typeof record.hostKeyFingerprint === 'string') {
        const { fingerprint, algorithm } = parseFingerprint(record.hostKeyFingerprint)
        record.hostKeyFingerprint = fingerprint
        record.hostKeyAlgorithm ??= algorithm
        if (record.hostKeyAlgorithm === undefined) {
          delete record.hostKeyAlgorithm
        }
      }
      validateRecord(record)
    } catch (error) {
      error.message = `Docker engine ${id}: ${error.message}`
      throw error
    }
    if (record.vm !== undefined) {
      if (vms.has(record.vm)) {
        throw objectAlreadyExists({ objectId: vms.get(record.vm), objectType: 'docker-engine' })
      }
      vms.set(record.vm, id)
    }
    // a new revision: nothing cached for the previous parameters is reused
    return { ...record, id, revision: newRevision() }
  })
  return { ids, vms, records }
}
