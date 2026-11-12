import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { TimeoutError } from 'promise-toolbox'
import { incorrectState } from 'xo-common/api-errors.js'

import patchingMethods, { supportsRpuRecovery } from './patching.mjs'
import { noopRpuRecorder } from '../../_rpuRecovery.mjs'
import { REMOVE_CACHE_ENTRY } from '../../_pDebounceWithKey.mjs'

const { describe, it } = test

const XCP_NG = { product_brand: 'XCP-ng', product_version: '8.3.0' }
const XS_CDN = { product_brand: 'XenServer', product_version: '8.4.0' }
const LEGACY_VERSIONS = [
  { product_brand: 'XenServer', product_version: '8.2.1' },
  { product_brand: 'Citrix Hypervisor', product_version: '8.2.1' },
]

// Fake XAPI modelling a pool (XCP-ng by default) with only what a rolling pool
// update depends on: which hosts have missing patches, whether the pool has a
// LINSTOR SR. The first host is the master.
class FakeXapi {
  constructor(nMissingPatchesByHost, { linstor = false, softwareVersion = XCP_NG } = {}) {
    this.hosts = nMissingPatchesByHost.map((nMissingPatches, i) => {
      const letter = String.fromCharCode(65 + i)
      return {
        $type: 'host',
        $ref: `OpaqueRef:host-${letter}`,
        uuid: `host-${letter}`,
        name_label: `host ${letter}`,
        metrics: `OpaqueRef:metrics-${letter}`,
        software_version: softwareVersion,
        enabled: true,
        other_config: { boot_time: '1000', agent_start_time: '1100' },
        live: true,
        // what is left of the reboot in progress of a host which is not live:
        // `reboot` until XAPI reports it live, then `startAgent` until it
        // refreshes boot_time and agent_start_time
        reboot: undefined,
        startAgent: undefined,
        nMissingPatches,
        // listing cached before the current state, until removed
        cachedNMissingPatches: undefined,
      }
    })
    this.objects = {
      indexes: {
        type: {
          host: Object.fromEntries(this.hosts.map(host => [host.$ref, host])),
          SR: linstor
            ? {
                'OpaqueRef:sr-linstor': {
                  $type: 'SR',
                  type: 'linstor',
                  $PBDs: [{ device_config: { 'group-name': 'linstor_group/thin_device' } }],
                },
              }
            : {},
          VM: {},
        },
      },
    }
    this.pool = { uuid: 'pool-1', master: this.hosts[0].$ref, $master: this.hosts[0] }

    // pool-wide steps in order: 'linstor' for a LINSTOR packages update, the
    // hosts handled (ie not ignored) for a rolling pool reboot
    this.steps = []

    // what `linstor-manager` answers to a health check: a result, or an error
    // to throw
    this.linstorHealth = { nodes: {}, resources: {}, errors: [] }

    // what happens to LINSTOR in order: 'check' for a single health check,
    // 'wait' for a wait for it to be healthy, 'update' for a packages update,
    // and the reboot of each host
    this.linstorEvents = []

    // patch installations in order: the hosts of each call, 'pool' for a
    // pool-wide one
    this.installs = []

    // hosts enabled by the update, in order
    this.enabledHosts = []

    // XenServer 8.4+ only: 'remove' and 'fetch' calls to the updates endpoint
    this.updatesEndpointCalls = []

    // XenServer 8.4+ only: host or VM uuid -> level of each of its pending
    // guidances checks
    this.guardLevels = {}

    this._restartHostTimeout = 60e3
  }

  // a host by uuid, or the metrics of a host by ref
  getObject(id, ...defaultValue) {
    const host = this.hosts.find(host => host.uuid === id)
    if (host !== undefined) {
      return host
    }
    const hostOfMetrics = this.hosts.find(host => host.metrics === id)
    if (hostOfMetrics !== undefined) {
      return { live: hostOfMetrics.live }
    }
    if (defaultValue.length !== 0) {
      return defaultValue[0]
    }
    throw new Error(`no such object ${id}`)
  }

  async _waitObjectState(id, predicate) {
    const host = this.hosts.find(host => host.metrics === id)
    if (host !== undefined) {
      if (!predicate({ live: host.live })) {
        await host.reboot()
      }
      return
    }
    const target = this.getObject(id)
    if (!predicate(target)) {
      await target.startAgent()
    }
  }

  async enableHost(hostId) {
    this.enabledHosts.push(hostId)
    this.getObject(hostId).enabled = true
  }

