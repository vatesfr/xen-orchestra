import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { invalidParameters } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import createSdnController from './index.js'
import { createRestRoutes } from './rest-api.js'

const noop = () => undefined

const SSH = { allow: false, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/8', direction: 'to' }
const WEB = { allow: true, protocol: 'TCP', port: 443, ipRange: '10.0.0.0/8', direction: 'to' }

const storeRules = rules => ({ [SDN_CONTROLLER_OF_RULES_KEY]: JSON.stringify(rules.map(rule => JSON.stringify(rule))) })

const NETWORK = {
  id: 'net',
  type: 'network',
  VIFs: ['vif1', 'vif2'],
  other_config: storeRules([{ ...SSH, priority: 40000, cookie: '0x1' }]),
}
const VIF = { id: 'vif1', type: 'VIF', $VM: 'vm', other_config: storeRules([WEB]) }
// XAPI copies the rules of a VIF to the VIFs of the snapshots of its VM
const SNAPSHOT_VIF = { ...VIF, id: 'vif2', $VM: 'snapshot' }

function createController() {
  const objects = {
    net: NETWORK,
    vif1: VIF,
    vif2: SNAPSHOT_VIF,
    vm: { type: 'VM' },
    snapshot: { type: 'VM-snapshot' },
  }
  return createSdnController({
    xo: {
      addApiMethods: noop,
      registerRestRoutes: noop,
      getAllXapis: () => [],
      getObject: id => objects[id],
      on: noop,
      removeListener: noop,
    },
    getDataDir: async () => '/tmp',
    staticConfig: {},
  })
}

function findRoute(controller, method, endpoint) {
  return createRestRoutes(controller).find(route => route.method === method && route.endpoint === endpoint)
}

describe('the priority of a rule', () => {
  // without `sync`, an action route answers once its task is created: a check inside answers 202
  async function rejectsBeforeTheTask(action, body) {
    const route = findRoute(createController(), 'post', `/networks/{id}/actions/${action}_traffic_rule`)
    let created = false
    await assert.rejects(
      async () =>
        route.callback({ req: { params: { id: 'net' }, query: {}, body }, createAction: async () => (created = true) }),
      error => invalidParameters.is(error)
    )
    assert.equal(created, false)
  }

  it('is an integer from 0 to 65535, checked before the task starts', async () => {
    for (const priority of [-1, 1.5, 65536]) {
      await rejectsBeforeTheTask('add', { ...SSH, priority })
      await rejectsBeforeTheTask('update', { oldRule: SSH, newRule: { priority } })
    }
  })
})

describe('the update of a rule', () => {
  // runs the task at once, and returns the rule added in place of the old one
  async function update(newRule) {
    const controller = createController()
    let added
    controller._deleteNetworkOfRule = noop
    controller._addNetworkRule = async rule => {
      added = rule
    }
    const route = findRoute(controller, 'post', '/networks/{id}/actions/update_traffic_rule')
    await route.callback({
      req: { params: { id: 'net' }, query: { sync: true }, body: { oldRule: SSH, newRule } },
      createAction: task => task(),
    })
    const { cookie, ...rule } = added
    return rule
  }

  it('keeps the stored priority when `newRule` leaves it out', async () => {
    assert.deepEqual(await update({ allow: true }), { ...SSH, allow: true, priority: 40000, networkId: 'net' })
  })

  it('changes the priority, and removes it with `null`', async () => {
    assert.deepEqual(await update({ priority: 100 }), { ...SSH, priority: 100, networkId: 'net' })
    assert.deepEqual(await update({ priority: null }), { ...SSH, networkId: 'net' })
  })
})

describe('the lists of rules', () => {
  it('give the rules of a VIF', async () => {
    const route = findRoute(createController(), 'get', '/vifs/{id}/traffic-rules')
    assert.deepEqual(await route.callback({ req: { params: { id: 'vif1' } } }), [
      { ...WEB, type: 'VIF', sourceId: 'vif1' },
    ])
  })

  it('give the rules of a network, without their cookie, then those of the VIFs of its VMs', async () => {
    const route = findRoute(createController(), 'get', '/networks/{id}/traffic-rules')
    assert.deepEqual(await route.callback({ req: { params: { id: 'net' } } }), [
      { ...SSH, priority: 40000, type: 'network', sourceId: 'net' },
      { ...WEB, type: 'VIF', sourceId: 'vif1' },
    ])
  })

  it('require the privilege to read every VIF of the VMs of the network', () => {
    const route = findRoute(createController(), 'get', '/networks/{id}/traffic-rules')
    const [, vifAcl] = route.middlewares.find(middleware => middleware.name === 'acl').acls
    assert.equal(vifAcl.resource, 'vif')
    assert.equal(vifAcl.action, 'read')
    assert.deepEqual(vifAcl.objectIds({ req: { params: { id: 'net' } } }), ['vif1'])
  })
})
