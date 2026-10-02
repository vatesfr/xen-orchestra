import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { createRestRoutes } from './rest-api.js'

function createFakeController() {
  const controller = {
    _xo: {
      getObject: (id, type) => ({ id, type, other_config: {} }),
      getXapiObject: object => {
        if (object.type === 'VIF') {
          return { $network: object }
        }
        return object
      },
    },
    _trafficRulesFor: async () => undefined,
    _trafficRules: undefined,
    _addRule: async () => {},
    _addNetworkRule: async () => {},
    _deleteRule: async () => {},
    _deleteNetworkOfRule: async () => {},
  }
  return controller
}

function createTrafficRulesModuleMock() {
  const calls = {
    addRule: [],
    deleteRule: [],
    updateRule: [],
    reorderRules: [],
  }

  const module = {
    addRule: async rule => calls.addRule.push(rule),
    deleteRule: async rule => calls.deleteRule.push(rule),
    updateRule: async (target, oldRule, newRule) => calls.updateRule.push({ target, oldRule, newRule }),
    reorderRules: async (networkId, rules) => calls.reorderRules.push({ networkId, rules }),
  }

  return { module, calls }
}

describe('createRestRoutes', () => {
  it('generates routes with correct endpoints', () => {
    const controller = createFakeController()
    const routes = createRestRoutes(controller)

    const endpoints = routes.map(r => r.endpoint)
    assert.ok(endpoints.includes('/networks/{id}/actions/add_traffic_rule'))
    assert.ok(endpoints.includes('/networks/{id}/actions/delete_traffic_rule'))
    assert.ok(endpoints.includes('/networks/{id}/actions/update_traffic_rule'))
    assert.ok(endpoints.includes('/vifs/{id}/actions/add_traffic_rule'))
    assert.ok(endpoints.includes('/vifs/{id}/actions/delete_traffic_rule'))
    assert.ok(endpoints.includes('/vifs/{id}/actions/update_traffic_rule'))
    assert.ok(endpoints.includes('/networks/{id}/actions/reorder_traffic_rules'))
  })

  it('add network route with module calls addRule', async () => {
    const controller = createFakeController()
    const { module: trafficRules, calls } = createTrafficRulesModuleMock()

    controller._trafficRulesFor = async () => trafficRules

    const routes = createRestRoutes(controller)
    const addNetworkRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/add_traffic_rule')

    const createAction = async cb => cb()

    const req = {
      params: { id: 'n1' },
      query: {},
      body: { allow: true, direction: 'to', ipRange: '10.0.0.0/8', protocol: 'tcp' },
    }

    await addNetworkRoute.callback({ req, createAction })

    assert.deepEqual(calls.addRule[0], {
      allow: true,
      direction: 'to',
      ipRange: '10.0.0.0/8',
      protocol: 'tcp',
      networkId: 'n1',
    })
  })

  it('add VIF route with module calls addRule', async () => {
    const controller = createFakeController()
    const { module: trafficRules, calls } = createTrafficRulesModuleMock()

    controller._trafficRulesFor = async () => trafficRules

    const routes = createRestRoutes(controller)
    const addVifRoute = routes.find(r => r.endpoint === '/vifs/{id}/actions/add_traffic_rule')

    const createAction = async cb => cb()

    const req = {
      params: { id: 'vif1' },
      query: {},
      body: { allow: true, direction: 'to', ipRange: '10.0.0.0/8', protocol: 'tcp' },
    }

    await addVifRoute.callback({ req, createAction })

    assert.deepEqual(calls.addRule[0], {
      allow: true,
      direction: 'to',
      ipRange: '10.0.0.0/8',
      protocol: 'tcp',
      vifId: 'vif1',
    })
  })

  it('delete network route with mac and module', async () => {
    const controller = createFakeController()
    const { module: trafficRules, calls } = createTrafficRulesModuleMock()

    controller._trafficRulesFor = async () => trafficRules

    const routes = createRestRoutes(controller)
    const deleteNetworkRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/delete_traffic_rule')

    const createAction = async cb => cb()

    const req = {
      params: { id: 'n1' },
      query: {},
      body: {
        allow: true,
        direction: 'to',
        ipRange: '10.0.0.0/8',
        protocol: 'tcp',
        mac: '6e:0b:9e:72:ab:c6',
      },
    }

    await deleteNetworkRoute.callback({ req, createAction })

    assert.deepEqual(calls.deleteRule[0], {
      allow: true,
      direction: 'to',
      ipRange: '10.0.0.0/8',
      protocol: 'tcp',
      networkId: 'n1',
      mac: '6e:0b:9e:72:ab:c6',
    })
  })

  it('delete network route with mac but no module rejects', async () => {
    const controller = createFakeController()
    controller._trafficRulesFor = async () => undefined

    const routes = createRestRoutes(controller)
    const deleteNetworkRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/delete_traffic_rule')

    const createAction = async cb => {
      try {
        await cb()
        throw new Error('Expected error to be thrown')
      } catch (error) {
        if (error.code !== 10) throw error
        return error
      }
    }

    const req = {
      params: { id: 'n1' },
      query: {},
      body: {
        allow: true,
        direction: 'to',
        ipRange: '10.0.0.0/8',
        protocol: 'tcp',
        mac: '6e:0b:9e:72:ab:c6',
      },
    }

    const error = await deleteNetworkRoute.callback({ req, createAction })
    assert.equal(error.code, 10)
  })

  it('update network route with module calls updateRule', async () => {
    const controller = createFakeController()
    const { module: trafficRules, calls } = createTrafficRulesModuleMock()

    controller._trafficRulesFor = async () => trafficRules

    const routes = createRestRoutes(controller)
    const updateNetworkRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/update_traffic_rule')

    const createAction = async cb => cb()

    const req = {
      params: { id: 'n1' },
      query: {},
      body: {
        oldRule: {
          allow: true,
          direction: 'to',
          ipRange: '10.0.0.0/8',
          protocol: 'tcp',
        },
        newRule: {
          port: null,
        },
      },
    }

    await updateNetworkRoute.callback({ req, createAction })

    assert.deepEqual(calls.updateRule[0], {
      target: { networkId: 'n1' },
      oldRule: {
        allow: true,
        direction: 'to',
        ipRange: '10.0.0.0/8',
        protocol: 'tcp',
      },
      newRule: {
        allow: true,
        direction: 'to',
        ipRange: '10.0.0.0/8',
        protocol: 'tcp',
      },
    })
  })

  it('reorder route without module rejects', async () => {
    const controller = createFakeController()
    controller._trafficRules = undefined

    const routes = createRestRoutes(controller)
    const reorderRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/reorder_traffic_rules')

    const createAction = async cb => {
      try {
        await cb()
        throw new Error('Expected error to be thrown')
      } catch (error) {
        if (error.code !== 25) throw error
        return error
      }
    }

    const req = {
      params: { id: 'n1' },
      query: {},
      body: { rules: [] },
    }

    const error = await reorderRoute.callback({ req, createAction })
    assert.equal(error.code, 25)
  })

  it('reorder route with module calls reorderRules', async () => {
    const controller = createFakeController()
    const { module: trafficRules, calls } = createTrafficRulesModuleMock()

    controller._trafficRules = trafficRules

    const routes = createRestRoutes(controller)
    const reorderRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/reorder_traffic_rules')

    const createAction = async cb => cb()

    const rules = [
      { type: 'network', allow: true, direction: 'to', ipRange: '10.0.0.0/8', protocol: 'tcp' },
      { type: 'VIF', mac: '6e:0b:9e:72:ab:c6', allow: false, direction: 'from', ipRange: '0.0.0.0/0', protocol: 'tcp' },
    ]

    const req = {
      params: { id: 'n1' },
      query: {},
      body: { rules },
    }

    await reorderRoute.callback({ req, createAction })

    assert.deepEqual(calls.reorderRules[0], {
      networkId: 'n1',
      rules,
    })
  })

  it('reorder route has correct body schema', () => {
    const controller = createFakeController()
    const routes = createRestRoutes(controller)
    const reorderRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/reorder_traffic_rules')

    assert.equal(reorderRoute.body.rules.type, 'array')
    assert.equal(reorderRoute.body.rules.items.type, 'object')
    assert.ok(reorderRoute.body.rules.items.fields.type)
    assert.ok(reorderRoute.body.rules.items.fields.mac)
    assert.ok(reorderRoute.body.rules.items.fields.allow)
    assert.ok(reorderRoute.body.rules.items.fields.direction)
    assert.ok(reorderRoute.body.rules.items.fields.ipRange)
    assert.ok(reorderRoute.body.rules.items.fields.protocol)
    assert.ok(reorderRoute.body.rules.items.fields.port)
  })

  it('network delete route has mac in deleteFields', () => {
    const controller = createFakeController()
    const routes = createRestRoutes(controller)
    const deleteNetworkRoute = routes.find(r => r.endpoint === '/networks/{id}/actions/delete_traffic_rule')

    assert.ok(deleteNetworkRoute.body.mac)
  })

  it('VIF delete route does not have mac in deleteFields', () => {
    const controller = createFakeController()
    const routes = createRestRoutes(controller)
    const deleteVifRoute = routes.find(r => r.endpoint === '/vifs/{id}/actions/delete_traffic_rule')

    assert.equal(deleteVifRoute.body.mac, undefined)
  })
})
