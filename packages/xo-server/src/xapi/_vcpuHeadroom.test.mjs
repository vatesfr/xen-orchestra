import assert from 'assert/strict'
import test from 'node:test'

import { computeVcpusMax, isWindowsVm, parseVcpusMaxSetting } from './_vcpuHeadroom.mjs'

const { describe, it } = test

const compute = opts =>
  computeVcpusMax({ setting: 16, hostThreads: [32], coresPerSocket: 1, currentMax: 2, isHvm: true, ...opts })

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
    assert.equal(compute({ hostThreads: [64, 8, 32] }), 8)
  })

  it('does nothing without host information', () => {
    assert.equal(compute({ hostThreads: [] }), undefined)
  })

  it('stays within the Xen limit for HVM guests only', () => {
    assert.equal(compute({ setting: 128, hostThreads: [256] }), 128)
    assert.equal(compute({ setting: 128, hostThreads: [256], isHvm: false }), 128)
  })

  it('keeps a multiple of the cores per socket', () => {
    assert.equal(compute({ coresPerSocket: 2 }), 16)
    assert.equal(compute({ coresPerSocket: 3 }), 15)
    assert.equal(compute({ hostThreads: [6], coresPerSocket: 4 }), 4)
  })

  it('never lowers the maximum', () => {
    assert.equal(compute({ currentMax: 16 }), undefined)
    assert.equal(compute({ currentMax: 24 }), undefined)
    assert.equal(compute({ hostThreads: [4], currentMax: 4 }), undefined)
  })
})

describe('isWindowsVm', () => {
  it('recognizes Windows templates', () => {
    assert.equal(isWindowsVm({ platform: { device_id: '0002', viridian: 'true' } }), true)
    assert.equal(isWindowsVm({ platform: { viridian: 'true' } }), true)
    assert.equal(isWindowsVm({ platform: { device_id: '0002' } }), true)
  })

  it('does not flag Linux templates', () => {
    assert.equal(isWindowsVm({ platform: { viridian: 'false' } }), false)
    assert.equal(isWindowsVm({ platform: {} }), false)
    assert.equal(isWindowsVm({}), false)
  })
})
