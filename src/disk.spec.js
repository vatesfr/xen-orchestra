/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getConfig, getOneHost, waitObjectState} from './util'
import {map, assign} from 'lodash'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('disk', function () {
  let xo
  let diskIds = []
  let serverId

  before(async function () {
    this.timeout(30e3)
    xo = await getConnection()

    const config = await getConfig()

    serverId = await xo.call('server.add', assign(
      {autoConnect: false}, config.xenServer1
    ))
    await xo.call('server.connect', {id: serverId})
    await eventToPromise(xo.objects, 'finish')
  })

  afterEach(async function () {
    await Promise.all(map(
      diskIds,
      diskId => xo.call('vdi.delete', {id: diskId})
    ))
    diskIds = []
  })

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

  async function createDisk (params) {
    const diskId = await xo.call('disk.create', params)
    diskIds.push(diskId)
    return diskId
  }

  async function getSrId () {
    const host = getOneHost(xo)
    const pool = await xo.getOrWaitObject(host.$poolId)
    return pool.default_SR
  }

// ===================================================================

  describe('.create()', function () {
    this.timeout(30e3)
    it('create a new disk on a SR', async function () {
      const srId = await getSrId()
      const diskId = await createDisk({
        name: 'diskTest',
        size: '1GB',
        sr: srId
      })

      await Promise.all([
        waitObjectState(xo, diskId, disk => {
          expect(disk.type).to.be.equal('VDI')
          expect(disk.name_label).to.be.equal('diskTest')
          // TODO: should not test an exact value but around 10%
          expect(disk.size).to.be.equal(1000341504)
          expect(disk.$SR).to.be.equal(srId)
        }),
        waitObjectState(xo, srId, sr => {
          expect(sr.VDIs).include(diskId)
        })
      ])
    })
  })

  // -------------------------------------------------------------------

  describe('.delete()', function () {
    it('deletes a disk', async function () {
      const srId = await getSrId()
      const diskId = await createDisk({
        name: 'diskTest',
        size: '1MB',
        sr: srId
      })

      await Promise.all([
        xo.call('vdi.delete', {id: diskId}),
        waitObjectState(xo, diskId, disk => {
          expect(disk).to.be.undefined()
        }),
        waitObjectState(xo, srId, sr => {
          expect(sr.VDIs).not.include(diskId)
        })
      ])
      diskIds = []
    })
  })

  // ---------------------------------------------------------------------

  describe('.set()', function () {
    it('set the name of the disk', async function () {
      const srId = await getSrId()
      const diskId = await createDisk({
        name: 'disk1',
        size: '1MB',
        sr: srId
      })
      await xo.call('vdi.set', {
        id: diskId,
        name_label: 'disk2'
      })

      await waitObjectState(xo, diskId, disk => {
        expect(disk.name_label).to.be.equal('disk2')
      })
    })

    it('set the description of the disk', async function () {
      const srId = await getSrId()
      const diskId = await createDisk({
        name: 'diskTest',
        size: '1MB',
        sr: srId
      })
      await xo.call('vdi.set', {
        id: diskId,
        name_description: 'description'
      })

      await waitObjectState(xo, diskId, disk => {
        expect(disk.name_description).to.be.equal('description')
      })
    })

    it('set the size of the disk', async function () {
      const srId = await getSrId()
      const diskId = await createDisk({
        name: 'diskTest',
        size: '1MB',
        sr: srId
      })
      console.log(diskId)
      const disk = await xo.getOrWaitObject(diskId)
      console.log(disk)
      await xo.call('vdi.set', {
        id: diskId,
        size: '5MB'
      })

      await waitObjectState(xo, diskId, disk => {
        console.log(disk)
        expect(disk.size).to.be.equal(6291456)
      })
    })
  })

  // -------------------------------------------------------------------

  describe('.migrate()', function () {
    it('')
  })
})
