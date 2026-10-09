// Pure functions: no redis, no SSH.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters, objectAlreadyExists } from 'xo-common/api-errors.js'

import {
  applyProperties,
  DEFAULT_SOCKET_PATH,
  DEFAULT_SSH_PORT,
  parseImportedEngines,
  validateRecord,
} from './docker-engine-record.mjs'

const FINGERPRINT = 'SHA256:cuhCGsZJgQqGd0EohvOtnSax1uVTj3+/5ZB53nwP/co'
const VM = '5b0b5a4c-6a4b-4e0a-9d8e-2f6f9d8f0a01'

const valid = (props = {}) => ({
  port: DEFAULT_SSH_PORT,
  socketPath: DEFAULT_SOCKET_PATH,
  host: '192.0.2.10',
  username: 'docker',
  password: 'secret',
  ...props,
})

const isInvalid = pattern => error => {
  assert.ok(invalidParameters.is(error), error.message)
  assert.match(error.message, pattern)
  return true
}

describe('validateRecord()', () => {
  it('accepts a complete record', () => {
    validateRecord(valid())
    validateRecord(valid({ host: undefined, vm: VM, hostKeyFingerprint: FINGERPRINT, hostKeyAlgorithm: 'ssh-rsa' }))
  })

  for (const [props, pattern] of [
    [{ username: '' }, /username is required/],
    [{ password: undefined }, /password or a private key/],
    [{ host: undefined }, /host is required/],
    [{ port: 0 }, /port must be/],
    [{ port: '22' }, /port must be/],
    [{ socketPath: 'docker.sock' }, /socketPath must be/],
    [{ socketPath: '/a\0b' }, /socketPath must be/],
    [{ hostKeyFingerprint: 'SHA256:short' }, /hostKeyFingerprint must be/],
    [{ hostKeyAlgorithm: 'ssh-foo' }, /hostKeyAlgorithm must be one of/],
    [{ vm: 1 }, /\$VM must be a string/],
    [{ label: {} }, /label must be a string/],
  ]) {
    it(`refuses ${JSON.stringify(props)}`, () => {
      assert.throws(() => validateRecord(valid(props)), isInvalid(pattern))
    })
  }
})

describe('applyProperties()', () => {
  it('PATCH semantics: undefined keeps, null and empty string clear or reset to the default', () => {
    const record = valid({ port: 2222, socketPath: '/run/docker.sock', privateKey: 'key', passphrase: 'pass' })
    applyProperties(record, { label: 'a', port: null, socketPath: '', privateKey: null, host: undefined })
    assert.deepEqual(record, valid({ label: 'a' }))
  })

  it('maps $VM to vm, and a whole ssh-keygen -l line gives the key type', () => {
    const record = valid()
    applyProperties(record, { $VM: VM, hostKeyFingerprint: `256 ${FINGERPRINT} root@host (ED25519)` })
    assert.equal(record.vm, VM)
    assert.equal(record.hostKeyFingerprint, FINGERPRINT)
    assert.equal(record.hostKeyAlgorithm, 'ssh-ed25519')

    // the same fingerprint alone keeps the known type
    applyProperties(record, { hostKeyFingerprint: FINGERPRINT })
    assert.equal(record.hostKeyAlgorithm, 'ssh-ed25519')
    // clearing the fingerprint clears its type
    applyProperties(record, { hostKeyFingerprint: null })
    assert.equal(record.hostKeyFingerprint, undefined)
    assert.equal(record.hostKeyAlgorithm, undefined)
  })

  it('refuses unknown properties and checks the transient ones', () => {
    assert.throws(() => applyProperties(valid(), { revision: 'x' }), isInvalid(/unknown property revision/))
    assert.throws(() => applyProperties(valid(), { acceptUnknownHostKey: 'yes' }), isInvalid(/must be a boolean/))
    assert.throws(() => applyProperties(valid(), { hostKeyFingerprint: 1 }), isInvalid(/must be a string/))
    applyProperties(valid(), { acceptUnknownHostKey: true })
  })
})

describe('parseImportedEngines()', () => {
  it('fills the defaults, normalizes the fingerprint and gives new revisions', () => {
    const { ids, vms, records } = parseImportedEngines([
      { id: 'a', host: 'h', username: 'u', password: 'p', revision: 'old', hostKeyFingerprint: `${FINGERPRINT}= ` },
      { id: 'b', vm: VM, username: 'u', password: 'p' },
    ])
    assert.deepEqual(Array.from(ids), ['a', 'b'])
    assert.deepEqual(Array.from(vms), [[VM, 'b']])
    assert.equal(records[0].port, DEFAULT_SSH_PORT)
    assert.equal(records[0].socketPath, DEFAULT_SOCKET_PATH)
    assert.equal(records[0].hostKeyFingerprint, FINGERPRINT)
    assert.equal('hostKeyAlgorithm' in records[0], false)
    assert.notEqual(records[0].revision, 'old')
    assert.notEqual(records[0].revision, records[1].revision)
  })

  it('refuses invalid imports', () => {
    assert.throws(() => parseImportedEngines({}), isInvalid(/must be an array/))
    assert.throws(() => parseImportedEngines([null]), isInvalid(/object with an id/))
    assert.throws(() => parseImportedEngines([{ id: 'a', foo: 1 }]), isInvalid(/a: unknown property foo/))
    const engine = { id: 'a', host: 'h', username: 'u', password: 'p' }
    assert.throws(() => parseImportedEngines([engine, engine]), isInvalid(/present twice/))
    assert.throws(() => parseImportedEngines([{ ...engine, port: -1 }]), isInvalid(/^Docker engine a: port/))
    assert.throws(
      () =>
        parseImportedEngines([
          { ...engine, vm: VM },
          { ...engine, id: 'b', vm: VM },
        ]),
      error => objectAlreadyExists.is(error)
    )
  })
})
