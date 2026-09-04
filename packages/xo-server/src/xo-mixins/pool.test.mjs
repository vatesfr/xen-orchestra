import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import Pools from './pool.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1' }
const tracesDir = mkdtempSync(join(tmpdir(), 'xo-rpr-test-'))
after(() => rmSync(tracesDir, { recursive: true, force: true }))

function createApp({ backupRunning = false } = {}) {
  const calls = []
  return {
    calls,
    hooks: { on() {} },
    config: {
      getOptional: key => (key === 'rpu.tracesDir' ? tracesDir : undefined),
      getOptionalDuration: () => undefined,
    },
    tasks: { create: properties => new Task({ properties }) },
    async checkFeatureAuthorization() {},
    async backupGuard(poolId, opts) {
      calls.push(['backupGuard', poolId, opts])
      if (backupRunning) {
        throw forbiddenOperation('backup')
      }
    },
    getXapi: () => ({
      async rollingPoolReboot(task, opts) {
        calls.push(['xapi.rollingPoolReboot', opts])
      },
    }),
  }
}

describe('Pools.rollingPoolReboot', function () {
  it('is refused by the backup guard before anything else happens', async function () {
    const app = createApp({ backupRunning: true })
    await assert.rejects(new Pools(app).rollingPoolReboot(pool), forbiddenOperation.is)
    assert.deepEqual(app.calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: undefined, operation: 'rollingPoolReboot' }],
    ])
  })

  it('forwards bypassBackupCheck to the backup guard, then runs', async function () {
    const app = createApp()
    await new Pools(app).rollingPoolReboot(pool, { bypassBackupCheck: true, shutdownPinnedVms: true })
    assert.deepEqual(app.calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: true, operation: 'rollingPoolReboot' }],
      ['xapi.rollingPoolReboot', { shutdownPinnedVms: true }],
    ])
  })
})
