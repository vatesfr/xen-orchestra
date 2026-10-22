import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { invalidParameters } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import createSdnController from './index.js'
import { createRestRoutes } from './rest-api.js'

const noop = () => undefined

const SSH = { allow: false, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/8', direction: 'to' }
const WEB = { allow: true, protocol: 'TCP', port: 443, ipRange: '10.0.0.0/8', direction: 'to' }

function createController({ useDirectChannel = false } = {}) {
  return createSdnController({
    xo: {
      addApiMethods: noop,
      registerRestRoutes: noop,
      getAllXapis: () => [],
      on: noop,
      removeListener: noop,
    },
    getDataDir: async () => '/tmp',
    staticConfig: { useDirectChannel },
  })
}

function findRoute(controller, method, endpoint) {
  return createRestRoutes(controller).find(route => route.method === method && route.endpoint === endpoint)
}

// A VIF as XO records it: the SSH rule has a priority, the WEB rule none
const VIF = {
  id: 'vif1',
  type: 'VIF',
  $network: 'net',
  other_config: {
    [SDN_CONTROLLER_OF_RULES_KEY]: JSON.stringify([
      JSON.stringify({ ...SSH, priority: 40000 }),
      JSON.stringify({ ...WEB, protocol: 'tcp' }),
    ]),
  },
}

// The networks whose privilege a VIF route requires, besides the VIF's
function networkObjectIds(action, body) {
  const route = findRoute(createController(), 'post', `/vifs/{id}/actions/${action}_traffic_rule`)
  const [, networkAcl] = route.middlewares.find(middleware => middleware.name === 'acl').acls
  assert.equal(networkAcl.resource, 'network')
  assert.equal(networkAcl.action, 'update:other_config')
  return networkAcl.objectIds({
    req: { params: { id: VIF.id }, body },
    restApi: { getObject: (id, type) => (id === VIF.id && type === 'VIF' ? VIF : assert.fail(`no ${type} ${id}`)) },
  })
}

describe('the ACL of the VIF routes', () => {
  it('requires the privilege on the network to add a rule with a priority', () => {
    assert.deepEqual(networkObjectIds('add', { ...WEB, port: 8443 }), [])
    assert.deepEqual(networkObjectIds('add', { ...WEB, port: 8443, priority: 50000 }), ['net'])
  })

  it('requires the privilege on the network to add a rule over one that has a priority', () => {
    assert.deepEqual(networkObjectIds('add', { ...SSH, protocol: 'tcp', allow: true }), ['net'])
    assert.deepEqual(networkObjectIds('add', { ...WEB, allow: false }), [])
  })

  it('requires the privilege on the network to update a priority, or a rule that has one', () => {
    assert.deepEqual(networkObjectIds('update', { oldRule: WEB, newRule: { allow: false } }), [])
    assert.deepEqual(networkObjectIds('update', { oldRule: WEB, newRule: { priority: 50000 } }), ['net'])
    assert.deepEqual(networkObjectIds('update', { oldRule: WEB, newRule: { priority: null } }), ['net'])
    assert.deepEqual(networkObjectIds('update', { oldRule: SSH, newRule: { allow: true } }), ['net'])
  })

  it('requires the privilege on the network to delete a rule that has a priority', () => {
    assert.deepEqual(networkObjectIds('delete', WEB), [])
    assert.deepEqual(networkObjectIds('delete', SSH), ['net'])
  })

  // the middleware runs before the body is validated
  it('requires the privilege on the network for a body that is not a rule', () => {
    assert.deepEqual(networkObjectIds('add', {}), ['net'])
    assert.deepEqual(networkObjectIds('add', { ...WEB, protocol: 6 }), ['net'])
    assert.deepEqual(networkObjectIds('update', { newRule: {} }), ['net'])
    assert.deepEqual(networkObjectIds('update', { oldRule: WEB, newRule: null }), ['net'])
    assert.deepEqual(networkObjectIds('delete', []), ['net'])
  })

  it('is only on the VIF routes', () => {
    const route = findRoute(createController(), 'post', '/networks/{id}/actions/add_traffic_rule')
    assert.deepEqual(
      route.middlewares.find(middleware => middleware.name === 'acl').acls.map(acl => acl.resource),
      ['network']
    )
  })
})

describe('the priority of a rule', () => {
  // the callback of an action route returns once its task is created, without
  // `sync`: a check inside the task would answer 202
  async function rejectsBeforeTheTask(controller, action, body) {
    const route = findRoute(controller, 'post', `/networks/{id}/actions/${action}_traffic_rule`)
    let created = false
    const createAction = async () => {
      created = true
    }
    await assert.rejects(
      async () => route.callback({ req: { params: { id: 'net' }, query: {}, body }, createAction }),
      error => invalidParameters.is(error)
    )
    assert.equal(created, false)
  }

  it('is checked before the task starts', async () => {
    const controller = createController()
    await rejectsBeforeTheTask(controller, 'add', { ...SSH, priority: 8001 })
    await rejectsBeforeTheTask(controller, 'update', { oldRule: SSH, newRule: { priority: 65536 } })
  })

  it('is rejected without the XAPI plugin', async () => {
    const controller = createController({ useDirectChannel: true })
    await rejectsBeforeTheTask(controller, 'add', { ...SSH, priority: 40000 })
    await rejectsBeforeTheTask(controller, 'update', { oldRule: SSH, newRule: { priority: 40000 } })
  })

  it('may be null in an update, even without the XAPI plugin', async () => {
    const route = findRoute(
      createController({ useDirectChannel: true }),
      'post',
      '/networks/{id}/actions/update_traffic_rule'
    )
    let created = false
    await route.callback({
      req: { params: { id: 'net' }, query: {}, body: { oldRule: SSH, newRule: { priority: null } } },
      createAction: async () => {
        created = true
      },
    })
    assert.equal(created, true)
  })
})

describe('the list of the rules of a network', () => {
  it('requires the privilege on every VIF whose rules it lists', () => {
    const controller = createController()
    controller._listTrafficRules = id => {
      assert.equal(id, 'net')
      return [
        { ...SSH, type: 'VIF', sourceId: 'vif1' },
        { ...WEB, type: 'network', sourceId: 'net' },
        { ...WEB, type: 'VIF', sourceId: 'vif1' },
        { ...WEB, type: 'VIF', sourceId: 'vif2' },
      ]
    }
    const route = findRoute(controller, 'get', '/networks/{id}/traffic-rules')
    const acls = route.middlewares.find(middleware => middleware.name === 'acl').acls

    assert.deepEqual(
      acls.map(acl => [acl.resource, acl.action]),
      [
        ['network', 'read'],
        ['vif', 'read'],
      ]
    )
    assert.deepEqual(acls[1].objectIds({ req: { params: { id: 'net' } } }), ['vif1', 'vif2'])
  })
})
