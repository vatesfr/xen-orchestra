import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import poolMethods from './pool.mjs'
import { noopRpuRecorder } from '../../_rpuRecovery.mjs'

const { describe, it } = test

const HOST_CAPACITY = 100

// Fake XAPI modelling only what the migrate back phase depends on: where the
// VMs run, and how much memory is left on each host.
class FakeXapi {
  // vmMemoriesByHost: memory of the VMs initially running on each host
  //
  // memoryTakenByHostAfterReboots: memory each host loses to something else
  // once the whole pool has rebooted, ie during the migrate back phase
  //
  // vmsDestroyedAfterReboots: VMs which disappear once the whole pool has
  // rebooted, as if an operator had destroyed them during the run
  constructor(vmMemoriesByHost, memoryTakenByHostAfterReboots = [], vmsDestroyedAfterReboots = []) {
    this.hosts = []
    this.vms = []
    vmMemoriesByHost.forEach((memories, i) => {
      const letter = String.fromCharCode(65 + i)
      const host = {
        $type: 'host',
        $ref: `OpaqueRef:host-${letter}`,
        $id: `host-${letter}`,
        uuid: `host-${letter}`,
        name_label: `host ${letter}`,
        metrics: `OpaqueRef:metrics-${letter}`,
        $metrics: { live: true },
        enabled: true,
        other_config: { agent_start_time: '0' },
        $call: async method => {
          if (method === 'get_vms_which_prevent_evacuation') {
            return {}
          }
          if (method !== 'assert_can_evacuate') {
            throw new Error(`unexpected host.$call ${method}`)
          }
        },
      }
      this.hosts.push(host)
      memories.forEach((memory, j) => {
        const id = `${letter.toLowerCase()}${j + 1}`
        this.vms.push({
          $type: 'VM',
          $ref: `OpaqueRef:vm-${id}`,
          $id: `vm-${id}`,
          uuid: `vm-${id}`,
          name_label: `vm ${id}`,
          power_state: 'Running',
          is_control_domain: false,
          memory,
          $resident_on: host,
        })
      })
    })

    this.homeOf = new Map(this.vms.map(vm => [vm.uuid, vm.$resident_on.uuid]))
    // no SR: a pool without TWINSTOR, which the rolling run does not wait on
    this.objects = { all: [...this.hosts, ...this.vms], indexes: { type: { SR: {} } } }
    this.pool = {
      uuid: 'pool-1',
      master: this.hosts[0].$ref,
      ha_enabled: false,
      other_config: {},
      update_other_config: async () => {},
    }
    this._restartHostTimeout = 60e3
    this._vmShutdownTimeout = 60e3

    this._memoryTakenByHost = memoryTakenByHostAfterReboots
    this._vmsDestroyedAfterReboots = vmsDestroyedAfterReboots
    this._nReboots = 0

    // migrations back, the evacuations go through clearHost
    this.nMigrations = 0
  }

  _find(key) {
    return this.getObject(key)
  }

  _residentVms(host) {
    return this.vms.filter(vm => vm.$resident_on === host)
  }

  _free(host) {
    const taken = this._nReboots < this.hosts.length ? 0 : (this._memoryTakenByHost[this.hosts.indexOf(host)] ?? 0)
    return HOST_CAPACITY - this._residentVms(host).reduce((sum, vm) => sum + vm.memory, 0) - taken
  }

  // VMs which are not running on the host they started the run on
  strayedVms() {
    return this.vms.filter(vm => vm.$resident_on.uuid !== this.homeOf.get(vm.uuid)).map(vm => vm.uuid)
  }

  // same contract as xen-api: only throws when no default value is passed
  getObject(key, defaultValue) {
    const object = [...this.hosts, ...this.vms].find(_ => _.uuid === key || _.$ref === key)
    if (object === undefined && arguments.length < 2) {
      throw new Error(`no such object ${key}`)
    }
    return object ?? defaultValue
  }

