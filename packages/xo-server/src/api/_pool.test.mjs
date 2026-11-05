import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as handlers from './pool.mjs'

const pool = { id: 'pool-1' }

for (const [method, orchestrator, params] of [
  [
    'rollingUpdate',
    'rollingPoolUpdate',
    { acceptCurrentStateAsBaseline: true, rebootVm: true, shutdownPinnedVms: false },
  ],
  ['rollingReboot', 'rollingPoolReboot', { shutdownPinnedVms: true }],
]) {
  describe(`pool.${method}`, function () {
    it('forwards bypassBackupCheck to the orchestrator', async function () {
      const calls = []
      const app = { [orchestrator]: async (pool, opts) => calls.push([pool, opts]) }
      await handlers[method].call(app, { pool, ...params })
      await handlers[method].call(app, { pool, bypassBackupCheck: true, ...params })
      assert.deepEqual(calls, [
        [pool, { bypassBackupCheck: undefined, ...params }],
        [pool, { bypassBackupCheck: true, ...params }],
      ])
    })
  })
}

describe('pool.getRollingUpdateRecovery', function () {
  // the JSON-RPC layer turns an undefined result into `true`, which clients
  // would take for a record: the absence of a record must be an explicit null
  it('returns null, not undefined, when the pool has no record', async function () {
    const app = { getRollingUpdateRecovery: async () => undefined }
    assert.equal(await handlers.getRollingUpdateRecovery.call(app, { pool }), null)
  })

  it('returns the view when the pool has a record', async function () {
    const view = { poolId: pool.id, status: 'interrupted' }
    const app = { getRollingUpdateRecovery: async () => view }
    assert.equal(await handlers.getRollingUpdateRecovery.call(app, { pool }), view)
  })
})

describe('pool.finalizeRollingUpdate', function () {
  it('forwards force to the orchestrator', async function () {
    const calls = []
    const app = { finalizeRollingUpdate: async (pool, opts) => calls.push([pool, opts]) }
    await handlers.finalizeRollingUpdate.call(app, { pool })
    await handlers.finalizeRollingUpdate.call(app, { pool, force: true })
    assert.deepEqual(calls, [
      [pool, { force: undefined }],
      [pool, { force: true }],
    ])
  })
})
