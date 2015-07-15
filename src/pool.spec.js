/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getConfig, waitObjectState} from './util'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('pool', function () {
  let xo
  let poolId
  let serverId
  before(async function () {
    this.timeout(10e3)

    xo = await getConnection()
    const config = await getConfig()
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')

    poolId = getOnePoolId()
  })

// -------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
    id: serverId
    })
  })

// ------------------------------------------------------------------
  function getAllPool () {
    return xo.objects.indexes.type.pool
  }

  function getOnePoolId () {
    const pools = getAllPool()
    for (const id in pools) {
      return id
    }
  }

// ===================================================================

  describe('.set()', function () {
    afterEach(async function () {
      await xo.call('pool.set', {
        id: poolId,
        name_label: '',
        name_description: ''
      })
    })
    it('set pool parameters', async function () {
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
