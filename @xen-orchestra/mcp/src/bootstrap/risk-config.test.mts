import assert from 'node:assert/strict'
import { describe, it, afterEach } from 'node:test'
import { getRiskLevel, createConfirmation, consumeConfirmation, getPendingCount, clearPending } from './risk-config.mjs'

describe('getRiskLevel', () => {
  it('classifies DELETE as confirm', () => {
    assert.strictEqual(getRiskLevel('DELETE', 'vms', 'delete'), 'confirm')
    assert.strictEqual(getRiskLevel('DELETE', 'pools', 'delete'), 'confirm')
    assert.strictEqual(getRiskLevel('DELETE', 'anything', 'whatever'), 'confirm')
  })

  it('classifies specific dangerous operations as confirm', () => {
    assert.strictEqual(getRiskLevel('POST', 'pools', 'emergency_shutdown'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'pools', 'rolling_reboot'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'pools', 'rolling_update'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'vms', 'hard_shutdown'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'vms', 'hard_reboot'), 'confirm')
  })

  it('classifies safe operations as direct', () => {
    assert.strictEqual(getRiskLevel('POST', 'vms', 'start'), 'direct')
    assert.strictEqual(getRiskLevel('POST', 'vms', 'clean_shutdown'), 'direct')
    assert.strictEqual(getRiskLevel('POST', 'vms', 'snapshot'), 'direct')
    assert.strictEqual(getRiskLevel('GET', 'vms', 'list'), 'direct')
  })

  it('is case-insensitive on method', () => {
    assert.strictEqual(getRiskLevel('delete', 'vms', 'delete'), 'confirm')
    assert.strictEqual(getRiskLevel('Delete', 'vms', 'delete'), 'confirm')
  })
})

describe('confirmation tokens', () => {
  afterEach(() => {
    clearPending()
  })

  it('createConfirmation returns a UUID token', () => {
    const token = createConfirmation('DELETE', '/vms/vm-123', undefined)
    assert.ok(typeof token === 'string')
    assert.ok(token.length > 0)
    // UUID format
    assert.ok(/^[0-9a-f-]{36}$/.test(token))
  })

  it('consumeConfirmation returns the original request and removes the token', () => {
    const token = createConfirmation('DELETE', '/vms/vm-123', { force: true })
    assert.strictEqual(getPendingCount(), 1)

    const entry = consumeConfirmation(token)
    assert.ok(entry)
    assert.strictEqual(entry.method, 'DELETE')
    assert.strictEqual(entry.path, '/vms/vm-123')
    assert.deepStrictEqual(entry.body, { force: true })
    assert.strictEqual(getPendingCount(), 0)
  })

  it('consumeConfirmation returns undefined for invalid token', () => {
    const entry = consumeConfirmation('nonexistent-token')
    assert.strictEqual(entry, undefined)
  })

  it('consumeConfirmation returns undefined for already-consumed token', () => {
    const token = createConfirmation('DELETE', '/vms/vm-123', undefined)
    consumeConfirmation(token)
    const second = consumeConfirmation(token)
    assert.strictEqual(second, undefined)
  })

  it('clearPending removes all tokens', () => {
    createConfirmation('DELETE', '/a', undefined)
    createConfirmation('DELETE', '/b', undefined)
    assert.strictEqual(getPendingCount(), 2)
    clearPending()
    assert.strictEqual(getPendingCount(), 0)
  })
})