  async installPatches({ hosts }) {
    this.installs.push(hosts === undefined ? 'pool' : hosts.map(host => host.uuid))
  }

  async listMissingPatches(hostUuid) {
    if (hostUuid === REMOVE_CACHE_ENTRY) {
      this.getObject(arguments[1]).cachedNMissingPatches = undefined
      return
    }
    const { nMissingPatches, cachedNMissingPatches = nMissingPatches } = this.getObject(hostUuid)
    return Array.from({ length: cachedNMissingPatches }, (_, i) => ({ name: `patch-${i}` }))
  }

  async call(method, hostRef, plugin, fn) {
    assert.deepEqual(
      [method, hostRef, plugin, fn],
      ['host.call_plugin', this.pool.master, 'linstor-manager', 'healthCheck']
    )
    this.linstorEvents.push('check')
    if (this.linstorHealth instanceof Error) {
      throw this.linstorHealth
    }
    return JSON.stringify(this.linstorHealth)
  }

  async _updateLinstorPackages() {
    this.steps.push('linstor')
    this.linstorEvents.push('update')
  }

  async _waitLinstorHealthy() {
    this.linstorEvents.push('wait')
  }

  async rollingPoolReboot(
    parentTask,
    { afterHostIsBack, beforeEvacuateVms, beforeRebootHost, ignoreHost, rebootFirst, resume }
  ) {
    this.resume = resume
    this.rebootFirstHostIds = this.hosts.filter(host => rebootFirst?.(host) ?? false).map(host => host.uuid)
    const handledHosts = this.hosts.filter(host => !resume.doneHostIds.has(host.uuid) && !ignoreHost(host))
    this.steps.push(handledHosts.map(host => host.uuid))
    await beforeEvacuateVms()
    for (const host of handledHosts) {
      await beforeRebootHost(host)
      this.linstorEvents.push(`reboot ${host.uuid}`)
      await afterHostIsBack?.(host)
    }
  }

  // XenServer 8.4+ only: no update guidance, no pending guidance
  async _fetchXsUpdatesEndpoint(host) {
    this.updatesEndpointCalls.push(host === REMOVE_CACHE_ENTRY ? 'remove' : 'fetch')
    return { hash: 'hash', hosts: [] }
  }

  async _pendingGuidancesGuard(object, level) {
    ;(this.guardLevels[object.uuid] ??= []).push(level)
  }
}

// the mixin reaches its own methods through `this`
Object.setPrototypeOf(FakeXapi.prototype, patchingMethods)

// the properties the update sets on its task end in `xapi.taskProperties`
const rollingPoolUpdate = async (xapi, options) => {
  xapi.taskProperties = {}
  const parentTask = new Task({
    properties: { name: 'rolling pool update', progress: 0 },
    onProgress: event => {
      if (event.type === 'property' && event.id === parentTask.id) {
        xapi.taskProperties[event.name] = event.value
      }
    },
  })

  let error
  await parentTask.run(async () => {
    try {
      await patchingMethods.rollingPoolUpdate.call(xapi, parentTask, options)
    } catch (err) {
      error = err
    }
  })
  return error
}

