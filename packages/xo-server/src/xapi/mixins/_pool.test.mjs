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
    this.objects = { all: [...this.hosts, ...this.vms] }
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

// records the changes of the pool settings, and what the recorder is told
// about them and about the hosts
const settingsSpy = xapi => {
  const events = []
  xapi.pool.update_other_config = async (key, value) => events.push(['other_config', key, value])
  const call = xapi.call.bind(xapi)
  xapi.call = async (method, ...args) =>
    method === 'pool.disable_ha' || method === 'pool.enable_ha'
      ? events.push(['call', method, ...args])
      : call(method, ...args)
  // the heartbeat SRs of the tests
  const getObject = xapi.getObject.bind(xapi)
  xapi.getObject = (key, ...rest) => (key === 'sr-1' ? { $ref: 'OpaqueRef:sr-1' } : getObject(key, ...rest))
  const recorder = {
    ...noopRpuRecorder,
    async settingChangedByRun(name, value) {
      events.push(['record', name, value])
    },
    settingRestored(name) {
      events.push(['restored', name])
    },
    hostStarting(hostId, agentStartTime, enabled) {
      events.push(['hostStarting', hostId, enabled])
    },
  }
  return { events, recorder, xapi }
}

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
    const { events, recorder, xapi } = settingsSpy(new FakeXapi([[30], [30]]))
    xapi.pool.ha_enabled = true
    xapi.pool.$ha_statefiles = [{ SR: 'OpaqueRef:sr-1', $SR: { uuid: 'sr-1' } }]
    xapi.pool.ha_configuration = { timeout: '60' }
    xapi.pool.other_config.auto_poweron = 'true'
    // disabled by the operator before the run
    xapi.hosts[1].enabled = false

    const { error } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error, undefined)
    assert.deepEqual(events, [
      ['record', 'ha', { srs: ['sr-1'], configuration: { timeout: '60' } }],
      ['call', 'pool.disable_ha'],
      ['record', 'autoPowerOn', undefined],
      ['other_config', 'auto_poweron', 'false'],
      ['hostStarting', 'host-A', true],
      ['hostStarting', 'host-B', false],
      ['other_config', 'auto_poweron', 'true'],
      ['restored', 'autoPowerOn'],
      ['call', 'pool.enable_ha', ['OpaqueRef:sr-1'], { timeout: '60' }],
      ['restored', 'ha'],
    ])
  })

  it('leaves in the record a setting it could not restore', async function () {
    const { events, recorder, xapi } = settingsSpy(new FakeXapi([[30], [30]]))
    xapi.pool.ha_enabled = true
    xapi.pool.$ha_statefiles = [{ SR: 'OpaqueRef:sr-1', $SR: { uuid: 'sr-1' } }]
    xapi.pool.ha_configuration = {}
    const call = xapi.call
    xapi.call = async (method, ...args) => {
      const result = await call(method, ...args)
      if (method === 'pool.enable_ha') {
        throw new Error('SR_NOT_ATTACHED')
      }
      return result
    }

    const { error } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error, undefined)
    assert.equal(events.at(-1)[1], 'pool.enable_ha')
    assert.ok(!events.some(([name]) => name === 'restored'))
  })

  it('restores auto power on even when disabling it failed', async function () {
    const { events, recorder, xapi } = settingsSpy(new FakeXapi([[30], [30]]))
    xapi.pool.other_config.auto_poweron = 'true'
    xapi.pool.update_other_config = async (key, value) => {
      events.push(['other_config', key, value])
      if (value === 'false') {
        throw new Error('XAPI timeout')
      }
    }

    const { error } = await rollingPoolReboot(xapi, { recorder })

    assert.equal(error?.message, 'XAPI timeout')
    assert.deepEqual(events, [
      ['record', 'autoPowerOn', undefined],
      ['other_config', 'auto_poweron', 'false'],
      ['other_config', 'auto_poweron', 'true'],
      ['restored', 'autoPowerOn'],
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

  describe('resume', function () {
    // records which hosts the run touches and what it writes to the record
    const spyXapi = xapi => {
      const touched = []
      const clearHost = xapi.clearHost.bind(xapi)
      xapi.clearHost = async host => {
        touched.push(['evacuate', host.uuid])
        return clearHost(host)
      }
      const callAsync = xapi.callAsync.bind(xapi)
      xapi.callAsync = async (method, ref, ...args) => {
        touched.push([method, xapi.getObject(ref).uuid])
        return callAsync(method, ref, ...args)
      }
      return touched
    }
    const planSpyRecorder = () => {
      const recorder = stepSpyRecorder()
      recorder.calls = []
      recorder.setPlan = plan => recorder.calls.push(['setPlan', plan])
      recorder.hostStarting = hostId => recorder.calls.push(['hostStarting', hostId])
      recorder.hostSkipped = hostId => recorder.calls.push(['hostSkipped', hostId])
      return recorder
    }

    it('leaves the done hosts alone and brings every VM back to its host of the first attempt', async function () {
      const xapi = new FakeXapi([
        [30, 30],
        [30, 30],
        [30, 30],
      ])
      const vmHomeById = Object.fromEntries(xapi.homeOf)
      // first attempt: host A done, host B stopped in the middle of its
      // evacuation, host A's VMs not migrated back yet
      const [hostA, hostB, hostC] = xapi.hosts
      const vm = uuid => xapi.getObject(uuid)
      vm('vm-a1').$resident_on = hostB
      vm('vm-a2').$resident_on = hostC
      vm('vm-b1').$resident_on = hostA
      hostB.enabled = false
      // started after the first attempt: unknown to the record
      delete vmHomeById['vm-c2']

      const touched = spyXapi(xapi)
      const recorder = planSpyRecorder()
      const { error } = await rollingPoolReboot(xapi, {
        recorder,
        resume: {
          doneHostIds: new Set(['host-A']),
          hostOrder: ['host-A', 'host-B', 'host-C'],
          vmHomeById,
          haltedPinnedVms: {},
        },
      })

      assert.equal(error, undefined)
      assert.deepEqual(touched, [
        ['evacuate', 'host-B'],
        ['host.reboot', 'host-B'],
        ['evacuate', 'host-C'],
        ['host.reboot', 'host-C'],
      ])
      assert.deepEqual(xapi.strayedVms(), [])
      // the done host keeps its steps, and the record keeps the placement of
      // the first attempt
      assert.deepEqual(recorder.calls, [
        ['setPlan', { hostOrder: ['host-A', 'host-B', 'host-C'], vmHomeById: Object.fromEntries(xapi.homeOf) }],
        ['hostStarting', 'host-B'],
        ['hostStarting', 'host-C'],
      ])
      assert.ok(recorder.steps.some(_ => _.hostId === 'host-A' && _.name === 'restoreVms' && _.status === 'observed'))
    })

    it('handles the hosts in the order of the first attempt', async function () {
      const xapi = new FakeXapi([[10], [10], [10]])
      const recorder = planSpyRecorder()

      const { error } = await rollingPoolReboot(xapi, {
        recorder,
        resume: {
          doneHostIds: new Set(),
          hostOrder: ['host-A', 'host-C', 'host-B'],
          vmHomeById: {},
          haltedPinnedVms: {},
        },
      })

      assert.equal(error, undefined)
      assert.deepEqual(
        recorder.calls.filter(([name]) => name === 'hostStarting').map(([, hostId]) => hostId),
        ['host-A', 'host-C', 'host-B']
      )
    })

    it('checks the evacuation precondition of the remaining hosts only right before evacuating them', async function () {
      const xapi = new FakeXapi([[10], [10], [10]])
      const calls = []
      for (const host of xapi.hosts) {
        host.$call = async method => {
          calls.push([method, host.uuid])
          // not enough memory while the host disabled by the previous attempt
          // is still out of the pool
          if (method === 'get_vms_which_prevent_evacuation' && host.uuid === 'host-C') {
            return { 'OpaqueRef:vm-c1': ['HOST_NOT_ENOUGH_FREE_MEMORY'] }
          }
          return {}
        }
      }

      const { error } = await rollingPoolReboot(xapi, {
        resume: {
          doneHostIds: new Set(['host-A']),
          hostsStarted: true,
          hostOrder: ['host-A', 'host-B', 'host-C'],
          vmHomeById: {},
          haltedPinnedVms: {},
        },
      })

      assert.equal(error, undefined)
      assert.ok(!calls.some(([, hostId]) => hostId === 'host-A'))
      assert.deepEqual(
        calls.filter(([, hostId]) => hostId === 'host-C'),
        [
          ['get_vms_which_prevent_evacuation', 'host-C'],
          ['assert_can_evacuate', 'host-C'],
        ]
      )
    })

    it('keeps the settings a previous attempt left changed as they are during the run, then restores them', async function () {
      const { events, recorder, xapi } = settingsSpy(new FakeXapi([[10], [10]]))
      // auto power on was already disabled before the run: not in the record
      xapi.pool.other_config.auto_poweron = 'false'

      const { error } = await rollingPoolReboot(xapi, {
        recorder,
        resume: {
          doneHostIds: new Set(),
          hostOrder: ['host-A', 'host-B'],
          vmHomeById: {},
          haltedPinnedVms: {},
          changedByRun: { ha: { srs: ['sr-1'], configuration: { timeout: '60' } } },
        },
      })

      assert.equal(error, undefined)
      assert.deepEqual(events, [
        ['hostStarting', 'host-A', true],
        ['hostStarting', 'host-B', true],
        ['call', 'pool.enable_ha', ['OpaqueRef:sr-1'], { timeout: '60' }],
        ['restored', 'ha'],
      ])
    })

    it('leaves to the operator HA recorded without its configuration', async function () {
      const { events, recorder, xapi } = settingsSpy(new FakeXapi([[10], [10]]))

      const { error } = await rollingPoolReboot(xapi, {
        recorder,
        resume: {
          doneHostIds: new Set(),
          hostOrder: ['host-A', 'host-B'],
          vmHomeById: {},
          haltedPinnedVms: {},
          // written by an xo-server which did not keep the heartbeat SRs
          changedByRun: { ha: true },
        },
      })

      assert.equal(error, undefined)
      assert.deepEqual(events, [
        ['hostStarting', 'host-A', true],
        ['hostStarting', 'host-B', true],
      ])
    })

    it('starts again the pinned VMs a previous attempt left halted', async function () {
      const xapi = new FakeXapi([[10], [10]])
      const pinnedVm = xapi.getObject('vm-b1')
      pinnedVm.power_state = 'Halted'
      const started = []
      const callAsync = xapi.callAsync.bind(xapi)
      xapi.callAsync = async (method, ...args) => {
        if (method === 'VM.start_on') {
          started.push(args.slice(0, 2))
          return
        }
        return callAsync(method, ...args)
      }

      const { error } = await rollingPoolReboot(xapi, {
        resume: {
          doneHostIds: new Set(),
          hostOrder: ['host-A', 'host-B'],
          vmHomeById: {},
          haltedPinnedVms: { 'vm-b1': 'host-B' },
        },
      })

      assert.equal(error, undefined)
      assert.deepEqual(started, [['OpaqueRef:vm-b1', 'OpaqueRef:host-B']])
    })
  })
})
