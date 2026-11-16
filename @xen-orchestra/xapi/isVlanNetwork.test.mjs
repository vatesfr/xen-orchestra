import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import isVlanNetwork from './isVlanNetwork.mjs'

describe('isVlanNetwork', () => {
  it('is false for a network whose PIFs have no VLAN, whether the VLAN is a string or a number', () => {
    assert.equal(isVlanNetwork({ $PIFs: [] }), false)
    assert.equal(isVlanNetwork({ $PIFs: [{ VLAN: '-1' }, { VLAN: -1 }] }), false)
  })

  it('is true as soon as a PIF has a VLAN', () => {
    assert.equal(isVlanNetwork({ $PIFs: [{ VLAN: '-1' }, { VLAN: '100' }] }), true)
  })
})