  async getField(type, ref, field) {
    assert.equal(type, 'host')
    assert.equal(field, 'resident_VMs')
    return this._residentVms(this._find(ref)).map(vm => vm.$ref)
  }

  async barrier() {}

  async _waitObjectState() {}

  async call(method) {
    if (method !== 'host.get_servertime') {
      throw new Error(`unexpected call ${method}`)
    }
    return '0'
  }

  async callAsync(method) {
    if (method !== 'host.reboot') {
      throw new Error(`unexpected callAsync ${method}`)
    }
    this._nReboots++
    if (this._nReboots === this.hosts.length) {
      this.vms = this.vms.filter(vm => !this._vmsDestroyedAfterReboots.includes(vm.uuid))
    }
  }

  // host.evacuate. XAPI does its own placement, this is an approximation: pack
  // each VM onto the emptiest host with enough memory
  async clearHost(host) {
    for (const vm of this._residentVms(host)) {
      const target = this.hosts
        .filter(_ => _ !== host && this._free(_) >= vm.memory)
        .sort((a, b) => this._free(b) - this._free(a))[0]
      if (target === undefined) {
        throw Object.assign(new Error('CANNOT_EVACUATE_HOST'), { code: 'CANNOT_EVACUATE_HOST' })
      }
      vm.$resident_on = target
    }
  }

  async migrateVm(vmId, xapi, hostId) {
    this.nMigrations++
    const vm = this._find(vmId)
    const target = this._find(hostId)
    if (this._free(target) < vm.memory) {
      throw Object.assign(new Error(`HOST_NOT_ENOUGH_FREE_MEMORY ${vm.uuid} -> ${target.uuid}`), {
        code: 'HOST_NOT_ENOUGH_FREE_MEMORY',
        params: [target.$ref, vm.$ref],
      })
    }
    vm.$resident_on = target
  }
}

// the mixin reaches its own methods through `this`
Object.setPrototypeOf(FakeXapi.prototype, poolMethods)

// records only the step transitions, the rest of the recorder is a no-op
const stepSpyRecorder = () => {
  const steps = []
  const record = status => (hostId, name) => steps.push({ status, hostId, name })
  return {
    ...noopRpuRecorder,
    steps,
    stepRunning: record('running'),
    stepObserved: record('observed'),
    stepNotNeeded: record('not-needed'),
    stepFailed: record('failed'),
  }
}

const rollingPoolReboot = async (xapi, options) => {
  const events = []
  const parentTask = new Task({
    properties: { name: 'rolling pool reboot', progress: 0 },
    onProgress: event => events.push(event),
  })

  let error
  await parentTask.run(async () => {
    try {
      await poolMethods.rollingPoolReboot.call(xapi, parentTask, options)
    } catch (err) {
      error = err
    }
  })

  const strandedVms = events.findLast(_ => _.type === 'property' && _.name === 'strandedVms')?.value ?? []
  const taskNames = events.filter(_ => _.type === 'start').map(_ => _.properties.name)
  return { error, strandedVms, taskNames }
}

