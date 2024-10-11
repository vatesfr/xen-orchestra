/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
// eslint-disable-next-line n/no-missing-import
import expect from 'must'

// ===================================================================

import fromEvent from 'promise-toolbox/fromEvent'
// eslint-disable-next-line n/no-missing-import
import { getConfig, getMainConnection, getVmXoTestPvId, getOneHost, waitObjectState } from './util'
import map from 'lodash/map.js'

// ===================================================================

describe('vbd', () => {
  let xo
  let vbdId
  let diskIds = []
  let serverId
  let vmId

  // ------------------------------------------------------------------

  beforeAll(async () => {
    jest.setTimeout(10e3)
    let config
    ;[xo, config] = await Promise.all([getMainConnection(), getConfig()])

    serverId = await xo.call('server.add', Object.assign({ autoConnect: false }, config.xenServer1))
    await xo.call('server.connect', { id: serverId })
    await fromEvent(xo.objects, 'finish')

    vmId = await getVmXoTestPvId(xo)
    try {
      await xo.call('vm.start', { id: vmId })
    } catch (_) {}
  })

  // -----------------------------------------------------------------

  beforeEach(async () => {
    jest.setTimeout(10e3)
    vbdId = await createVbd()
  })

  // ------------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(map(diskIds, diskId => xo.call('vdi.delete', { id: diskId })))
    diskIds = []
  })

  // ------------------------------------------------------------------

  afterAll(async () => {
    jest.setTimeout(5e3)
    await Promise.all([xo.call('vm.stop', { id: vmId }), xo.call('server.remove', { id: serverId })])
  })

  // ------------------------------------------------------------------

  async function createVbd() {
    // Create disk
    const pool = await xo.getOrWaitObject(getOneHost(xo).$poolId)
    const diskId = await xo.call('disk.create', {
      name: 'diskTest',
      size: '1MB',
      sr: pool.default_SR,
    })
    diskIds.push(diskId)

    // Create VBD
    await xo.call('vm.attachDisk', {
      vm: vmId,
      vdi: diskId,
    })
    const disk = await xo.waitObject(diskId)
    return disk.$VBDs[0]
  }

  // =====================================================================

  describe('.delete()', () => {
    it('delete the VBD', async () => {
      await xo.call('vbd.disconnect', { id: vbdId })
      await xo.call('vbd.delete', { id: vbdId })

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd).to.be.undefined()
      })
    })

    it('deletes the VBD only if it is deconnected', async () => {
      await xo.call('vbd.delete', { id: vbdId }).then(
        () => {
          throw new Error('vbd.delete() should have thrown')
        },
        function (error) {
          // TODO: check with Julien if it is ok
          expect(error.message).to.match('unknown error from the peer')
        }
      )
      await xo.call('vbd.disconnect', { id: vbdId })
    })
  })

  // --------------------------------------------------------------------

  describe('.disconnect()', () => {
    it('disconnect the VBD', async () => {
      await xo.call('vbd.disconnect', { id: vbdId })
      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.attached).to.be.false()
      })
    })
  })

  // -------------------------------------------------------------------

  describe('.connect()', () => {
    beforeEach(async () => {
      await xo.call('vbd.disconnect', { id: vbdId })
    })
    afterEach(async () => {
      await xo.call('vbd.disconnect', { id: vbdId })
    })

    it('connect the VBD', async () => {
      await xo.call('vbd.connect', { id: vbdId })

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.attached).to.be.true()
      })
    })
  })

  // ----------------------------------------------------------------

  describe('.set()', () => {
    afterEach(async () => {
      await xo.call('vbd.disconnect', { id: vbdId })
    })

    // TODO: resolve problem with disconnect
    it.skip('set the position of the VBD', async () => {
      await xo.call('vbd.set', {
        id: vbdId,
        position: '10',
      })

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.position).to.be.equal('10')
      })
    })
  })
})
