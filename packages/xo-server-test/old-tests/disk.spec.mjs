/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
// eslint-disable-next-line n/no-missing-import
import expect from 'must'

// ===================================================================

import fromEvent from 'promise-toolbox/fromEvent'
import { getConfig, getMainConnection, getSrId, waitObjectState } from '../util.mjs'
import map from 'lodash/map.js'

// ===================================================================

describe('disk', () => {
  let diskId
  let diskIds = []
  let serverId
  let srId
  let xo

  // -----------------------------------------------------------------

  beforeAll(async () => {
    jest.setTimeout(10e3)
    xo = await getMainConnection()

    const config = await getConfig()
    serverId = await xo.call('server.add', Object.assign({ autoConnect: false }, config.xenServer1))
    await xo.call('server.connect', { id: serverId })
    await fromEvent(xo.objects, 'finish')
    srId = await getSrId(xo)
  })

  // -----------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(map(diskIds, diskId => xo.call('vdi.delete', { id: diskId })))
    diskIds = []
  })

  // -----------------------------------------------------------------

  afterAll(async () => {
    await xo.call('server.remove', { id: serverId })
  })

  // -----------------------------------------------------------------

  async function createDisk(params) {
    const id = await xo.call('disk.create', params)
    diskIds.push(id)
    return id
  }

  async function createDiskTest() {
    const id = await createDisk({
      name: 'diskTest',
      size: '1GB',
      sr: srId,
    })
    return id
  }

  // ===================================================================

  describe('.create()', () => {
    it('create a new disk on a SR', async () => {
      diskId = await createDisk({
        name: 'diskTest',
        size: '1GB',
        sr: srId,
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
        }),
      ])
    })
  })

  // -------------------------------------------------------------------

  describe('.delete()', () => {
    beforeEach(async () => {
      diskId = await createDiskTest()
    })

    it('deletes a disk', async () => {
      await Promise.all([
        xo.call('vdi.delete', { id: diskId }),
        waitObjectState(xo, diskId, disk => {
          expect(disk).to.be.undefined()
        }),
        waitObjectState(xo, srId, sr => {
          expect(sr.VDIs).not.include(diskId)
        }),
      ])
      diskIds = []
    })
  })

  // ---------------------------------------------------------------------

  describe('.set()', () => {
    beforeEach(async () => {
      diskId = await createDiskTest()
    })

    it('set the name of the disk', async () => {
      await xo.call('vdi.set', {
        id: diskId,
        name_label: 'disk2',
      })

      await waitObjectState(xo, diskId, disk => {
        expect(disk.name_label).to.be.equal('disk2')
      })
    })

    it('set the description of the disk', async () => {
      await xo.call('vdi.set', {
        id: diskId,
        name_description: 'description',
      })

      await waitObjectState(xo, diskId, disk => {
        expect(disk.name_description).to.be.equal('description')
      })
    })

    it.skip('set the size of the disk', async () => {
      await xo.getOrWaitObject(diskId)
      await xo.call('vdi.set', {
        id: diskId,
        size: '5MB',
      })

      await waitObjectState(xo, diskId, disk => {
        expect(disk.size).to.be.equal(6291456)
      })
    })
  })
})
