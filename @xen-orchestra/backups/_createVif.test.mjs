import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

import { createVif } from './_createVif.mjs'
import { DROPPED_TRUNKS } from './_otherConfig.mjs'

const vif = { device: '0', MAC: 'aa:bb:cc:dd:ee:ff', trunks: [10] }
const vlanNetwork = { $ref: 'ref:vlan', $PIFs: [{ VLAN: '100' }] }
const plainNetwork = { $ref: 'ref:plain', $PIFs: [{ VLAN: '-1' }] }

function createXapi(fail) {
  const trunksSeen = []
  const otherConfigSeen = []
  const xapi = {
    async VIF_create({ trunks, other_config }) {
      trunksSeen.push(trunks)
      otherConfigSeen.push(other_config)
      fail?.(trunks)
      return 'ref:vif'
    },
  }
  return { otherConfigSeen, trunksSeen, xapi }
}

const create = (xapi, network, v = vif) => createVif({ xapi, vif: v, network, vmRef: 'ref:vm' })

describe('createVif', () => {
  it('keeps the trunks on a network without VLAN', async () => {
    const { otherConfigSeen, trunksSeen, xapi } = createXapi()

    await create(xapi, plainNetwork)
    assert.deepEqual(trunksSeen, [[10]])
    assert.deepEqual(otherConfigSeen, [undefined])
  })

  it('drops the trunks on a network with a VLAN, without trying them first', async () => {
    const { otherConfigSeen, trunksSeen, xapi } = createXapi()

    await create(xapi, vlanNetwork, { ...vif, other_config: { a: 'b' } })
    assert.deepEqual(trunksSeen, [undefined])
    assert.deepEqual(otherConfigSeen, [{ a: 'b', [DROPPED_TRUNKS]: '[10]' }])
  })

  it('retries without the trunks when the pool has no VLAN filtering', async () => {
    const { otherConfigSeen, trunksSeen, xapi } = createXapi(trunks => {
      if (trunks !== undefined) {
        throw invalidParameters('no VLAN filtering', [{ field: 'trunks', message: 'unsupported' }])
      }
    })

    await create(xapi, plainNetwork)
    assert.deepEqual(trunksSeen, [[10], undefined])
    assert.deepEqual(otherConfigSeen, [undefined, { [DROPPED_TRUNKS]: '[10]' }])
  })

  it('rethrows any other error', async () => {
    const error = new Error('boom')
    const { trunksSeen, xapi } = createXapi(() => {
      throw error
    })

    await assert.rejects(create(xapi, plainNetwork), error)
    assert.equal(trunksSeen.length, 1)
  })
})
