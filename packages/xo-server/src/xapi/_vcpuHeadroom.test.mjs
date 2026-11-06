import assert from 'assert/strict'
import test from 'node:test'

import {
  computeVcpusMax,
  getHostCores,
  hasExplicitVcpusMax,
  isWindowsVm,
  parseVcpusMaxSetting,
} from './_vcpuHeadroom.mjs'

const { describe, it } = test

const compute = opts => computeVcpusMax({ setting: 16, hostCores: [32], coresPerSocket: 1, currentMax: 2, ...opts })

describe('parseVcpusMaxSetting', () => {
  it('accepts integers from 2 to 128', () => {
    assert.equal(parseVcpusMaxSetting('16'), 16)
    assert.equal(parseVcpusMaxSetting('2'), 2)
    assert.equal(parseVcpusMaxSetting('128'), 128)
  })

  it('treats anything else as off', () => {
    for (const value of [undefined, '', '0', '1', '129', '16.5', 'abc', 'true']) {
      assert.equal(parseVcpusMaxSetting(value), undefined, String(value))
    }
  })
})

describe('computeVcpusMax', () => {
  it('raises the maximum to the setting', () => {
    assert.equal(compute(), 16)
  })

  it('does nothing when the pool did not opt in', () => {
    assert.equal(compute({ setting: undefined }), undefined)
  })

  it('stays within the smallest host of the pool', () => {
    assert.equal(compute({ hostCores: [64, 8, 32] }), 8)
  })

  it('does nothing without host information', () => {
    assert.equal(compute({ hostCores: [] }), undefined)
  })

  it('keeps a multiple of the cores per socket', () => {
    assert.equal(compute({ coresPerSocket: 2 }), 16)
    assert.equal(compute({ coresPerSocket: 3 }), 15)
    assert.equal(compute({ hostCores: [6], coresPerSocket: 4 }), 4)
  })

  it('never lowers the maximum', () => {
    assert.equal(compute({ currentMax: 16 }), undefined)
    assert.equal(compute({ currentMax: 24 }), undefined)
    assert.equal(compute({ hostCores: [4], currentMax: 4 }), undefined)
  })
})

describe('getHostCores', () => {
  it('counts physical cores, so VMs still start if SMT is turned off', () => {
    assert.equal(getHostCores({ cpu_count: '16', threads_per_core: '2' }), 8)
    assert.equal(getHostCores({ cpu_count: '4', threads_per_core: '1' }), 4)
  })

  it('falls back to the thread count on XAPI versions without threads_per_core', () => {
    assert.equal(getHostCores({ cpu_count: '12' }), 12)
  })

  it('returns nothing without CPU information', () => {
    assert.equal(getHostCores(undefined), undefined)
    assert.equal(getHostCores({}), undefined)
  })
})

describe('hasExplicitVcpusMax', () => {
  const template = { VCPUs_max: '2' }

  it('counts a maximum above the vCPUs and the template maximum as a choice', () => {
    assert.equal(hasExplicitVcpusMax({ cpus: 2, cpusMax: 8 }, template), true)
    assert.equal(hasExplicitVcpusMax({ CPUs: 2, cpusStaticMax: 8 }, template), true)
  })

  it('ignores the maximum XO 5 always sends, max(vCPUs, template maximum)', () => {
    assert.equal(hasExplicitVcpusMax({ CPUs: 4, cpusMax: 4 }, template), false)
    assert.equal(hasExplicitVcpusMax({ CPUs: 1, cpusMax: 2 }, template), false)
  })

  it('treats a missing maximum as no choice', () => {
    assert.equal(hasExplicitVcpusMax({ cpus: 2 }, template), false)
    assert.equal(hasExplicitVcpusMax({}, template), false)
  })
})

describe('isWindowsVm', () => {
  it('recognizes Windows templates', () => {
    assert.equal(isWindowsVm({ platform: { device_id: '0002', viridian: 'true' } }), true)
    assert.equal(isWindowsVm({ platform: { viridian: 'true' } }), true)
    assert.equal(isWindowsVm({ platform: { device_id: '0002' } }), true)
  })

  it('recognizes a running Windows VM from its guest tools', () => {
    assert.equal(isWindowsVm({ platform: {}, $guest_metrics: { os_version: { distro: 'windows' } } }), true)
  })

  it('does not flag Linux templates', () => {
    assert.equal(isWindowsVm({ platform: { viridian: 'false' } }), false)
    assert.equal(isWindowsVm({ platform: {} }), false)
    assert.equal(isWindowsVm({}), false)
  })
})
