/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import fromEvent from 'promise-toolbox/fromEvent'
import { getConfig, getMainConnection, waitObjectState } from './util'
import find from 'lodash/find.js'

// ===================================================================

describe('pool', () => {
  let xo
  let serverId
  let poolId
  let config

  beforeAll(async () => {
    jest.setTimeout(10e3)
    ;[xo, config] = await Promise.all([getMainConnection(), getConfig()])
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await fromEvent(xo.objects, 'finish')
    poolId = getPoolId()
  })

  // -------------------------------------------------------------------

  afterAll(async () => {
    await xo.call('server.remove', {
      id: serverId,
    })
  })

  // -----------------------------------------------------------------

  function getPoolId() {
    const pools = xo.objects.indexes.type.pool
    const pool = find(pools, { name_label: config.pool.name_label })
    return pool.id
  }

  // ===================================================================

  describe('.set()', () => {
    afterEach(async () => {
      await xo.call('pool.set', {
        id: poolId,
        name_label: config.pool.name_label,
        name_description: '',
      })
    })
    it.skip('set pool parameters', async () => {
      await xo.call('pool.set', {
        id: poolId,
        name_label: 'nameTest',
        name_description: 'description',
      })

      await waitObjectState(xo, poolId, pool => {
        expect(pool.name_label).to.be.equal('nameTest')
        expect(pool.name_description).to.be.equal('description')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', () => {
    it('install a patch on the pool')
  })

  // -----------------------------------------------------------------

  describe('handlePatchUpload()', () => {
    it('')
  })
})