describe('rollingPoolReboot', function () {
  it('brings every VM back to the host it was running on', async function () {
    const xapi = new FakeXapi([
      [30, 30],
      [30, 30],
      [30, 30],
      [30, 30],
    ])

    const { error } = await rollingPoolReboot(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.strayedVms(), [])
  })

  it('retries the migrations rejected for lack of memory', async function () {
    // host B is only freed by the migrations of the hosts handled after it, so
    // its second VM is rejected on the first pass whatever the order of hosts
    const xapi = new FakeXapi([[30], [40, 40], [10], [10]])

    const { error } = await rollingPoolReboot(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.strayedVms(), [])
  })

  it('reports the VMs it could not bring back instead of failing the whole run', async function () {
    // 45 units of host B are taken while the pool reboots: its own VMs no
    // longer fit, and no retry can ever change that
    const xapi = new FakeXapi(
      [
        [30, 30],
        [30, 30],
        [30, 30],
        [30, 30],
      ],
      [0, 45]
    )

    const recorder = stepSpyRecorder()
    const { error, strandedVms } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error, undefined)
    assert.deepEqual(strandedVms.map(_ => _.vmId).sort(), ['vm-a2', 'vm-b1', 'vm-b2'])
    for (const strandedVm of strandedVms) {
      assert.equal(strandedVm.code, 'HOST_NOT_ENOUGH_FREE_MEMORY')
      assert.equal(strandedVm.hostId, xapi.homeOf.get(strandedVm.vmId))
    }

    // the recovery record must show the hosts whose VMs are not back, and only
    // once the retry passes have given up on them
    const failed = recorder.steps.filter(_ => _.status === 'failed' && _.name === 'restoreVms')
    assert.deepEqual([...new Set(failed.map(_ => _.hostId))].sort(), ['host-A', 'host-B'])
  })

  it('skips the VMs destroyed while the pool was rebooting', async function () {
    const xapi = new FakeXapi(
      [
        [30, 30],
        [30, 30],
        [30, 30],
        [30, 30],
      ],
      [],
      ['vm-a2']
    )

    const { error, strandedVms } = await rollingPoolReboot(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(strandedVms, [])
    assert.deepEqual(xapi.strayedVms(), [])
  })

  it('persists the settings it changes before changing them, and how each host was before', async function () {
    const xapi = new FakeXapi([[30], [30]])
    const events = []
    xapi.pool.ha_enabled = true
    xapi.pool.$ha_statefiles = []
    xapi.pool.ha_configuration = {}
    xapi.pool.other_config.auto_poweron = 'true'
    xapi.pool.update_other_config = async (key, value) => events.push(['other_config', key, value])
    // disabled by the operator before the run
    xapi.hosts[1].enabled = false
    const call = xapi.call.bind(xapi)
    xapi.call = async (method, ...args) =>
      method === 'pool.disable_ha' || method === 'pool.enable_ha'
        ? events.push(['call', method])
        : call(method, ...args)
    const recorder = {
      ...noopRpuRecorder,
      async settingChangedByRun(name) {
        events.push(['record', name])
      },
      hostStarting(hostId, agentStartTime, enabled) {
        events.push(['hostStarting', hostId, enabled])
      },
    }

    const { error } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error, undefined)
    assert.deepEqual(events, [
      ['record', 'ha'],
      ['call', 'pool.disable_ha'],
      ['record', 'autoPowerOn'],
      ['other_config', 'auto_poweron', 'false'],
      ['hostStarting', 'host-A', true],
      ['hostStarting', 'host-B', false],
      ['other_config', 'auto_poweron', 'true'],
      ['call', 'pool.enable_ha'],
    ])
  })

  it('does not migrate the VMs back when the pool opted out', async function () {
    const xapi = new FakeXapi([
      [30, 30],
      [30, 30],
      [30, 30],
      [30, 30],
    ])
    xapi.pool.other_config['xo:rpuMigrateVmsBack'] = 'false'

    const recorder = stepSpyRecorder()
    const { error, taskNames } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error, undefined)
    assert.equal(xapi.nMigrations, 0)
    assert.notDeepEqual(xapi.strayedVms(), [])

    // the skipped phase leaves a trace, otherwise it cannot be told apart from
    // a run which died before reaching it
    assert.ok(taskNames.includes('Skip migrating VMs back'))
    assert.ok(!taskNames.includes('Migrate VMs back'))

    // a skipped phase must not leave `restoreVms` pending, otherwise the
    // recovery record shows a finished run as still running
    const notNeeded = recorder.steps.filter(_ => _.status === 'not-needed' && _.name === 'restoreVms')
    assert.deepEqual(
      notNeeded.map(_ => _.hostId).sort(),
      xapi.hosts.map(_ => _.uuid)
    )
  })
})

