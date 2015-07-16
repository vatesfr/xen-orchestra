/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getConfig, waitObjectState, getVmXoTestPvId} from './util'
import eventToPromise from 'event-to-promise'
import {map} from 'lodash'

// ===================================================================

describe('vif', function () {
  let xo
  let serverId
  let vifIds = []
  let vmId
  let vifId

  before(async function () {
    this.timeout(10e3)

    xo = await getConnection()
    const config = await getConfig()
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')

    vmId = await getVmXoTestPvId(xo)
    try {
      await xo.call('vm.start', {id: vmId})
    } catch (_) {}
  })

// -------------------------------------------------------------------

  beforeEach(async function () {
    vifId = await createVif()
  })

// -------------------------------------------------------------------

  afterEach(async function () {
    await Promise.all(map(
      vifIds,
      vifId => xo.call('vif.delete', {id: vifId})
    ))
    vifIds = []
  })

// -------------------------------------------------------------------

  after(async function () {
    this.timeout(5e3)
    await xo.call('vm.stop', {id: vmId, force: true})
    await xo.call('server.remove', {id: serverId})
  })

// -------------------------------------------------------------------

  async function createVif () {
    const vm = await xo.getOrWaitObject(vmId)
    const vif = await xo.getOrWaitObject(vm.VIFs[0])
    const networkId = vif.$network
    const vifId = await xo.call('vm.createInterface', {
      vm: vmId,
      network: networkId,
      position: '1'
    })
    vifIds.push(vifId)

    return vifId
  }

// ===================================================================

  describe('.delete()', function () {
    it('deletes a VIF', async function() {
      await xo.call('vif.disconnect', {id: vifId})
      await xo.call('vif.delete', {id: vifId})

      await waitObjectState(xo, vifId, vif => {
        expect(vif).to.be.undefined()
      })

      vifIds = []
    })

    it('can not delete a VIF if it is connected', async function () {
      await xo.call('vif.delete', {id: vifId}).then(
        function () {
          throw new Error('vif.delete() should have thrown')
        },
        function (error) {
          expect(error.message).to.be.equal('unknown error from the peer')
        }
      )
      await xo.call('vif.disconnect', {id: vifId})
    })
  })

  // ----------------------------------------------------------------

  describe('.disconnect()', function () {
    it('disconnects a VIF', async function () {
      await xo.call('vif.disconnect', {id: vifId})
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.false()
      })
    })
  })

  // ----------------------------------------------------------------

  describe('.connect()', function () {
    beforeEach(async function () {
      await xo.call('vif.disconnect', {id: vifId})
    })
    afterEach(async function () {
      await xo.call('vif.disconnect', {id: vifId})
    })
    it('connects a VIF', async function () {
      await xo.call('vif.connect', {id: vifId})
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.true()
      })
    })
  })
})
