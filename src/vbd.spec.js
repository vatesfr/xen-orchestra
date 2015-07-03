/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getConfig, getOneHost, waitObjectState} from './util'
import {assign, find, map} from 'lodash'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('vbd', function () {
  let xo
  let vbdId
  let diskIds = []
  let serverId
  let vm

  // ------------------------------------------------------------------

  before(async function () {
    this.timeout(20e3)
    xo = await getConnection()

    const config = await getConfig()
    serverId = await xo.call('server.add', assign(
      {autoConnect: false}, config.xenServer1
    ))
    await xo.call('server.connect', {id: serverId})
    vm = find(xo.objects.indexes.type.VM, {name_label: config.pvVm.name_label})
    await eventToPromise(xo.objects, 'finish')
  })

  // -----------------------------------------------------------------

  beforeEach(async function () {
    this.timeout(20e3)
    vbdId = await createVbd()
  })

  // ------------------------------------------------------------------

  afterEach(async function () {
    await Promise.all(map(
      diskIds,
      diskId => xo.call('vdi.delete', {id: diskId})
    ))
    diskIds = []
  })

  // ------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {id: serverId})
  })

  // ------------------------------------------------------------------

  async function createVbd () {
    // Create disk
    const pool = await xo.getOrWaitObject(getOneHost(xo).$poolId)
    const diskId = await xo.call('disk.create', {
      name: 'diskTest',
      size: '1MB',
      sr: pool.default_SR
    })
    diskIds.push(diskId)
    console.log(1)
    // Create VBD
    await xo.call('vm.attachDisk', {
      vm: vm.id,
      vdi: diskId
    })
    console.log(2)
    const disk = await xo.waitObject(diskId)
    return disk.$VBDs[0]
  }

  // =====================================================================

  describe('.delete()', function () {
    beforeEach(async function () {
      await xo.call('vbd.disconnect', {id: vbdId})
    })

    it.skip('delete the VBD', async function () {
      await xo.call('vbd.delete', {id: vbdId})

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd).to.be.undefined()
      })
      diskIds = []
    })
  })

  // --------------------------------------------------------------------

  describe('.disconnect()', function () {
    it.skip('disconnect the VBD', async function () {
      await xo.call('vbd.disconnect', {id: vbdId})
      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.attached).to.be.false()
      })
    })
  })

  // -------------------------------------------------------------------

  describe('.connect()', function () {
    this.timeout(40e3)
    beforeEach(async function () {
      await xo.call('vbd.disconnect', {id: vbdId})
    })
    afterEach(async function () {
      await xo.call('vbd.disconnect', {id: vbdId})
    })

    it.skip('connect the VBD', async function () {
      await xo.call('vbd.connect', {id: vbdId})

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.attached).to.be.true()
      })
    })
  })

  // ----------------------------------------------------------------

  describe('.set()', function () {
    afterEach(async function () {
      await xo.call('vbd.disconnect', {id: vbdId})
    })

    it.skip('set the position of the VBD', async function () {
      await xo.call('vbd.set', {
        id: vbdId,
        position: '4'
      })

      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.position).to.be.equal('4')
      })
    })
  })
})
