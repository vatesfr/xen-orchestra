import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import XenServers from './xen-servers.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1', _xapiRef: 'OpaqueRef:pool-1' }
const tracesDir = mkdtempSync(join(tmpdir(), 'xo-rpu-test-'))
after(() => rmSync(tracesDir, { recursive: true, force: true }))

function createXenServers({ backupRunning = false } = {}) {
  const calls = []
  const app = {
    apiContext: { user: { preferences: {} } },
    hooks: { on() {} },
    config: {
      getOptional: key => (key === 'rpu.tracesDir' ? tracesDir : undefined),
      getOptionalDuration: () => undefined,
      watchDuration() {},
    },
    tasks: { create: properties => new Task({ properties }) },
    async checkFeatureAuthorization() {},
    async backupGuard(poolId, opts) {
      calls.push(['backupGuard', poolId, opts])
      if (backupRunning) {
        throw forbiddenOperation('backup')
      }
    },
    async getAllJobs() {
      calls.push(['getAllJobs'])
      return []
    },
    async getAllSchedules() {
      return []
    },
    async getOptionalPlugin() {},
  }
  const xenServers = new XenServers(app, { safeMode: true })
  // no server is registered in the test: stub the XAPI lookup
  xenServers.getXapi = () => ({
    async getField() {
      return false
    },
    async rollingPoolUpdate(task, { rebootVm, shutdownPinnedVms }) {
      calls.push(['xapi.rollingPoolUpdate', { rebootVm, shutdownPinnedVms }])
    },
  })
  return { calls, xenServers }
}

describe('XenServers.rollingPoolUpdate', function () {
  it('is refused by the backup guard before anything else happens', async function () {
    const { calls, xenServers } = createXenServers({ backupRunning: true })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), forbiddenOperation.is)
    assert.deepEqual(calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: undefined, operation: 'rollingPoolUpdate' }],
    ])
  })

  it('forwards bypassBackupCheck to the backup guard, then runs', async function () {
    const { calls, xenServers } = createXenServers()
    await xenServers.rollingPoolUpdate(pool, { bypassBackupCheck: true, rebootVm: true, shutdownPinnedVms: false })
    assert.deepEqual(calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: true, operation: 'rollingPoolUpdate' }],
      ['getAllJobs'],
      ['xapi.rollingPoolUpdate', { rebootVm: true, shutdownPinnedVms: false }],
    ])
  })
})
