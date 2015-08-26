/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConfig, getMainConnection, waitObjectState} from './util'
import eventToPromise from 'event-to-promise'
import {find} from 'lodash'

// ===================================================================

describe('pool', function () {
  let xo
  let serverId
  let poolId
  let config

  before(async function () {
    this.timeout(10e3)

    ;[xo, config] = await Promise.all([
      getMainConnection(),
      getConfig()
    ])
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')
    poolId = getPoolId()
  })

// -------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

 // -----------------------------------------------------------------

  function getPoolId () {
    const pools = xo.objects.indexes.type.pool
    const pool = find(pools, {name_label: config.pool.name_label})
    return pool.id
  }

// ===================================================================

  describe('.set()', function () {
    afterEach(async function () {
      await xo.call('pool.set', {
        id: poolId,
        name_label: config.pool.name_label,
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
