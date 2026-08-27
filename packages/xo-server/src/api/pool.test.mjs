import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as handlers from './pool.mjs'

const pool = { id: 'pool-1' }

for (const [method, orchestrator, params] of [
  ['rollingUpdate', 'rollingPoolUpdate', { rebootVm: true, shutdownPinnedVms: false }],
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
