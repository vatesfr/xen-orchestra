/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import fromEvent from 'promise-toolbox/fromEvent'
import { getConfig, getMainConnection, getNetworkId, waitObjectState, getVmXoTestPvId } from './util'
import map from 'lodash/map.js'

// ===================================================================

describe('vif', () => {
  let xo
  let serverId
  let vifIds = []
  let vmId
  let vifId

  beforeAll(async () => {
    jest.setTimeout(10e3)
    let config
    ;[xo, config] = await Promise.all([getMainConnection(), getConfig()])

    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await fromEvent(xo.objects, 'finish')

    vmId = await getVmXoTestPvId(xo)
    try {
      await xo.call('vm.start', { id: vmId })
    } catch (_) {}
  })

  // -------------------------------------------------------------------

  beforeEach(async () => {
    vifId = await createVif()
  })

  // -------------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(map(vifIds, vifId => xo.call('vif.delete', { id: vifId })))
    vifIds = []
  })

  // -------------------------------------------------------------------

  afterAll(async () => {
    jest.setTimeout(5e3)
    await xo.call('vm.stop', { id: vmId, force: true })
    await xo.call('server.remove', { id: serverId })
  })

  // -------------------------------------------------------------------

  async function createVif() {
    const networkId = await getNetworkId(xo)

    const vifId = await xo.call('vm.createInterface', {
      vm: vmId,
      network: networkId,
      position: '1',
    })
    vifIds.push(vifId)

    return vifId
  }

  // ===================================================================

  describe('.delete()', () => {
    it('deletes a VIF', async () => {
      await xo.call('vif.disconnect', { id: vifId })
      await xo.call('vif.delete', { id: vifId })

      await waitObjectState(xo, vifId, vif => {
        expect(vif).to.be.undefined()
      })

      vifIds = []
    })

    it('can not delete a VIF if it is connected', async () => {
      await xo.call('vif.delete', { id: vifId }).then(
        () => {
          throw new Error('vif.delete() should have thrown')
        },
        function (error) {
          expect(error.message).to.be.equal('unknown error from the peer')
        }
      )
      await xo.call('vif.disconnect', { id: vifId })
    })
  })

  // ----------------------------------------------------------------

  describe('.disconnect()', () => {
    it('disconnects a VIF', async () => {
      await xo.call('vif.disconnect', { id: vifId })
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.false()
      })
    })
  })

  // ----------------------------------------------------------------

  describe('.connect()', () => {
    beforeEach(async () => {
      await xo.call('vif.disconnect', { id: vifId })
    })
    afterEach(async () => {
      await xo.call('vif.disconnect', { id: vifId })
    })
    it('connects a VIF', async () => {
      await xo.call('vif.connect', { id: vifId })
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.true()
      })
    })
  })
})