describe('rollingPoolUpdate', function () {
  it('refuses a pool whose master is current while another host is not', async function () {
    const xapi = new FakeXapi([0, 2, 0])

    const error = await rollingPoolUpdate(xapi)

    assert.ok(incorrectState.is(error, { property: 'partiallyUpdatedPool' }), error)
    assert.deepEqual(error.data.actual, ['host-B'])
    assert.equal(error.data.object, 'pool-1')
    assert.deepEqual(xapi.steps, [])
  })

  it('refuses a XenServer 8.4+ pool whose master is current while another host is not', async function () {
    const xapi = new FakeXapi([0, 2, 0], { softwareVersion: XS_CDN })

    const error = await rollingPoolUpdate(xapi)

    assert.ok(incorrectState.is(error, { property: 'partiallyUpdatedPool' }), error)
    assert.deepEqual(xapi.steps, [])
  })

  it('updates the outdated hosts once the current state is accepted as the baseline', async function () {
    const xapi = new FakeXapi([0, 2, 0])

    const error = await rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true })

    assert.equal(error, undefined)
    assert.deepEqual(xapi.steps, [['host-B']])
    assert.deepEqual(xapi.installs, [['host-B']])
  })

  it('needs no acknowledgement when the master is outdated too', async function () {
    const xapi = new FakeXapi([1, 2, 0])

    const error = await rollingPoolUpdate(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.steps, [['host-A', 'host-B']])
    assert.deepEqual(xapi.installs, [['host-A'], ['host-B']])
  })

  for (const softwareVersion of LEGACY_VERSIONS) {
    const { product_brand: productBrand, product_version: productVersion } = softwareVersion

    it(`installs the patches pool-wide, once, on a ${productBrand} ${productVersion} pool`, async function () {
      const xapi = new FakeXapi([1, 2, 0], { softwareVersion })

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-A', 'host-B']])
      assert.deepEqual(xapi.installs, ['pool'])
    })

    it(`does not ask for an acknowledgement on a ${productBrand} ${productVersion} pool`, async function () {
      const xapi = new FakeXapi([0, 2, 0], { softwareVersion })

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-B']])
    })
  }

  it('leaves the LINSTOR packages alone when the run is refused', async function () {
    const xapi = new FakeXapi([0, 2, 0], { linstor: true })

    const error = await rollingPoolUpdate(xapi)

    assert.ok(incorrectState.is(error, { property: 'partiallyUpdatedPool' }), error)
    assert.deepEqual(xapi.steps, [])
  })

  it('leaves the LINSTOR packages alone when no host needs an update', async function () {
    const xapi = new FakeXapi([0, 0, 0], { linstor: true })

    const error = await rollingPoolUpdate(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.steps, [[]])
  })

  it('updates the LINSTOR packages once the guards passed, before the first reboot', async function () {
    const xapi = new FakeXapi([1, 2, 0], { linstor: true })

    const error = await rollingPoolUpdate(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.steps, ['linstor', ['host-A', 'host-B']])
  })

  describe('LINSTOR health', function () {
    const UNHEALTHY = {
      nodes: { 'host-B': 'OFFLINE' },
      resources: {},
      errors: [{ code: 0x1020000, name: 'host-B', status: 'OFFLINE' }],
    }

    it('refuses a pool whose LINSTOR is not healthy, before touching it', async function () {
      const xapi = new FakeXapi([1, 2, 0], { linstor: true })
      xapi.linstorHealth = UNHEALTHY

      const error = await rollingPoolUpdate(xapi)

      assert.ok(incorrectState.is(error, { property: 'linstorHealth' }), error)
      assert.deepEqual(error.data.actual, ['node host-B is OFFLINE'])
      assert.equal(error.data.object, 'pool-1')
      assert.deepEqual(xapi.linstorEvents, ['check'])
      assert.deepEqual(xapi.steps, [])
    })

    it('checks LINSTOR before updating its packages, and waits for it once each host is back', async function () {
      const xapi = new FakeXapi([1, 2, 0], { linstor: true })

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.linstorEvents, ['check', 'update', 'reboot host-A', 'wait', 'reboot host-B', 'wait'])
    })

    it('does not refuse a pool whose plugin is too old to check LINSTOR', async function () {
      const xapi = new FakeXapi([1, 2, 0], { linstor: true })
      xapi.linstorHealth = Object.assign(new Error('UNKNOWN_XENAPI_PLUGIN_FUNCTION(healthCheck)'), {
        code: 'UNKNOWN_XENAPI_PLUGIN_FUNCTION',
      })

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, ['linstor', ['host-A', 'host-B']])
    })

    it('refuses a pool whose LINSTOR cannot be checked', async function () {
      const xapi = new FakeXapi([1, 2, 0], { linstor: true })
      xapi.linstorHealth = new Error('XENAPI_PLUGIN_FAILURE')

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error?.message, 'XENAPI_PLUGIN_FAILURE')
      assert.deepEqual(xapi.steps, [])
    })

    it('leaves LINSTOR alone when no host needs an update', async function () {
      const xapi = new FakeXapi([0, 0, 0], { linstor: true })
      xapi.linstorHealth = UNHEALTHY

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.linstorEvents, [])
    })

    it('never asks LINSTOR on a pool without it', async function () {
      const xapi = new FakeXapi([1, 2, 0])

      const error = await rollingPoolUpdate(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.linstorEvents, ['reboot host-A', 'reboot host-B'])
    })
  })

  describe('resume', function () {
    // host-A done, unless the previous attempt stopped before any host
    const resumeOf = (hostsStarted, unfinishedHosts = {}) => ({
      doneHostIds: new Set(hostsStarted ? ['host-A'] : []),
      unfinishedHosts,
      patchedHostIds: new Set(hostsStarted ? ['host-A', ...Object.keys(unfinishedHosts)] : []),
      hostsStarted,
      hostOrder: ['host-A', 'host-B'],
      vmHomeById: {},
      haltedPinnedVms: {},
    })
    // host-B, touched by the previous attempt before its reboot
    const unfinishedB = ({ enabledBeforeUpdate = true, rebooting = false } = {}) =>
      resumeOf(true, { 'host-B': { agentStartedAtBeforeUpdate: '2000', enabledBeforeUpdate, rebooting } })

    const resumeUpdate = (xapi, resume) => {
      const observedSteps = []
      const recorder = {
        ...noopRpuRecorder,
        stepObserved: (hostId, name) => observedSteps.push(`${hostId} ${name}`),
      }
      return rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true, recorder, resume }).then(error => ({
        error,
        observedSteps,
      }))
    }

    it('hands the resume to the reboot', async function () {
      const xapi = new FakeXapi([0, 2])
      const resume = resumeOf(true)

      const error = await rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true, resume })

      assert.equal(error, undefined)
      assert.deepEqual(xapi.resume, resume)
      assert.deepEqual(xapi.steps, [['host-B']])
    })

    it('updates again an unfinished host which still has missing patches', async function () {
      const xapi = new FakeXapi([0, 2])

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-B']])
      assert.deepEqual(xapi.installs, [['host-B']])
    })

    it('only reboots an unfinished host which has no missing patches left', async function () {
      const xapi = new FakeXapi([0, 0])

      const { error, observedSteps } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-B']])
      assert.deepEqual(xapi.installs, [])
      assert.deepEqual(observedSteps, ['host-B update'])
    })

    it('lists the missing patches again instead of reading the cached listing', async function () {
      const xapi = new FakeXapi([0, 0])
      xapi.hosts[1].cachedNMissingPatches = 2

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.installs, [])
    })

    // the answer of the updater plugin while the update an interrupted attempt
    // started still runs on the host
    const updaterBusy = () =>
      Object.assign(new Error('The updater plugin is busy'), {
        code: '-1',
        params: ['The updater plugin is busy (current operation: update)', '', ''],
      })
    // the listings of host-B fail while its updater is busy, and the listing
    // cache keeps a failure until its entry is removed, as `debounceWithKey`
    const busyUpdaterOnB = (xapi, nBusyListings) => {
      const { listMissingPatches } = xapi
      let cachedFailure
      xapi.listMissingPatches = function (hostUuid, ...args) {
        if (hostUuid === REMOVE_CACHE_ENTRY && args[0] === 'host-B') {
          cachedFailure = undefined
        } else if (hostUuid === 'host-B' && (cachedFailure !== undefined || nBusyListings-- > 0)) {
          cachedFailure ??= updaterBusy()
          return Promise.reject(cachedFailure)
        }
        return listMissingPatches.call(this, hostUuid, ...args)
      }
    }

    it('waits for the update its interrupted attempt left running on a host', async function (t) {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const xapi = new FakeXapi([0, 0])
      busyUpdaterOnB(xapi, 3)

      const ticker = setInterval(() => t.mock.timers.tick(10e3), 1)
      const { error, observedSteps } = await resumeUpdate(xapi, unfinishedB()).finally(() => clearInterval(ticker))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.installs, [])
      assert.deepEqual(observedSteps, ['host-B update'])
    })

    it('waits for the busy updater when the previous attempt stopped before any host', async function (t) {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const xapi = new FakeXapi([2, 2])
      busyUpdaterOnB(xapi, 3)

      const ticker = setInterval(() => t.mock.timers.tick(10e3), 1)
      const { error } = await resumeUpdate(xapi, resumeOf(false)).finally(() => clearInterval(ticker))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.installs, [['host-A'], ['host-B']])
    })

    it('does not wait on another listing error', { timeout: 5e3 }, async function () {
      const xapi = new FakeXapi([0, 0])
      xapi.listMissingPatches = hostUuid =>
        hostUuid === REMOVE_CACHE_ENTRY ? Promise.resolve() : Promise.reject(new Error('repository unreachable'))

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error?.message, 'repository unreachable')
    })

    it('fails the run once the updater stays busy longer than an update', async function (t) {
      t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
      const xapi = new FakeXapi([0, 0])
      busyUpdaterOnB(xapi, Infinity)

      const ticker = setInterval(() => t.mock.timers.tick(60e3), 1)
      const { error } = await resumeUpdate(xapi, unfinishedB()).finally(() => clearInterval(ticker))

      assert.match(error?.params?.[0], /plugin is busy/)
      assert.deepEqual(xapi.steps, [])
    })

    it('does not wait for a busy updater on a first attempt', async function () {
      const xapi = new FakeXapi([2, 2])
      busyUpdaterOnB(xapi, 1)

      const error = await rollingPoolUpdate(xapi)

      assert.match(error?.params?.[0], /plugin is busy/)
      assert.deepEqual(xapi.steps, [])
    })

    it('neither updates nor reboots an unfinished host which rebooted since, and enables it', async function () {
      const xapi = new FakeXapi([0, 0])
      Object.assign(xapi.hosts[1], { enabled: false, other_config: { boot_time: '3000' } })

      const { error, observedSteps } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [[]])
      assert.deepEqual(xapi.installs, [])
      assert.deepEqual(xapi.enabledHosts, ['host-B'])
      assert.deepEqual([...xapi.resume.doneHostIds], ['host-A', 'host-B'])
      assert.deepEqual(observedSteps, ['host-B evacuate', 'host-B update', 'host-B reboot', 'host-B enable'])
    })

    it('enables a host which rebooted since once XAPI finished starting it', async function (t) {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const xapi = new FakeXapi([0, 0])
      Object.assign(xapi.hosts[1], { enabled: false, other_config: { boot_time: '3000' } })
      let refusals = 2
      const { enableHost } = xapi
      xapi.enableHost = async hostId => {
        if (refusals-- > 0) {
          throw Object.assign(new Error('HOST_STILL_BOOTING'), { code: 'HOST_STILL_BOOTING' })
        }
        return enableHost.call(xapi, hostId)
      }

      // the retries wait on the mocked setTimeout: move the clock until the end
      const ticker = setInterval(() => t.mock.timers.tick(5e3), 1)
      const { error } = await resumeUpdate(xapi, unfinishedB()).finally(() => clearInterval(ticker))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.enabledHosts, ['host-B'])
      assert.deepEqual(xapi.steps, [[]])
    })

    it('fails the run on an enable call which hangs', async function (t) {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const xapi = new FakeXapi([0, 0])
      Object.assign(xapi.hosts[1], { enabled: false, other_config: { boot_time: '3000' } })
      xapi.enableHost = () => new Promise(() => {})

      const ticker = setInterval(() => t.mock.timers.tick(5e3), 1)
      const { error } = await resumeUpdate(xapi, unfinishedB()).finally(() => clearInterval(ticker))

      assert.ok(error instanceof TimeoutError, error)
      assert.deepEqual(xapi.steps, [])
    })

    it('neither reboots nor updates an unfinished host the run did not patch, and enables it', async function () {
      const xapi = new FakeXapi([0, 0])
      // patched by hand after its evacuation, not rebooted since
      xapi.hosts[1].enabled = false
      const resume = { ...unfinishedB(), patchedHostIds: new Set(['host-A']) }

      const { error } = await resumeUpdate(xapi, resume)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [[]])
      assert.deepEqual(xapi.installs, [])
      assert.deepEqual(xapi.enabledHosts, ['host-B'])
      assert.deepEqual([...xapi.resume.doneHostIds], ['host-A', 'host-B'])
    })

    it('ignores an unfinished host which left the pool', async function () {
      const xapi = new FakeXapi([0, 2])
      const resume = resumeOf(true, { 'host-C': { agentStartedAtBeforeUpdate: '2000', enabledBeforeUpdate: true } })

      const { error } = await resumeUpdate(xapi, resume)

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-B']])
    })

    it('ignores an unfinished host forgotten while its patches were listed', async function () {
      const xapi = new FakeXapi([0, 2])
      const { listMissingPatches } = xapi
      xapi.listMissingPatches = async function (hostUuid) {
        const patches = await listMissingPatches.apply(this, arguments)
        if (hostUuid === 'host-B') {
          this.hosts = this.hosts.filter(host => host.uuid !== 'host-B')
        }
        return patches
      }

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [[]])
    })

    it('leaves disabled an unfinished host the operator had disabled', async function () {
      const xapi = new FakeXapi([0, 0])
      Object.assign(xapi.hosts[1], { enabled: false, other_config: { boot_time: '3000' } })

      const { error } = await resumeUpdate(xapi, unfinishedB({ enabledBeforeUpdate: false }))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.enabledHosts, [])
    })

    it('waits for the end of a reboot in progress before deciding', async function () {
      const xapi = new FakeXapi([0, 0])
      const host = xapi.hosts[1]
      host.live = false
      // XAPI reports the host live before it refreshes its boot_time
      host.reboot = async () => {
        host.live = true
      }
      host.startAgent = async () => {
        host.other_config = { boot_time: '3000', agent_start_time: '3100' }
      }

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      // rebooted: nothing left to do on it
      assert.deepEqual(xapi.steps, [[]])
    })

    it('waits for a reboot the previous attempt started although XAPI reports the host live', async function () {
      const xapi = new FakeXapi([0, 0])
      const host = xapi.hosts[1]
      // live, its boot_time not refreshed yet
      host.startAgent = async () => {
        host.other_config = { boot_time: '3000', agent_start_time: '3100' }
      }

      const { error } = await resumeUpdate(xapi, unfinishedB({ rebooting: true }))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [[]])
    })

    it('gives up on a host which does not come back in time', async function () {
      const xapi = new FakeXapi([0, 0])
      Object.assign(xapi.hosts[1], { live: false, reboot: () => new Promise(() => {}) })
      xapi._restartHostTimeout = 10

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.match(error?.message, /host-B took too long to restart/)
      assert.deepEqual(xapi.steps, [])
    })

    describe('with patches released since the first attempt', function () {
      const resumeWithInventory = (patchInventory, { doneHostIds = [], unfinishedHosts = {} } = {}) => ({
        ...resumeOf(true, unfinishedHosts),
        doneHostIds: new Set(doneHostIds),
        patchInventory,
      })
      const replan = (xapi, resume) => {
        const calls = []
        const recorder = {
          ...noopRpuRecorder,
          setPatchInventory: (...args) => calls.push(['setPatchInventory', ...args]),
          reopenHost: hostId => calls.push(['reopenHost', hostId]),
        }
        return rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true, recorder, resume }).then(error => ({
          error,
          calls,
        }))
      }

      it('updates again a host a previous attempt finished, without the patches already applied', async function () {
        const xapi = new FakeXapi([1, 2])

        const { error, calls } = await replan(
          xapi,
          resumeWithInventory({ 'host-A': true, 'host-B': true }, { doneHostIds: ['host-A'] })
        )

        assert.equal(error, undefined)
        assert.deepEqual(calls, [
          ['setPatchInventory', { 'host-A': true, 'host-B': true }, ['host-A']],
          ['reopenHost', 'host-A'],
        ])
        assert.deepEqual([...xapi.resume.doneHostIds], [])
        assert.deepEqual(xapi.steps, [['host-A', 'host-B']])
        // installPatches only installs what the host is missing now
        assert.deepEqual(xapi.installs, [['host-A'], ['host-B']])
        assert.deepEqual(xapi.taskProperties.planChange, { addedHostIds: ['host-A'] })
      })

      it('updates a master which was already current when the run started', async function () {
        const xapi = new FakeXapi([1, 2])

        const { error, calls } = await replan(xapi, resumeWithInventory({ 'host-A': false, 'host-B': true }))

        assert.equal(error, undefined)
        assert.deepEqual(calls, [['setPatchInventory', { 'host-A': true, 'host-B': true }, ['host-A']]])
        assert.deepEqual(xapi.steps, [['host-A', 'host-B']])
        assert.deepEqual(xapi.taskProperties.planChange, { addedHostIds: ['host-A'] })
      })

      it('reports no change when the remaining work is the one planned', async function () {
        const xapi = new FakeXapi([0, 2])

        const { error, calls } = await replan(
          xapi,
          resumeWithInventory({ 'host-A': true, 'host-B': true }, { doneHostIds: ['host-A'] })
        )

        assert.equal(error, undefined)
        assert.deepEqual(calls, [['setPatchInventory', { 'host-A': false, 'host-B': true }, []]])
        assert.deepEqual([...xapi.resume.doneHostIds], ['host-A'])
        assert.deepEqual(xapi.steps, [['host-B']])
        assert.equal(xapi.taskProperties.planChange, undefined)
      })

      // host-A finished and reopened, host-B disabled before its update, host-C
      // patched and disabled, its reboot still to do
      const leftDisabled = (xapi, enabledBeforeUpdate) => {
        xapi.hosts[1].enabled = xapi.hosts[2].enabled = false
        const unfinished = { agentStartedAtBeforeUpdate: '2000', enabledBeforeUpdate }
        return resumeWithInventory(
          { 'host-A': true, 'host-B': true, 'host-C': true },
          { doneHostIds: ['host-A'], unfinishedHosts: { 'host-B': unfinished, 'host-C': unfinished } }
        )
      }

      it('enables again the hosts the previous attempt left disabled, before the reboots', async function () {
        const xapi = new FakeXapi([1, 1, 0])
        const { rollingPoolReboot } = xapi
        let enabledAtReboot
        xapi.rollingPoolReboot = function (...args) {
          enabledAtReboot = this.hosts.map(host => host.enabled)
          return rollingPoolReboot.apply(this, args)
        }

        const { error } = await replan(xapi, leftDisabled(xapi, true))

        assert.equal(error, undefined)
        assert.deepEqual(xapi.enabledHosts, ['host-B', 'host-C'])
        // the reopened master can evacuate its VMs to them
        assert.deepEqual(enabledAtReboot, [true, true, true])
        assert.deepEqual(xapi.steps, [['host-A', 'host-B', 'host-C']])
        assert.deepEqual(xapi.installs, [['host-A'], ['host-B']])
        // host-C runs its former hypervisor until it reboots: the master's VMs
        // cannot go to it before. host-B, with patches to install, waits for
        // the master
        assert.deepEqual(xapi.rebootFirstHostIds, ['host-C'])
      })

      it('leaves disabled the hosts the operator had disabled, even for a reopened master', async function () {
        const xapi = new FakeXapi([1, 1, 0])

        const { error } = await replan(xapi, leftDisabled(xapi, false))

        assert.equal(error, undefined)
        assert.deepEqual(xapi.enabledHosts, [])
      })

      it('applies on XenServer 8.4+ too', async function () {
        const xapi = new FakeXapi([1, 2], { softwareVersion: XS_CDN })

        const { error } = await replan(
          xapi,
          resumeWithInventory({ 'host-A': true, 'host-B': true }, { doneHostIds: ['host-A'] })
        )

        assert.equal(error, undefined)
        assert.deepEqual(xapi.steps, [['host-A', 'host-B']])
        assert.deepEqual(xapi.installs, [['host-A'], ['host-B']])
        assert.deepEqual(xapi.taskProperties.planChange, { addedHostIds: ['host-A'] })
      })
    })

    it('checks only the mandatory pending guidances of the hosts the run patched, before and after the reboots', async function () {
      const xapi = new FakeXapi([0, 2], { softwareVersion: XS_CDN })

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      // PENDING_GUIDANCES_LEVEL: 0 is mandatory, 2 is full; before and after the reboots
      assert.deepEqual(xapi.guardLevels, { 'host-A': [0, 0], 'host-B': [0, 0] })
      assert.deepEqual(xapi.updatesEndpointCalls.slice(0, 2), ['remove', 'fetch'])
    })

    it('checks every pending guidance of a host the run did not patch', async function () {
      const xapi = new FakeXapi([0, 2], { softwareVersion: XS_CDN })

      const { error } = await resumeUpdate(xapi, resumeOf(true))

      assert.equal(error, undefined)
      assert.deepEqual(xapi.guardLevels, { 'host-A': [0, 0], 'host-B': [2, 2] })
    })

    it('leaves the LINSTOR packages alone once a host started with them', async function () {
      const xapi = new FakeXapi([0, 2], { linstor: true })

      const error = await rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true, resume: resumeOf(true) })

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, [['host-B']])
    })

    it('updates the LINSTOR packages when the previous attempt stopped before any host', async function () {
      const xapi = new FakeXapi([1, 2], { linstor: true })

      const error = await rollingPoolUpdate(xapi, { resume: resumeOf(false) })

      assert.equal(error, undefined)
      assert.deepEqual(xapi.steps, ['linstor', ['host-A', 'host-B']])
    })

    // the previous attempt may have stopped while LINSTOR was recovering from
    // what it did: a restart of its services, the reboot of a host
    it('waits for LINSTOR to be healthy instead of refusing the pool', async function () {
      const xapi = new FakeXapi([0, 2], { linstor: true })
      xapi.linstorHealth = new Error('must not be checked')

      const error = await rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true, resume: resumeOf(true) })

      assert.equal(error, undefined)
      assert.deepEqual(xapi.linstorEvents, ['wait', 'reboot host-B', 'wait'])
    })

    it('waits for LINSTOR to be healthy before a host which only has to reboot', async function () {
      const xapi = new FakeXapi([0, 0], { linstor: true })

      const { error } = await resumeUpdate(xapi, unfinishedB())

      assert.equal(error, undefined)
      assert.deepEqual(xapi.linstorEvents, ['wait', 'reboot host-B', 'wait'])
    })
  })
})

