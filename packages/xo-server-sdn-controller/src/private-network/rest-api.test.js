import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { invalidParameters } from 'xo-common/api-errors.js'

import createSdnController from '../index.js'
import { createPrivateNetworkRoute } from './rest-api.js'

const noop = () => undefined

describe('the creation of a private network', () => {
  const BODY = {
    poolIds: ['pool1', 'pool2'],
    pifIds: ['pif1', 'pif2'],
    name: 'private',
    description: '',
    encapsulation: 'gre',
  }

  // Two pools without hosts, a PIF each, and a host of the second one. Returns the networks the pools create.
  function createPoolsController() {
    const created = []
    const xapiObjects = {}
    for (const n of [1, 2]) {
      const pool = { $ref: `pool${n}-ref`, uuid: `pool${n}`, name_label: `pool ${n}` }
      pool.$xapi = {
        objects: { indexes: { type: {} } },
        call: async () => {
          created.push(`net${n}`)
          return `net${n}-ref`
        },
        _getOrWaitObject: async $ref => ({ $id: `net${n}`, $ref, $pool: pool, name_label: 'private' }),
      }
      xapiObjects[`pool${n}`] = pool
      xapiObjects[`pif${n}`] = { $pool: pool, network: `transport${n}` }
    }
    // Read by electNewCenter when it is given as the preferred center
    xapiObjects.host2 = {
      $ref: 'host2-ref',
      $pool: xapiObjects.pool2,
      $PIFs: [],
      $xapi: { barrier: async () => xapiObjects.host2 },
    }
    const controller = createSdnController({
      xo: {
        getObject: id => ({ id }),
        getXapiObject: idOrObject => xapiObjects[idOrObject.id ?? idOrObject],
      },
      getDataDir: async () => '/tmp',
      staticConfig: {},
    })
    controller._setPoolControllerIfNeeded = noop
    return { controller, created }
  }

  function createPrivateNetwork(controller, body) {
    return createPrivateNetworkRoute(controller).callback({
      req: { query: { sync: true }, body },
      createAction: task => task(),
    })
  }

  it('answers the ids of its networks, one per pool', async () => {
    const { controller } = createPoolsController()
    assert.deepEqual(await createPrivateNetwork(controller, BODY), { ids: ['net1', 'net2'] })
  })

  it('creates the network of the pool of the preferred center first, without reordering poolIds', async () => {
    const { controller, created } = createPoolsController()
    const body = { ...BODY, poolIds: ['pool1', 'pool2'], preferredCenterId: 'host2' }
    await createPrivateNetwork(controller, body)
    assert.deepEqual(created, ['net2', 'net1'])
    assert.deepEqual(body.poolIds, ['pool1', 'pool2'])
  })

  it('creates no network when a pool has no PIF or the preferred center is outside the pools', async () => {
    for (const body of [
      { ...BODY, pifIds: ['pif1'] },
      { ...BODY, poolIds: ['pool1'], pifIds: ['pif1'], preferredCenterId: 'host2' },
    ]) {
      const { controller, created } = createPoolsController()
      await assert.rejects(createPrivateNetwork(controller, body), error => invalidParameters.is(error))
      assert.deepEqual(created, [])
    }
  })

  it('refuses an MTU that is not a non-negative integer before creating any network', async () => {
    for (const mtu of [1450.5, -1]) {
      const { controller, created } = createPoolsController()
      await assert.rejects(createPrivateNetwork(controller, { ...BODY, mtu }), error => invalidParameters.is(error))
      assert.deepEqual(created, [])
    }
  })
})
