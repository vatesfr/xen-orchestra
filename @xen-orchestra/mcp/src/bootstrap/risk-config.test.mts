import assert from 'node:assert/strict'
import { describe, it, afterEach } from 'node:test'
import { createConfirmation, consumeConfirmation, getPendingCount, clearPending } from './risk-config.mjs'

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