describe('_updateLinstorPackages()', function () {
  // Fake XAPI of a pool of 3 hosts, recording the plugin calls and the wait for
  // LINSTOR to be healthy in order
  const updateLinstorPackages = async controllerHosts => {
    const calls = []
    const xapi = Object.assign(Object.create(patchingMethods), {
      pool: { uuid: 'pool-1' },
      objects: {
        indexes: {
          type: {
            host: Object.fromEntries(
              ['A', 'B', 'C'].map(letter => [
                `OpaqueRef:host-${letter}`,
                { $ref: `host-${letter}`, uuid: `host-${letter}` },
              ])
            ),
          },
        },
      },
      async call(method, hostRef, plugin, fn, args) {
        assert.equal(method, 'host.call_plugin')
        if (fn === 'hasControllerRunning') {
          assert.equal(plugin, 'linstor-manager')
          calls.push(`${hostRef} ${fn}`)
          // Python's `str(bool)`
          return controllerHosts.includes(hostRef) ? 'True' : 'False'
        }
        calls.push(`${hostRef} ${fn} ${args.packages ?? args.service}`)
      },
      async _waitLinstorHealthy() {
        calls.push('wait')
      },
    })
    await new Task({ properties: { name: 'test' } }).run(() => xapi._updateLinstorPackages())
    return calls
  }
  const onEveryHost = call => ['host-A', 'host-B', 'host-C'].map(host => `${host} ${call}`)
  const UPDATES = ['xcp-ng-xapi-plugins', 'xcp-ng-linstor', 'linstor-satellite', 'linstor-controller'].flatMap(
    packages => onEveryHost(`update ${packages}`)
  )

  it('stops the controller only on the host running it, then waits for LINSTOR once the satellites restarted', async function () {
    assert.deepEqual(await updateLinstorPackages(['host-B']), [
      ...onEveryHost('hasControllerRunning'),
      ...UPDATES,
      'host-B stop_service linstor-controller',
      ...onEveryHost('restart_service linstor-satellite'),
      'wait',
    ])
  })

  it('stops no controller when none is running', async function () {
    assert.deepEqual(await updateLinstorPackages([]), [
      ...onEveryHost('hasControllerRunning'),
      ...UPDATES,
      ...onEveryHost('restart_service linstor-satellite'),
      'wait',
    ])
  })

  it('changes nothing when several controllers are running', async function () {
    await assert.rejects(updateLinstorPackages(['host-A', 'host-C']), {
      message: 'LINSTOR controller running on several hosts: host-A, host-C',
    })
  })
})

