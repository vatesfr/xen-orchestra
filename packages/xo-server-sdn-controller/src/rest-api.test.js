import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { invalidParameters, objectAlreadyExists } from 'xo-common/api-errors.js'
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
  VIFs: ['vif1', 'vif2', 'vif3'],
  other_config: storeRules([{ ...SSH, priority: 40000, cookie: '0x1' }]),
}
const VIF = {
  id: 'vif1',
  type: 'VIF',
  $VM: 'vm',
  $network: 'net',
  other_config: storeRules([{ ...WEB, priority: 30000 }]),
}
// XAPI copies the rules of a VIF to the VIFs of the snapshots and the clones of its VM
const SNAPSHOT_VIF = { ...VIF, id: 'vif2', $VM: 'snapshot' }
const CLONE_VIF = { ...VIF, id: 'vif3', $VM: 'clone' }

function createController({ useDirectChannel = false } = {}) {
  const objects = {
    net: NETWORK,
    vif1: VIF,
    vif2: SNAPSHOT_VIF,
    vif3: CLONE_VIF,
    vm: { type: 'VM' },
    snapshot: { type: 'VM-snapshot' },
    clone: { type: 'VM' },
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
    staticConfig: { useDirectChannel },
  })
}

function findRoute(controller, method, endpoint) {
  return createRestRoutes(controller).find(route => route.method === method && route.endpoint === endpoint)
}

// Runs an action route, and the task it creates at once. Returns whether the task was created.
async function runAction(controller, endpoint, id, body) {
  let created = false
  await findRoute(controller, 'post', endpoint).callback({
    req: { params: { id }, query: { sync: true }, body },
    createAction: task => {
      created = true
      return task()
    },
  })
  return created
}

// without `sync`, an action route answers once its task is created: a check inside answers 202
async function rejectsBeforeTheTask(controller, endpoint, id, body, error) {
  let created = false
  const route = findRoute(controller, 'post', endpoint)
  await assert.rejects(
    async () =>
      route.callback({ req: { params: { id }, query: {}, body }, createAction: async () => (created = true) }),
    actual => error.is(actual)
  )
  assert.equal(created, false)
}

const ADD = '/networks/{id}/actions/add_traffic_rule'
const UPDATE = '/networks/{id}/actions/update_traffic_rule'

describe('the priority of a rule', () => {
  it('is an integer from 0 to 65535', async () => {
    for (const priority of [-1, 1.5, 65536]) {
      await rejectsBeforeTheTask(createController(), ADD, 'net', { ...WEB, priority }, invalidParameters)
      await rejectsBeforeTheTask(
        createController(),
        UPDATE,
        'net',
        { oldRule: SSH, newRule: { priority } },
        invalidParameters
      )
    }
  })

  it('is required with the XAPI plugin', async () => {
    await rejectsBeforeTheTask(createController(), ADD, 'net', WEB, invalidParameters)
    const body = { oldRule: SSH, newRule: { priority: null } }
    await rejectsBeforeTheTask(createController(), UPDATE, 'net', body, invalidParameters)
  })

  it('is refused without the XAPI plugin', async () => {
    const controller = createController({ useDirectChannel: true })
    await rejectsBeforeTheTask(controller, ADD, 'net', { ...WEB, priority: 100 }, invalidParameters)
    await rejectsBeforeTheTask(
      controller,
      UPDATE,
      'net',
      { oldRule: SSH, newRule: { priority: 100 } },
      invalidParameters
    )
  })

  it('is unique on the network, among its rules and those of the VIFs of its VMs', async () => {
    await rejectsBeforeTheTask(createController(), ADD, 'net', { ...WEB, priority: 30000 }, objectAlreadyExists)
    const body = { oldRule: SSH, newRule: { priority: 30000 } }
    await rejectsBeforeTheTask(createController(), UPDATE, 'net', body, objectAlreadyExists)
    const endpoint = '/vifs/{id}/actions/add_traffic_rule'
    await rejectsBeforeTheTask(createController(), endpoint, 'vif1', { ...SSH, priority: 40000 }, objectAlreadyExists)
  })

  it('may be kept by a rule that shares it, like the copy a clone makes', async () => {
    const controller = createController()
    controller._deleteRule = noop
    controller._addRule = noop
    const body = { oldRule: WEB, newRule: { allow: false } }
    assert.equal(await runAction(controller, '/vifs/{id}/actions/update_traffic_rule', 'vif3', body), true)
  })
})

describe('the update of a rule', () => {
  // returns the rule added in place of the old one
  async function update(newRule) {
    const controller = createController()
    let added
    controller._deleteNetworkOfRule = noop
    controller._addNetworkRule = rule => {
      added = rule
    }
    await runAction(controller, UPDATE, 'net', { oldRule: SSH, newRule })
    const { cookie, ...rule } = added
    return rule
  }

  it('keeps the stored priority when `newRule` leaves it out', async () => {
    assert.deepEqual(await update({ allow: true }), { ...SSH, allow: true, priority: 40000, networkId: 'net' })
  })

  it('changes the priority', async () => {
    assert.deepEqual(await update({ priority: 100 }), { ...SSH, priority: 100, networkId: 'net' })
  })
})

describe('the lists of rules', () => {
  it('give the rules of a VIF', async () => {
    const route = findRoute(createController(), 'get', '/vifs/{id}/traffic-rules')
    assert.deepEqual(await route.callback({ req: { params: { id: 'vif1' } } }), [
      { ...WEB, priority: 30000, type: 'VIF', sourceId: 'vif1' },
    ])
  })

  it('give the rules of a network, without their cookie, then those of the VIFs of its VMs', async () => {
    const route = findRoute(createController(), 'get', '/networks/{id}/traffic-rules')
    assert.deepEqual(await route.callback({ req: { params: { id: 'net' } } }), [
      { ...SSH, priority: 40000, type: 'network', sourceId: 'net' },
      { ...WEB, priority: 30000, type: 'VIF', sourceId: 'vif1' },
      { ...WEB, priority: 30000, type: 'VIF', sourceId: 'vif3' },
    ])
  })

  it('require the privilege to read every VIF of the VMs of the network', () => {
    const route = findRoute(createController(), 'get', '/networks/{id}/traffic-rules')
    const [, vifAcl] = route.middlewares.find(middleware => middleware.name === 'acl').acls
    assert.equal(vifAcl.resource, 'vif')
    assert.equal(vifAcl.action, 'read')
    assert.deepEqual(vifAcl.objectIds({ req: { params: { id: 'net' } } }), ['vif1', 'vif3'])
  })
})