// Records what the run asks of XAPI, and plays HA and the pool settings as no-ops
const instrument = xapi => {
  const log = []
  const getField = xapi.getField.bind(xapi)
  xapi.getField = async (type, ref, field) => {
    log.push(['getField', type, field])
    return getField(type, ref, field)
  }
  const call = xapi.call.bind(xapi)
  xapi.call = async (method, ...args) => {
    log.push(['call', method])
    if (method === 'pool.disable_ha' || method === 'pool.enable_ha') {
      return
    }
    return call(method, ...args)
  }
  const callAsync = xapi.callAsync.bind(xapi)
  xapi.callAsync = async (method, ...args) => {
    log.push(['callAsync', method, args[0]])
    return callAsync(method, ...args)
  }
  const clearHost = xapi.clearHost.bind(xapi)
  xapi.clearHost = async host => {
    log.push(['clearHost', host.uuid])
    return clearHost(host)
  }
  xapi.enableHost = async hostId => {
    log.push(['enableHost', hostId])
  }
  xapi.pool.update_other_config = async (key, value) => log.push(['other_config', key, value])
  return log
}

const withHaAndAutoPowerOn = xapi => {
  xapi.pool.ha_enabled = true
  xapi.pool.$ha_statefiles = []
  xapi.pool.ha_configuration = {}
  xapi.pool.other_config.auto_poweron = 'true'
  return xapi
}

const restoredHaAndAutoPowerOn = log =>
  log.some(_ => _[0] === 'call' && _[1] === 'pool.enable_ha') &&
  log.some(_ => _[0] === 'other_config' && _[1] === 'auto_poweron' && _[2] === 'true')