describe('_waitLinstorHealthy()', function () {
  it('does not wait on a pool whose plugin is too old to check LINSTOR', async function () {
    const xapi = Object.assign(Object.create(patchingMethods), {
      _restartHostTimeout: 60e3,
      pool: { uuid: 'pool-1', master: 'host-A' },
      objects: {
        indexes: { type: { SR: { sr: { type: 'linstor', $PBDs: [{ device_config: { 'group-name': 'group' } }] } } } },
      },
      async call() {
        throw Object.assign(new Error('UNKNOWN_XENAPI_PLUGIN_FUNCTION(healthCheck)'), {
          code: 'UNKNOWN_XENAPI_PLUGIN_FUNCTION',
        })
      },
    })

    await new Task({ properties: { name: 'test' } }).run(() => xapi._waitLinstorHealthy())
  })
})

describe('supportsRpuRecovery()', function () {
  for (const [productBrand, productVersion, expected] of [
    ['XCP-ng', '8.2.1', true],
    ['XCP-ng', '8.3.0', true],
    ['XenServer', '8.4.0', true],
    ['XenServer', '8.2.1', false],
    ['XenServer', '7.1.0', false],
    ['Citrix Hypervisor', '8.2.1', false],
  ]) {
    it(`is ${expected} for a ${productBrand} ${productVersion} master`, function () {
      const host = { software_version: { product_brand: productBrand, product_version: productVersion } }
      assert.equal(supportsRpuRecovery(host), expected)
    })
  }
})
