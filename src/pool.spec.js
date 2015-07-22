/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConfig, getMainConnection, waitObjectState} from './util'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('pool', function () {
  let xo
  let serverId
  let poolId
  before(async function () {
    this.timeout(10e3)

    xo = await getMainConnection()
    const config = await getConfig()
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')
    poolId = '566b37f1-e7d1-2236-3366-9e5d358b5cda'
  })

// -------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
    id: serverId
    })
  })

// ===================================================================

  describe('.set()', function () {
    afterEach(async function () {
      await xo.call('pool.set', {
        id: poolId,
        name_label: '',
        name_description: ''
      })
    })
    it.skip('set pool parameters', async function () {
      await xo.call('pool.set', {
        id: poolId,
        name_label: 'nameTest',
        name_description: 'description'
      })

      await waitObjectState(xo, poolId, pool => {
        expect(pool.name_label).to.be.equal('nameTest')
        expect(pool.name_description).to.be.equal('description')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', function () {
    it('install a patch on the pool')
  })

  // -----------------------------------------------------------------

  describe('handlePatchUpload()', function () {
    it('')
  })
})