// most pools have no TWINSTOR SR: the gate must cost them nothing
describe('rollingPoolReboot without TWINSTOR', function () {
  for (const [label, setup] of [
    ['no SR at all', () => {}],
    [
      'no SR index',
      xapi => {
        xapi.objects.indexes.type = {}
      },
    ],
    [
      'unrelated SRs and leftover TWINSTOR keys on the hosts',
      xapi => {
        xapi.objects.indexes.type.SR = {
          a: { $type: 'SR', $ref: 'OpaqueRef:sr-a', other_config: { 'xo:foo': 'bar', 'twinstor-version': '0.5' } },
          b: { $type: 'SR', $ref: 'OpaqueRef:sr-b' },
          c: { $type: 'SR', $ref: 'OpaqueRef:sr-c', other_config: null },
        }
        for (const host of xapi.hosts) {
          host.other_config = { ...host.other_config, 'twinstor-version': '0.5.0', 'twinstor-alive': '1' }
        }
      },
    ],
  ]) {
    it(`creates no TWINSTOR task and makes no extra XAPI call (${label})`, async function () {
      const xapi = new FakeXapi([[30], [30], [30]])
      setup(xapi)
      const log = instrument(xapi)

      const { error, taskNames } = await rollingPoolReboot(xapi)

      assert.equal(error, undefined)
      assert.deepEqual(
        taskNames.filter(_ => /TWINSTOR/i.test(_)),
        []
      )
      assert.deepEqual(
        log.filter(_ => _[0] === 'getField' && _[2] === 'other_config'),
        []
      )
      assert.deepEqual(
        log.filter(_ => _[0] === 'call').map(_ => _[1]),
        ['host.get_servertime', 'host.get_servertime', 'host.get_servertime']
      )
      assert.deepEqual(
        log.filter(_ => _[0] === 'enableHost'),
        []
      )
    })
  }

  it('puts an evacuated host back in service when a step fails before its reboot', async function () {
    const xapi = new FakeXapi([[30], [30]])
    const log = instrument(xapi)

    const { error } = await rollingPoolReboot(xapi, {
      beforeRebootHost: async () => {
        throw new Error('yum failed')
      },
    })

    assert.equal(error?.message, 'yum failed')
    assert.deepEqual(
      log.filter(_ => _[0] === 'enableHost'),
      [['enableHost', 'host-A']]
    )
  })

  it('leaves a host the operator had disabled in maintenance when a step fails', async function () {
    const xapi = new FakeXapi([[30], [30]])
    xapi.hosts[0].enabled = false
    const log = instrument(xapi)

    const { error } = await rollingPoolReboot(xapi, {
      beforeRebootHost: async () => {
        throw new Error('yum failed')
      },
    })

    assert.equal(error?.message, 'yum failed')
    assert.deepEqual(
      log.filter(_ => _[0] === 'enableHost'),
      []
    )
  })

  it('does not call a host which was sent to reboot, and restores the pool settings straight away', async function () {
    const xapi = withHaAndAutoPowerOn(new FakeXapi([[30], [30]]))
    const log = instrument(xapi)
    let nWaits = 0
    xapi._waitObjectState = async () => {
      // the first wait is the metrics before the evacuation, the second the host coming back
      if (++nWaits === 2) {
        throw new Error('Host host-A took too long to restart')
      }
    }

    const { error } = await rollingPoolReboot(xapi)

    assert.match(error?.message ?? '', /took too long/)
    const afterReboot = log.slice(log.findIndex(_ => _[0] === 'callAsync' && _[1] === 'host.reboot') + 1)
    assert.deepEqual(
      afterReboot.map(_ => _.slice(0, 2)),
      [
        ['other_config', 'auto_poweron'],
        ['call', 'pool.enable_ha'],
      ]
    )
  })

  it('stops on an abort which lands while the run is still setting up, before any host is touched', async function () {
    const xapi = withHaAndAutoPowerOn(new FakeXapi([[30], [30]]))
    const log = instrument(xapi)
    const parentTask = new Task({ properties: { name: 'rolling pool reboot' } })
    const call = xapi.call
    xapi.call = async (method, ...args) => {
      // disabling HA takes long enough for the user to give up meanwhile
      if (method === 'pool.disable_ha') {
        parentTask.abort('aborted by the user')
      }
      return call(method, ...args)
    }

    let error
    await parentTask
      .run(async () => {
        try {
          await poolMethods.rollingPoolReboot.call(xapi, parentTask)
        } catch (err) {
          error = err
        }
      })
      .catch(() => {})

    assert.equal(error, 'aborted by the user')
    assert.deepEqual(
      log.filter(_ => _[0] === 'clearHost' || _[1] === 'host.reboot'),
      []
    )
    assert.ok(restoredHaAndAutoPowerOn(log))
  })

  it('changes nothing on the pool when aborted before it starts', async function () {
    const xapi = withHaAndAutoPowerOn(new FakeXapi([[30], [30]]))
    const log = instrument(xapi)
    const parentTask = new Task({ properties: { name: 'rolling pool reboot' } })

    let error
    await parentTask
      .run(async () => {
        parentTask.abort('aborted by the user')
        try {
          await poolMethods.rollingPoolReboot.call(xapi, parentTask)
        } catch (err) {
          error = err
        }
      })
      .catch(() => {})

    assert.equal(error, 'aborted by the user')
    assert.deepEqual(log, [])
  })

  it('stops after the host being handled when aborted, and leaves the VMs where the evacuation put them', async function () {
    const xapi = withHaAndAutoPowerOn(new FakeXapi([[30], [30], [30]]))
    const log = instrument(xapi)
    const parentTask = new Task({ properties: { name: 'rolling pool reboot' } })
    const callAsync = xapi.callAsync
    xapi.callAsync = async (...args) => {
      await callAsync(...args)
      if (args[0] === 'host.reboot') {
        parentTask.abort('aborted by the user')
      }
    }

    let error
    await parentTask
      .run(async () => {
        try {
          await poolMethods.rollingPoolReboot.call(xapi, parentTask)
        } catch (err) {
          error = err
        }
      })
      .catch(() => {})

    assert.equal(error, 'aborted by the user')
    assert.equal(xapi._nReboots, 1)
    assert.ok(restoredHaAndAutoPowerOn(log))
    // the rebooted host came back enabled by itself
    assert.deepEqual(
      log.filter(_ => _[0] === 'enableHost'),
      []
    )
    assert.equal(xapi.nMigrations, 0)
    assert.deepEqual(xapi.strayedVms(), ['vm-a1'])
  })
})

