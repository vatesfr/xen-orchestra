import assert from 'assert/strict'
import test from 'node:test'

import vmMethods from './vm.mjs'

const { describe, it } = test

const LINUX_PLATFORM = { 'cores-per-socket': '1', viridian: 'false' }
const WINDOWS_PLATFORM = { 'cores-per-socket': '2', device_id: '0002', viridian: 'true' }

// Fake XAPI modelling what the vCPU maximum and vCPU count depend on
function fakeXapi({ setting, hostThreads = [32], vm: vmProps = {} } = {}) {
  const calls = []
  const fields = {}
  const xapi = {
    calls,
    fields,
    pool: { other_config: setting === undefined ? {} : { 'xo:vcpusMaxHeadroom': setting } },
    objects: {
      indexes: {
        type: { host: Object.fromEntries(hostThreads.map((n, i) => [i, { cpu_info: { cpu_count: String(n) } }])) },
      },
    },
    vm: {
      $ref: 'OpaqueRef:vm',
      $type: 'VM',
      domain_type: 'hvm',
      platform: LINUX_PLATFORM,
      power_state: 'Halted',
      VCPUs_at_startup: '2',
      VCPUs_max: '2',
      ...vmProps,
    },
    async call(method, ...args) {
      calls.push([method, ...args])
    },
    async getField(type, ref, field) {
      return xapi.vm[field]
    },
    getObject() {
      return xapi.vm
    },
    async setField(type, ref, field, value) {
      fields[field] = value
    },
  }
  xapi.vm.$xapi = xapi
  return xapi
}

const applyHeadroom = xapi => vmMethods._applyVcpusMaxHeadroom.call(xapi, xapi.vm.$ref)

describe('_applyVcpusMaxHeadroom', () => {
  it('raises the vCPU maximum of a new VM to the pool setting', async () => {
    const xapi = fakeXapi({ setting: '16' })
    await applyHeadroom(xapi)
    assert.deepEqual(xapi.calls, [['VM.set_VCPUs_max', 'OpaqueRef:vm', 16]])
  })

  it('does nothing when the pool did not opt in', async () => {
    const xapi = fakeXapi()
    await applyHeadroom(xapi)
    assert.deepEqual(xapi.calls, [])
  })

  it('stays within the smallest host of the pool', async () => {
    const xapi = fakeXapi({ setting: '16', hostThreads: [32, 4] })
    await applyHeadroom(xapi)
    assert.deepEqual(xapi.calls, [['VM.set_VCPUs_max', 'OpaqueRef:vm', 4]])
  })

  it('leaves Windows VMs alone', async () => {
    const xapi = fakeXapi({ setting: '16', vm: { platform: WINDOWS_PLATFORM } })
    await applyHeadroom(xapi)
    assert.deepEqual(xapi.calls, [])
  })

  it('keeps a valid topology', async () => {
    const xapi = fakeXapi({ setting: '16', hostThreads: [6], vm: { platform: { 'cores-per-socket': '4' } } })
    await applyHeadroom(xapi)
    assert.deepEqual(xapi.calls, [['VM.set_VCPUs_max', 'OpaqueRef:vm', 4]])
  })

  it('does not fail the VM creation when XAPI refuses', async () => {
    const xapi = fakeXapi({ setting: '16' })
    xapi.call = async () => {
      throw new Error('XAPI refused')
    }
    await applyHeadroom(xapi)
  })
})

describe('editing the vCPUs of a VM', () => {
  const editCpus = (xapi, cpus) => vmMethods._editVm.call(xapi, 'vm', { cpus })

  it('refuses to lower the vCPUs of a running Windows VM', async () => {
    const xapi = fakeXapi({
      vm: { platform: WINDOWS_PLATFORM, power_state: 'Running', VCPUs_at_startup: '4', VCPUs_max: '4' },
    })
    await assert.rejects(editCpus(xapi, 2), /Windows cannot remove vCPUs/)
    assert.deepEqual(xapi.calls, [])
    assert.deepEqual(xapi.fields, {})
  })

  it('adds vCPUs to a running Windows VM', async () => {
    const xapi = fakeXapi({
      vm: { platform: WINDOWS_PLATFORM, power_state: 'Running', VCPUs_at_startup: '2', VCPUs_max: '4' },
    })
    await editCpus(xapi, 4)
    assert.deepEqual(xapi.calls, [['VM.set_VCPUs_number_live', 'OpaqueRef:vm', '4']])
    assert.deepEqual(xapi.fields, { VCPUs_at_startup: 4 })
  })

  it('lowers the vCPUs of a halted Windows VM', async () => {
    const xapi = fakeXapi({ vm: { platform: WINDOWS_PLATFORM, VCPUs_at_startup: '4', VCPUs_max: '4' } })
    await editCpus(xapi, 2)
    assert.deepEqual(xapi.calls, [])
    assert.deepEqual(xapi.fields, { VCPUs_at_startup: 2 })
  })

  it('lowers the vCPUs of a running Linux VM', async () => {
    const xapi = fakeXapi({ vm: { power_state: 'Running', VCPUs_at_startup: '4', VCPUs_max: '4' } })
    await editCpus(xapi, 2)
    assert.deepEqual(xapi.calls, [['VM.set_VCPUs_number_live', 'OpaqueRef:vm', '2']])
    assert.deepEqual(xapi.fields, { VCPUs_at_startup: 2 })
  })
})
