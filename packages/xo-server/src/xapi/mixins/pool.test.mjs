import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import poolMethods from './pool.mjs'

const { describe, it } = test

const HOST_CAPACITY = 100

// Fake XAPI modelling only what the migrate back phase depends on: where the
// VMs run, and how much memory is left on each host.
class FakeXapi {
  // vmMemoriesByHost: memory of the VMs initially running on each host
  //
  // memoryTakenByHostAfterReboots: memory each host loses to something else
  // once the whole pool has rebooted, ie during the migrate back phase
  constructor(vmMemoriesByHost, memoryTakenByHostAfterReboots = []) {
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
    this._nReboots = 0

    // migrations back, the evacuations go through clearHost
    this.nMigrations = 0
  }

  _find(key) {
    const object = [...this.hosts, ...this.vms].find(_ => _.uuid === key || _.$ref === key)
    if (object === undefined) {
      throw new Error(`no such object ${key}`)
    }
    return object
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

  getObject(key) {
    return this._find(key)
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

const rollingPoolReboot = async xapi => {
  const events = []
  const parentTask = new Task({
    properties: { name: 'rolling pool reboot', progress: 0 },
    onProgress: event => events.push(event),
  })

  let error
  await parentTask.run(async () => {
    try {
      await poolMethods.rollingPoolReboot.call(xapi, parentTask)
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

    const { error, strandedVms } = await rollingPoolReboot(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(strandedVms.map(_ => _.vmId).sort(), ['vm-a2', 'vm-b1', 'vm-b2'])
    for (const strandedVm of strandedVms) {
      assert.equal(strandedVm.code, 'HOST_NOT_ENOUGH_FREE_MEMORY')
      assert.equal(strandedVm.hostId, xapi.homeOf.get(strandedVm.vmId))
    }
  })

  it('does not migrate the VMs back when the pool opted out', async function () {
    const xapi = new FakeXapi([
      [30, 30],
      [30, 30],
      [30, 30],
      [30, 30],
    ])
    xapi.pool.other_config['xo:rpuMigrateVmsBack'] = 'false'

    const { error, taskNames } = await rollingPoolReboot(xapi)

    assert.equal(error, undefined)
    assert.equal(xapi.nMigrations, 0)
    assert.notDeepEqual(xapi.strayedVms(), [])

    // the skipped phase leaves a trace, otherwise it cannot be told apart from
    // a run which died before reaching it
    assert.ok(taskNames.includes('Skip migrating VMs back'))
    assert.ok(!taskNames.includes('Migrate VMs back'))
  })
})