describe('_assertTwinstorSyncedAround without TWINSTOR', function () {
  for (const bypass of [false, true]) {
    it(`runs the operation once and passes its error through untouched (bypass: ${bypass})`, async function () {
      const calls = []
      const xapi = {
        ...poolMethods,
        objects: {
          all: { h: { $type: 'host', $ref: 'h', other_config: { 'twinstor-version': '1' } } },
          indexes: { type: {} },
        },
        getField: async () => calls.push('getField'),
        call: async () => calls.push('call'),
        enableHost: async () => calls.push('enableHost'),
      }

      let nRuns = 0
      await xapi._assertTwinstorSyncedAround('h', bypass, async () => {
        nRuns++
      })
      assert.equal(nRuns, 1)

      const original = Object.assign(new Error('CANNOT_EVACUATE_HOST'), { code: 'CANNOT_EVACUATE_HOST' })
      await assert.rejects(
        xapi._assertTwinstorSyncedAround('h', bypass, async () => {
          throw original
        }),
        error => error === original
      )

      await xapi.assertTwinstorSynced()
      assert.deepEqual(calls, [])
    })
  }
})

// ===================================================================
// TWINSTOR

const SR_REF = 'OpaqueRef:sr'
const HOST_REF = 'OpaqueRef:host'

// the pool's clock, which is what the stamps are dated against
const NOW = 1_700_000_000
const stamp = (secondsAgo = 0) => String(NOW - secondsAgo)

const SYNCED = {
  'twinstor-schema': '1',
  'twinstor-managed': 'true',
  'twinstor-synced': 'true',
  'twinstor-storage-state': 'synced',
  'twinstor-sync-pct': '100',
  'twinstor-updated-at': stamp(),
}
const SYNCING = {
  ...SYNCED,
  'twinstor-synced': 'false',
  'twinstor-storage-state': 'syncing',
  'twinstor-sync-pct': '30',
}
const DAEMON_UP = { 'twinstor-version': '0.5.0', 'twinstor-alive': stamp() }

// the methods reach each other through `this`, so they are mixed in as they would be
const makeXapi = ({ SR = SYNCED, host = DAEMON_UP, getField } = {}) => ({
  ...poolMethods,
  otherConfigs: { SR, host },
  pool: { uuid: 'pool', master: HOST_REF },
  objects: {
    all: { [HOST_REF]: { $type: 'host', $ref: HOST_REF, other_config: host } },
    indexes: { type: { SR: {} } },
  },
  call: async () => String(NOW),
  getField:
    getField ??
    async function (type) {
      return this.otherConfigs[type]
    },
  getObject: ref => ({ name_label: ref }),
})

const makeGate = ({ abortSignal, stamps, timeLeft = 0, pollInterval = 5 } = {}) => ({
  srRefs: [SR_REF],
  hostRefs: [HOST_REF],
  abortSignal,
  stamps,
  timeLeft,
  pollInterval,
})

// the stamps a fully synced pool publishes, as `_readTwinstor` reads them
const CURRENT_STAMPS = [SYNCED['twinstor-updated-at'], DAEMON_UP['twinstor-alive']]

