import assert from 'node:assert/strict'
import { after, describe, it, mock } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forbiddenOperation, incorrectState } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import XenServers from './xen-servers.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1', _xapiRef: 'OpaqueRef:pool-1' }
const tracesDir = mkdtempSync(join(tmpdir(), 'xo-rpu-test-'))
after(() => rmSync(tracesDir, { recursive: true, force: true }))

function createXenServers({ backupRunning = false, deleteRecord = async () => {}, recordRefused = false } = {}) {
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
    async startRpuRecoveryRun(poolId, options) {
      calls.push(['startRpuRecoveryRun', poolId, options])
      if (recordRefused) {
        throw incorrectState({ actual: 'failed', expected: null, object: poolId, property: 'rollingUpdateRecovery' })
      }
      return { markRunning() {}, setTaskId() {}, delete: deleteRecord, async fail() {} }
    },
  }
  // the constructor arms a timeout that rejects if the `core started` hook,
  // never fired here, does not set up the server collection in time
  mock.timers.enable({ apis: ['setTimeout'] })
  const xenServers = new XenServers(app, { safeMode: true })
  mock.timers.reset()
  // no server is registered in the test: stub the XAPI lookup
  xenServers.getXapi = () => ({
    async getField() {
      return false
    },
    async rollingPoolUpdate(task, { acceptCurrentStateAsBaseline, rebootVm, shutdownPinnedVms }) {
      calls.push(['xapi.rollingPoolUpdate', { acceptCurrentStateAsBaseline, rebootVm, shutdownPinnedVms }])
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

  it('forwards the options to the backup guard, the record and the update, then runs', async function () {
    const { calls, xenServers } = createXenServers()
    await xenServers.rollingPoolUpdate(pool, {
      acceptCurrentStateAsBaseline: true,
      bypassBackupCheck: true,
      rebootVm: true,
      shutdownPinnedVms: false,
    })
    assert.deepEqual(calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: true, operation: 'rollingPoolUpdate' }],
      ['getAllJobs'],
      [
        'startRpuRecoveryRun',
        'pool-1',
        { acceptCurrentStateAsBaseline: true, bypassBackupCheck: true, rebootVm: true, shutdownPinnedVms: false },
      ],
      ['xapi.rollingPoolUpdate', { acceptCurrentStateAsBaseline: true, rebootVm: true, shutdownPinnedVms: false }],
    ])
  })

  it('is refused before touching the pool when a recovery record exists', async function () {
    const { calls, xenServers } = createXenServers({ recordRefused: true })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), error =>
      incorrectState.is(error, { property: 'rollingUpdateRecovery' })
    )
    assert.equal(calls.at(-1)[0], 'startRpuRecoveryRun')
  })

  it('succeeds even if the recovery record cannot be deleted afterwards', async function () {
    const { calls, xenServers } = createXenServers({
      deleteRecord: async () => {
        throw new Error('store unavailable')
      },
    })
    await xenServers.rollingPoolUpdate(pool)
    assert.equal(calls.at(-1)[0], 'xapi.rollingPoolUpdate')
  })
})
