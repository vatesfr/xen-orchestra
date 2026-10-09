import assert from 'node:assert/strict'
import { after, describe, it, mock } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forbiddenOperation, incorrectState } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import XenServers from './xen-servers.mjs'
import { noRpuResume } from '../_rpuRecovery.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1', _xapiRef: 'OpaqueRef:pool-1' }
const tracesDir = mkdtempSync(join(tmpdir(), 'xo-rpu-test-'))
after(() => rmSync(tracesDir, { recursive: true, force: true }))

function createXenServers({
  backupRunning = false,
  changedByRun = {},
  completeRecord = async () => {},
  intentRefused = false,
  loadBalancerInstalled = true,
  loadBalancerLoaded = false,
  recordRefused = false,
  softwareVersion = { product_brand: 'XCP-ng', product_version: '8.3.0' },
  scheduleDisableRefused,
  updateRefused = false,
  withSchedule = false,
  schedules = withSchedule ? [{ id: 'schedule-1', jobId: 'job-1', enabled: true }] : [],
  wlbDisableRefused = false,
  wlbEnabled = false,
  wlbRestoreRefused = false,
  xsCredentials,
} = {}) {
  const calls = []
  const taskNames = []
  const taskProperties = []
  const makeRecorder = (attempt = 1) => ({
    runId: 'run-1',
    attempt,
    markRunning() {},
    setTaskId() {},
    async settingChangedByRun(name, value) {
      calls.push(['recorder.settingChangedByRun', name, value])
      if (intentRefused) {
        throw new Error('store unavailable')
      }
    },
    settingRestored(name, id) {
      calls.push(['recorder.settingRestored', name, id])
    },
    async complete() {
      calls.push(['recorder.complete'])
      return completeRecord()
    },
    async fail() {
      calls.push(['recorder.fail'])
    },
    async dropIfNothingToRecover() {
      calls.push(['recorder.dropIfNothingToRecover'])
    },
  })
  const app = {
    apiContext: { user: { preferences: { xsCredentials } } },
    hooks: { on() {} },
    config: {
      getDuration: () => 0,
      getOptional: key => (key === 'rpu.tracesDir' ? tracesDir : undefined),
      getOptionalDuration: () => undefined,
      watchDuration() {},
    },
    tasks: {
      create(properties) {
        taskNames.push(properties.name)
        taskProperties.push(properties)
        return new Task({ properties })
      },
    },
    async checkFeatureAuthorization() {},
    async backupGuard(poolId, opts) {
      calls.push(['backupGuard', poolId, opts])
      if (backupRunning) {
        throw forbiddenOperation('backup')
      }
    },
    async getAllJobs() {
      calls.push(['getAllJobs'])
      // smart mode without a pool filter: may concern this pool
      return schedules.length > 0 ? [{ id: 'job-1', vms: {} }] : []
    },
    async getAllSchedules() {
      return schedules
    },
    async updateSchedule({ id, enabled }) {
      calls.push(['updateSchedule', id, enabled])
      if (!enabled && id === scheduleDisableRefused) {
        throw new Error('schedule store unavailable')
      }
    },
    async getOptionalPlugin() {
      return loadBalancerInstalled ? { loaded: loadBalancerLoaded, autoload: false } : undefined
    },
    async loadPlugin() {},
    async unloadPlugin(id) {
      calls.push(['unloadPlugin', id])
    },
    async startRpuRecoveryRun(poolId, options) {
      calls.push(['startRpuRecoveryRun', poolId, options])
      if (recordRefused) {
        throw incorrectState({ actual: 'failed', expected: null, object: poolId, property: 'rollingUpdateRecovery' })
      }
      return makeRecorder()
    },
    async resumeRpuRecoveryRun({ id }) {
      calls.push(['resumeRpuRecoveryRun', id])
      return {
        recorder: makeRecorder(2),
        options: { bypassBackupCheck: true, rebootVm: true, shutdownPinnedVms: true },
        resume: {
          doneHostIds: new Set(['host-A']),
          hostsStarted: true,
          hostOrder: ['host-A', 'host-B'],
          vmHomeById: { vm1: 'host-A' },
          haltedPinnedVms: {},
          changedByRun,
        },
      }
    },
  }
  // the constructor arms a timeout that rejects if the `core started` hook,
  // never fired here, does not set up the server collection in time
  mock.timers.enable({ apis: ['setTimeout'] })
  const xenServers = new XenServers(app, { safeMode: true })
  mock.timers.reset()
  // no server is registered in the test: stub the XAPI lookup
  xenServers.getXapi = () => ({
    pool: { $master: { software_version: softwareVersion } },
    async getField(type, ref, field) {
      return field === 'wlb_enabled' && wlbEnabled
    },
    async call(method, ref, value) {
      calls.push(['xapi.call', method, value])
      if (method === 'pool.set_wlb_enabled' && (value ? wlbRestoreRefused : wlbDisableRefused)) {
        throw new Error('WLB unreachable')
      }
    },
    async rollingPoolUpdate(task, { acceptCurrentStateAsBaseline, rebootVm, shutdownPinnedVms, resume }) {
      calls.push(['xapi.rollingPoolUpdate', { acceptCurrentStateAsBaseline, rebootVm, shutdownPinnedVms }])
      if (resume !== noRpuResume) {
        calls.push(['xapi.rollingPoolUpdate resume', resume])
      }
      if (updateRefused) {
        throw incorrectState({ actual: ['host-B'], expected: [], object: 'pool-1', property: 'partiallyUpdatedPool' })
      }
    },
  })
  return { calls, taskNames, taskProperties, xenServers }
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
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['recorder.complete'],
    ])
  })

  it('persists each setting it changes before changing it', async function () {
    const { calls, xenServers } = createXenServers({ loadBalancerLoaded: true, withSchedule: true, wlbEnabled: true })
    await xenServers.rollingPoolUpdate(pool)
    assert.deepEqual(calls.slice(3, 10), [
      ['recorder.settingChangedByRun', 'schedules', ['schedule-1']],
      ['updateSchedule', 'schedule-1', false],
      ['recorder.settingChangedByRun', 'loadBalancer', { autoload: false }],
      ['unloadPlugin', 'load-balancer'],
      ['recorder.settingChangedByRun', 'wlb', undefined],
      ['xapi.call', 'pool.set_wlb_enabled', false],
      [
        'xapi.rollingPoolUpdate',
        { acceptCurrentStateAsBaseline: undefined, rebootVm: undefined, shutdownPinnedVms: undefined },
      ],
    ])
  })

  it('tells that the load balancer is about to be loaded again until the re-enable delay has elapsed', async function () {
    const { xenServers } = createXenServers({ loadBalancerLoaded: true })
    assert.equal(xenServers.isRpuLoadBalancerReEnablePending(), false)

    await xenServers.rollingPoolUpdate(pool)
    assert.equal(xenServers.isRpuLoadBalancerReEnablePending(), true)

    // the delay is 0 in this test: the plugin is loaded again in the next turns of the event loop
    for (let i = 0; i < 100 && xenServers.isRpuLoadBalancerReEnablePending(); i++) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    assert.equal(xenServers.isRpuLoadBalancerReEnablePending(), false)
  })

  it('leaves the load balancer alone when its change cannot be recorded', async function () {
    const { calls, taskNames, xenServers } = createXenServers({ intentRefused: true, loadBalancerLoaded: true })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), { message: 'store unavailable' })
    assert.ok(!calls.some(([name]) => name === 'unloadPlugin'))
    assert.deepEqual(taskNames, [])
  })

  it('is refused before touching the pool when a recovery record exists', async function () {
    const { calls, xenServers } = createXenServers({ recordRefused: true })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), error =>
      incorrectState.is(error, { property: 'rollingUpdateRecovery' })
    )
    assert.equal(calls.at(-1)[0], 'startRpuRecoveryRun')
  })

  it('persists a refused run, restores the pool, then drops the record', async function () {
    const { calls, xenServers } = createXenServers({ updateRefused: true, withSchedule: true })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), error =>
      incorrectState.is(error, { property: 'partiallyUpdatedPool' })
    )
    assert.deepEqual(calls.slice(-7), [
      ['updateSchedule', 'schedule-1', false],
      [
        'xapi.rollingPoolUpdate',
        { acceptCurrentStateAsBaseline: undefined, rebootVm: undefined, shutdownPinnedVms: undefined },
      ],
      ['recorder.fail'],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['updateSchedule', 'schedule-1', true],
      ['recorder.settingRestored', 'schedules', 'schedule-1'],
      ['recorder.dropIfNothingToRecover'],
    ])
  })

  it('keeps a recovery record on a XenServer 8.4+ pool', async function () {
    const { calls, xenServers } = createXenServers({
      softwareVersion: { product_brand: 'XenServer', product_version: '8.4.0' },
    })
    await xenServers.rollingPoolUpdate(pool)
    assert.ok(calls.some(([name]) => name === 'startRpuRecoveryRun'))
  })

  for (const softwareVersion of [
    { product_brand: 'XenServer', product_version: '8.2.1' },
    { product_brand: 'Citrix Hypervisor', product_version: '8.2.1' },
  ]) {
    it(`runs without a recovery record on a ${softwareVersion.product_brand} ${softwareVersion.product_version} pool`, async function () {
      const { calls, xenServers } = createXenServers({ softwareVersion, withSchedule: true })
      await xenServers.rollingPoolUpdate(pool)
      assert.deepEqual(calls, [
        ['backupGuard', 'pool-1', { bypassBackupCheck: undefined, operation: 'rollingPoolUpdate' }],
        ['getAllJobs'],
        ['updateSchedule', 'schedule-1', false],
        [
          'xapi.rollingPoolUpdate',
          { acceptCurrentStateAsBaseline: undefined, rebootVm: undefined, shutdownPinnedVms: undefined },
        ],
        ['updateSchedule', 'schedule-1', true],
      ])
    })
  }

  it('succeeds even if the recovery record cannot be deleted afterwards', async function () {
    const { calls, xenServers } = createXenServers({
      completeRecord: async () => {
        throw new Error('store unavailable')
      },
    })
    await xenServers.rollingPoolUpdate(pool)
    assert.equal(calls.at(-1)[0], 'recorder.complete')
  })

  it('leaves alone the settings already disabled before the run', async function () {
    const { calls, xenServers } = createXenServers({
      schedules: [{ id: 'schedule-1', jobId: 'job-1', enabled: false }],
    })
    await xenServers.rollingPoolUpdate(pool)
    assert.deepEqual(calls.slice(3), [
      [
        'xapi.rollingPoolUpdate',
        { acceptCurrentStateAsBaseline: undefined, rebootVm: undefined, shutdownPinnedVms: undefined },
      ],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['recorder.complete'],
    ])
  })

  it('restores a setting whose change failed, so a run failing before any host leaves nothing', async function () {
    const { calls, xenServers } = createXenServers({
      scheduleDisableRefused: 'schedule-1',
      schedules: [
        { id: 'schedule-1', jobId: 'job-1', enabled: true },
        { id: 'schedule-2', jobId: 'job-1', enabled: true },
      ],
    })
    await assert.rejects(xenServers.rollingPoolUpdate(pool), { message: 'schedule store unavailable' })
    assert.deepEqual(calls.slice(3), [
      ['recorder.settingChangedByRun', 'schedules', ['schedule-1']],
      ['updateSchedule', 'schedule-1', false],
      ['recorder.fail'],
      ['updateSchedule', 'schedule-1', true],
      ['recorder.settingRestored', 'schedules', 'schedule-1'],
      ['recorder.dropIfNothingToRecover'],
    ])

    const wlb = createXenServers({ wlbDisableRefused: true, wlbEnabled: true })
    await assert.rejects(wlb.xenServers.rollingPoolUpdate(pool), { message: 'WLB unreachable' })
    assert.deepEqual(wlb.calls.slice(3), [
      ['recorder.settingChangedByRun', 'wlb', undefined],
      ['xapi.call', 'pool.set_wlb_enabled', false],
      ['recorder.fail'],
      ['xapi.call', 'pool.set_wlb_enabled', true],
      ['recorder.settingRestored', 'wlb', undefined],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['recorder.dropIfNothingToRecover'],
    ])
  })

  it('completes the run once the settings are restored, even one which could not be', async function () {
    const { calls, xenServers } = createXenServers({
      loadBalancerLoaded: true,
      wlbEnabled: true,
      wlbRestoreRefused: true,
    })
    await xenServers.rollingPoolUpdate(pool)
    assert.deepEqual(calls.slice(-3), [
      ['xapi.call', 'pool.set_wlb_enabled', true],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['recorder.complete'],
    ])
  })

  it('writes no XenServer credentials to the record', async function () {
    const secret = 'xs-secret'
    const { calls, xenServers } = createXenServers({
      loadBalancerLoaded: true,
      withSchedule: true,
      wlbEnabled: true,
      xsCredentials: { username: secret, apikey: secret },
    })
    await xenServers.rollingPoolUpdate(pool, { bypassBackupCheck: true })
    const recorded = calls.filter(([name]) => name === 'startRpuRecoveryRun' || name.startsWith('recorder.'))
    assert.ok(recorded.length > 0)
    assert.ok(!JSON.stringify(recorded).includes(secret))
  })
})