describe('_readTwinstor', function () {
  it('accepts a synced pool it has no previous state for', async function () {
    const result = await makeXapi()._readTwinstor(makeGate())
    assert.equal(result.blockedBy, undefined)
    assert.deepEqual(result.stamps, CURRENT_STAMPS)
  })

  // with no earlier state to compare against, only the stamp's age can say
  // whether the pool master is still speaking
  it('refuses a state which has aged out, when it has nothing to compare against', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-updated-at': stamp(200) } })
    const result = await xapi._readTwinstor(makeGate())
    assert.match(result.blockedBy, /has not published its state recently/)

    const daemonDown = makeXapi({ host: { ...DAEMON_UP, 'twinstor-alive': stamp(200) } })
    assert.match((await daemonDown._readTwinstor(makeGate())).blockedBy, /daemon is not running/)
  })

  it('reports a running resync, with the SR and its progress', async function () {
    const result = await makeXapi({ SR: SYNCING })._readTwinstor(makeGate())
    assert.equal(result.blockedBy, `${SR_REF} is syncing`)
    assert.equal(result.progress, 30)
  })

  // the case this whole gate exists for: a host which just rebooted leaves the
  // record frozen on the `synced` which allowed its reboot, so only a state
  // published since then is a verdict on the pool as it is now
  it('refuses a state which has not been republished since the last one it accepted', async function () {
    const frozen = await makeXapi()._readTwinstor(makeGate({ stamps: CURRENT_STAMPS }))
    assert.match(frozen.blockedBy, /has not published its state since the last host rebooted/)

    const republished = await makeXapi()._readTwinstor(makeGate({ stamps: ['999', '999'] }))
    assert.equal(republished.blockedBy, undefined)
  })

  // DRBD keeps replicating in the kernel without the daemon, so the pair looks
  // healthy while a node has no supervision at all
  it('refuses to reboot while a daemon has stopped stamping, however healthy the storage', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-updated-at': '2000' } })
    const result = await xapi._readTwinstor(makeGate({ stamps: CURRENT_STAMPS }))
    assert.equal(result.blockedBy, `the TWINSTOR daemon is not running on ${HOST_REF}`)
  })

  it('refuses a state whose keys disagree with each other', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-storage-state': 'degraded' } })
    assert.equal((await xapi._readTwinstor(makeGate())).blockedBy, `${SR_REF} is degraded`)
  })

  it('fails at once on a schema it cannot interpret, rather than waiting out the timeout', async function () {
    await assert.rejects(
      () => makeXapi({ SR: { ...SYNCED, 'twinstor-schema': '2' } })._readTwinstor(makeGate()),
      /unsupported TWINSTOR schema/
    )
  })

  it('treats an unreadable state as not synced, not as a failure', async function () {
    const getField = async () => {
      throw new Error('ECONNRESET')
    }
    const result = await makeXapi({ getField })._readTwinstor(makeGate())
    assert.match(result.blockedBy, /could not be read/)
  })

  // parseDateTime throws on an input it does not recognize, which would kill a
  // rolling run instead of being retried on the next poll
  it('treats an unreadable pool clock as not synced either', async function () {
    const xapi = makeXapi()
    xapi.call = async () => undefined
    const result = await xapi._readTwinstor(makeGate())
    assert.match(result.blockedBy, /could not be read/)
  })
})

describe('assertTwinstorSynced', function () {
  it('does nothing on a pool without a TWINSTOR SR', async function () {
    // the fake pool advertises no SR, so the gate must not exist at all
    assert.equal(makeXapi()._getTwinstorGate(), undefined)
    await makeXapi().assertTwinstorSynced()
  })

  it('refuses an interactive reboot while the storage is catching up, rather than holding', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: SYNCING } }

    await assert.rejects(
      () => xapi.assertTwinstorSynced(),
      error => error.code === 25 /* incorrectState */ && /is syncing/.test(error.data.actual)
    )
  })

  it('lets a reboot through on a synced pool', async function () {
    const xapi = makeXapi()
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: SYNCED } }

    await xapi.assertTwinstorSynced()
  })
})

