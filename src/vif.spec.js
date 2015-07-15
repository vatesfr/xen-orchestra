/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getConfig, waitObjectState, getVmXoTestPvId} from './util'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('vif', function () {
  let xo
  let serverId
  let vmId
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

  after(async function () {
    try {
      await xo.call('vif.connect', {id: vmId})
    } catch (_) {}
    await xo.call('vm.stop', {id: vmId, force: true})
    await xo.call('server.remove', {
    id: serverId
    })
  })

// -------------------------------------------------------------------

  async function getVifId () {
    const vm = await xo.getOrWaitObject(vmId)
    return vm.VIFs[0]
  }

// ===================================================================

  describe('.delete()', function () {
    it('deletes a VIF')
    it('can not delete a VIF if it is not disconnected')
  })

  // ----------------------------------------------------------------

  describe('.disconnect()', function () {
    let vifId
    beforeEach(async function () {
      vifId = await getVifId()
    })
    afterEach(async function () {
      await xo.call('vif.connect', {id: vifId})
    })

    it('disconnects a VIF', async function () {
      await xo.call('vif.disconnect', {id: vifId})
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.false()
      })
    })

    it('can not disconnect a VIF if its VM is shutdowmed', async function () {
      this.timeout(10e3)
      await xo.call('vm.stop', {id: vmId})

      await xo.call('vif.disconnect', {
        id: vifId
      }).then(
        function () {
          throw new Error('disconnect() should have thrown')
        },
        function (error) {
          expect(error.message).to.be.equal('unknown error from the peer')
        }
      )

      await xo.call('vm.start', {id: vmId})
    })
  })

  // ----------------------------------------------------------------

  describe('.connect()', function () {
    let vifId
    beforeEach(async function () {
      vifId = await getVifId()
      await xo.call('vif.disconnect', {id: vifId})
    })
    it('connects a VIF', async function () {
      await xo.call('vif.connect', {id: vifId})
      await waitObjectState(xo, vifId, vif => {
        expect(vif.attached).to.be.true()
      })
    })

    it('can not connect a VIF if its VM is shutdowmed', async function () {
      this.timeout(10e3)
      await xo.call('vm.stop', {id: vmId})

      await xo.call('vif.connect', {
        id: vifId
      }).then(
        function () {
          throw new Error('connect() should have thrown')
        },
        function (error) {
          expect(error.message).to.be.equal('unknown error from the peer')
        }
      )

      await xo.call('vm.start', {id: vmId})
    })
  })
})
