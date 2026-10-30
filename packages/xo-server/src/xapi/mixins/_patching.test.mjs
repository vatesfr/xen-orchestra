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
          SR: linstor ? { 'OpaqueRef:sr-linstor': { $type: 'SR', type: 'linstor' } } : {},
          VM: {},
        },
      },
    }
    this.pool = { uuid: 'pool-1', $master: this.hosts[0] }

    // pool-wide steps in order: 'linstor' for a LINSTOR packages update, the
    // hosts handled (ie not ignored) for a rolling pool reboot
    this.steps = []

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

  async _updateLinstorPackages() {
    this.steps.push('linstor')
  }

  async rollingPoolReboot(parentTask, { beforeEvacuateVms, beforeRebootHost, ignoreHost, rebootFirst, resume }) {
    this.resume = resume
    this.rebootFirstHostIds = this.hosts.filter(host => rebootFirst?.(host) ?? false).map(host => host.uuid)
    const handledHosts = this.hosts.filter(host => !resume.doneHostIds.has(host.uuid) && !ignoreHost(host))
    this.steps.push(handledHosts.map(host => host.uuid))
    await beforeEvacuateVms()
    for (const host of handledHosts) {
      await beforeRebootHost(host)
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