describe('XenServers.resumeRollingPoolUpdate', function () {
  it('asks the backup guard again, then continues the same run where it stopped', async function () {
    const { calls, taskProperties, xenServers } = createXenServers()
    await xenServers.resumeRollingPoolUpdate(pool)
    assert.deepEqual(calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: false, operation: 'resumeRollingPoolUpdate' }],
      ['getAllJobs'],
      ['resumeRpuRecoveryRun', 'pool-1'],
      ['xapi.rollingPoolUpdate', { acceptCurrentStateAsBaseline: true, rebootVm: true, shutdownPinnedVms: true }],
      [
        'xapi.rollingPoolUpdate resume',
        {
          doneHostIds: new Set(['host-A']),
          hostsStarted: true,
          hostOrder: ['host-A', 'host-B'],
          vmHomeById: { vm1: 'host-A' },
          haltedPinnedVms: {},
          changedByRun: {},
        },
      ],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['recorder.complete'],
    ])
    assert.equal(taskProperties[0].runId, 'run-1')
    assert.equal(taskProperties[0].attempt, 2)
  })

  it('is refused by the backup guard before the record is read', async function () {
    const { calls, xenServers } = createXenServers({ backupRunning: true })
    await assert.rejects(xenServers.resumeRollingPoolUpdate(pool, { bypassBackupCheck: false }), forbiddenOperation.is)
    assert.deepEqual(calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: false, operation: 'resumeRollingPoolUpdate' }],
    ])
  })

  it('keeps disabled during the run the settings a previous attempt left disabled, then restores them', async function () {
    const { calls, xenServers } = createXenServers({
      changedByRun: {
        loadBalancer: { autoload: false },
        schedules: ['schedule-1', 'schedule-2', 'schedule-deleted'],
        wlb: true,
      },
      schedules: [
        { id: 'schedule-1', jobId: 'job-1', enabled: false },
        // enabled again by an operator since
        { id: 'schedule-2', jobId: 'job-1', enabled: true },
      ],
    })
    await xenServers.resumeRollingPoolUpdate(pool)
    assert.deepEqual(calls.filter(([name]) => name !== 'xapi.rollingPoolUpdate resume').slice(3), [
      ['recorder.settingRestored', 'schedules', 'schedule-2'],
      ['recorder.settingRestored', 'schedules', 'schedule-deleted'],
      ['recorder.settingChangedByRun', 'schedules', ['schedule-2']],
      ['updateSchedule', 'schedule-2', false],
      // its re-enabling timer was lost with xo-server: this attempt takes it over
      ['recorder.settingChangedByRun', 'loadBalancer', { autoload: false }],
      ['xapi.rollingPoolUpdate', { acceptCurrentStateAsBaseline: true, rebootVm: true, shutdownPinnedVms: true }],
      ['xapi.call', 'pool.set_wlb_enabled', true],
      ['recorder.settingRestored', 'wlb', undefined],
      ['recorder.settingRestored', 'loadBalancer', undefined],
      ['updateSchedule', 'schedule-2', true],
      ['recorder.settingRestored', 'schedules', 'schedule-2'],
      ['updateSchedule', 'schedule-1', true],
      ['recorder.settingRestored', 'schedules', 'schedule-1'],
      ['recorder.complete'],
    ])
    assert.equal(xenServers.isRpuLoadBalancerReEnablePending(), true)
  })

  it('forgets the load balancer a previous attempt left unloaded once its plugin is uninstalled', async function () {
    const { calls, xenServers } = createXenServers({
      changedByRun: { loadBalancer: { autoload: false } },
      loadBalancerInstalled: false,
    })
    await xenServers.resumeRollingPoolUpdate(pool)
    assert.deepEqual(calls.slice(-2), [['recorder.settingRestored', 'loadBalancer', undefined], ['recorder.complete']])
    assert.equal(xenServers.isRpuLoadBalancerReEnablePending(), false)
  })

  it('records the failure of a resume', async function () {
    const { calls, xenServers } = createXenServers({ updateRefused: true })
    await assert.rejects(xenServers.resumeRollingPoolUpdate(pool), error =>
      incorrectState.is(error, { property: 'partiallyUpdatedPool' })
    )
    assert.deepEqual(
      calls.slice(-3).map(([name]) => name),
      ['recorder.fail', 'recorder.settingRestored', 'recorder.dropIfNothingToRecover']
    )
  })
})