describe('_assertTwinstorSyncedAround', function () {
  const makeGatedXapi = otherConfig => {
    const xapi = makeXapi({ SR: otherConfig })
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: otherConfig } }
    xapi.enabled = []
    xapi.enableHost = async id => xapi.enabled.push(id)
    return xapi
  }

  it('runs the operation on a synced pool, and checks again afterwards', async function () {
    const xapi = makeGatedXapi(SYNCED)
    let ran = false
    await xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
      ran = true
    })
    assert.equal(ran, true)
    assert.deepEqual(xapi.enabled, [])
  })

  // an evacuation takes long enough for the peer to have gone away meanwhile
  it('refuses, and puts the host back in service, when the storage falls out of sync during the operation', async function () {
    const xapi = makeGatedXapi(SYNCED)

    await assert.rejects(
      () =>
        xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
          xapi.otherConfigs.SR = SYNCING
        }),
      error => error.code === 25 /* incorrectState */ && /is syncing/.test(error.data.actual)
    )
    assert.deepEqual(xapi.enabled, [HOST_REF], 'the evacuated host was re-enabled')
  })

  it('does not check at all when the caller bypasses', async function () {
    const xapi = makeGatedXapi(SYNCING)
    let ran = false
    await xapi._assertTwinstorSyncedAround(HOST_REF, true, async () => {
      ran = true
    })
    assert.equal(ran, true)
  })

  it('refuses before running the operation when the storage is already out of sync', async function () {
    const xapi = makeGatedXapi(SYNCING)
    let ran = false
    await assert.rejects(() =>
      xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
        ran = true
      })
    )
    assert.equal(ran, false, 'the host was not evacuated for a reboot which was never going to happen')
  })
})

describe('_waitForTwinstorSync', function () {
  it('does nothing on a pool without TWINSTOR', async function () {
    await makeXapi()._waitForTwinstorSync(undefined, {})
  })

  it('returns once the storage publishes a new synced state, and accepts it as the next baseline', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    const gate = makeGate({ stamps: CURRENT_STAMPS, timeLeft: 60e3 })

    setTimeout(() => {
      xapi.otherConfigs.SR = { ...SYNCED, 'twinstor-updated-at': '2000' }
      xapi.otherConfigs.host = { ...DAEMON_UP, 'twinstor-alive': '2000' }
    }, 20)

    await xapi._waitForTwinstorSync(gate, { name: 'Waiting for TWINSTOR storage to be in sync' })
    assert.deepEqual(gate.stamps, ['2000', '2000'])
  })

  it('throws rather than proceeding when the sync does not complete in time', async function () {
    await assert.rejects(
      () => makeXapi({ SR: SYNCING })._waitForTwinstorSync(makeGate(), { name: 'Waiting' }),
      error => /did not get back in sync in time/.test(error.message) && /is syncing/.test(error.message)
    )
  })

  it('draws every wait from one shared budget', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    const gate = makeGate({ timeLeft: 80, pollInterval: 20 })

    await assert.rejects(() => xapi._waitForTwinstorSync(gate, { name: 'Waiting' }))
    assert.equal(gate.timeLeft, 0, 'the first wait consumed the whole budget')

    // with nothing left, the next wait gives up at once rather than starting
    // another full timeout of its own
    const startedAt = Date.now()
    await assert.rejects(() => xapi._waitForTwinstorSync(gate, { name: 'Waiting' }))
    assert.ok(Date.now() - startedAt < 20, 'the second wait did not poll again')
  })

  it('gives up when the run is aborted, instead of waiting out the timeout', async function () {
    const parent = new Task({ properties: { name: 'Rolling pool reboot' } })
    const xapi = makeXapi({ SR: SYNCING })

    await assert.rejects(
      () =>
        parent.run(async () => {
          // abort while the gate is parked in its poll delay
          setTimeout(() => parent.abort('aborted by the user'), 20)
          return xapi._waitForTwinstorSync(makeGate({ abortSignal: Task.abortSignal, timeLeft: 60 * 60e3 }), {
            name: 'Waiting',
          })
        }),
      error => error === 'aborted by the user'
    )
  })

  it('gives up at once when the run was aborted before the wait started', async function () {
    const parent = new Task({ properties: { name: 'Rolling pool reboot' } })
    // not even read: an aborted run does not wait for a verdict
    const xapi = makeXapi({
      getField: async () => {
        throw new Error('read the storage state')
      },
    })

    await assert.rejects(
      () =>
        parent.run(async () => {
          const abortSignal = Task.abortSignal
          parent.abort('aborted by the user')
          return xapi._waitForTwinstorSync(makeGate({ abortSignal, timeLeft: 60 * 60e3 }), { name: 'Waiting' })
        }),
      error => error === 'aborted by the user'
    )
  })
})
