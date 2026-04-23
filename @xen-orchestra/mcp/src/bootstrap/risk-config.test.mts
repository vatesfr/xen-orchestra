import assert from 'node:assert/strict'
import { describe, it, afterEach } from 'node:test'
import { getRiskLevel, createConfirmation, consumeConfirmation, getPendingCount, clearPending } from './risk-config.mjs'

describe('getRiskLevel', () => {
  it('classifies any DELETE as confirm', () => {
    assert.strictEqual(getRiskLevel('DELETE', 'DeleteVm'), 'confirm')
    assert.strictEqual(getRiskLevel('DELETE', 'DeletePool'), 'confirm')
    assert.strictEqual(getRiskLevel('DELETE', 'DeleteWhatever'), 'confirm')
  })

  it('classifies specific dangerous operationIds as confirm', () => {
    assert.strictEqual(getRiskLevel('POST', 'EmergencyShutdownPool'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'RollingReboot'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'RollingUpdate'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'HardShutdownVm'), 'confirm')
    assert.strictEqual(getRiskLevel('POST', 'HardRebootVm'), 'confirm')
  })

  it('classifies safe operations as direct', () => {
    assert.strictEqual(getRiskLevel('POST', 'StartVm'), 'direct')
    assert.strictEqual(getRiskLevel('POST', 'CleanShutdownVm'), 'direct')
    assert.strictEqual(getRiskLevel('POST', 'SnapshotVm'), 'direct')
    assert.strictEqual(getRiskLevel('GET', 'GetVms'), 'direct')
  })

  it('is case-insensitive on method', () => {
    assert.strictEqual(getRiskLevel('delete', 'DeleteVm'), 'confirm')
    assert.strictEqual(getRiskLevel('Delete', 'DeleteVm'), 'confirm')
  })
})

describe('confirmation tokens', () => {
  afterEach(() => {
    clearPending()
  })

  it('createConfirmation returns a UUID token', () => {
    const token = createConfirmation('DELETE', '/vms/vm-123', undefined)
    assert.ok(typeof token === 'string')
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
    assert.strictEqual(consumeConfirmation('nonexistent-token'), undefined)
  })

  it('consumeConfirmation returns undefined for already-consumed token', () => {
    const token = createConfirmation('DELETE', '/vms/vm-123', undefined)
    consumeConfirmation(token)
    assert.strictEqual(consumeConfirmation(token), undefined)
  })

  it('clearPending removes all tokens', () => {
    createConfirmation('DELETE', '/a', undefined)
    createConfirmation('DELETE', '/b', undefined)
    assert.strictEqual(getPendingCount(), 2)
    clearPending()
    assert.strictEqual(getPendingCount(), 0)
  })
})
