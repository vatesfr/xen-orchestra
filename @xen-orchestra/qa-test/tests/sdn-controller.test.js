import '../logSetup.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { setup, teardown } from './setup.js'

const log = createLogger('qa:sdn-controller')

const BASE = '/rest/v0/plugins/sdn-controller'

// Note : this test assumes that the config has the useDirectChannel option set to false
// the old backend is being replaced and doesn't have support for network rules deletion, and is generally unstable.

// Priorities are unique on a network: the network rule tests delete theirs before the VIF ones add it
const VALID_RULE = {
  allow: true,
  direction: 'from',
  ipRange: '10.0.0.0/8',
  protocol: 'TCP',
  port: 8080,
  priority: 31000,
}

// the rules of a network or a VIF, stored as JSON strings inside their `other_config`
const parseRules = object => {
  const raw = object.other_config?.['xo:sdn-controller:of-rules']
  return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
}

// the REST API answers an error with its status in the message, `HTTP <status>: …`
const rejectsWithStatus = (promise, status) => assert.rejects(promise, { message: new RegExp(`^HTTP ${status}:`) })

describe('SDN Controller REST API', { skip: !process.env.SDN_CONTROLLER_VM_ID }, () => {
  let dispatchClient
  let tracker
  let vm
  let networkId
  let vifId

  let skipReason

  const itSdn = (name, fn) =>
    it(name, async t => {
      if (skipReason !== undefined) return t.skip(skipReason)
      return fn(t)
    })

  before(async () => {
    const sdnVmId = process.env.SDN_CONTROLLER_VM_ID
    let vms
    ;({ dispatchClient, tracker, vms } = await setup({ referenceVmId: sdnVmId }))
    // Only using one VM
    vm = vms[0]

    const vmDetails = await dispatchClient.restApiClient.get(`/rest/v0/vms/${vm.uuid}`)
    if (!(vmDetails.VIFs?.length > 0)) {
      skipReason = `SDN_CONTROLLER_VM_ID VM ${vm.uuid} has no VIF — point it at a VM with a VIF on an SDN-managed network`
      return
    }

    vifId = vmDetails.VIFs[0]
    const vif = await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}`)
    networkId = vif.$network ?? vif.network
    if (networkId === undefined) {
      skipReason = `VIF ${vifId} has no associated network`
      return
    }

    log.debug('Test IDs derived from VM', { vifId, networkId })

    // Throwaway VIF add+delete: force the lazy SDN controller install on a pristine pool
    const SENTINEL_RULE = {
      allow: true,
      direction: 'to',
      ipRange: '192.0.2.0/24',
      protocol: 'UDP',
      port: 1,
      priority: 30999,
    }
    try {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, SENTINEL_RULE)
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        allow: SENTINEL_RULE.allow,
        direction: SENTINEL_RULE.direction,
        ipRange: SENTINEL_RULE.ipRange,
        protocol: SENTINEL_RULE.protocol,
        port: SENTINEL_RULE.port,
      })
    } catch (error) {
      skipReason = `SDN controller rule endpoint not usable (throwaway VIF add/delete failed: ${error.message}). Check the plugin is loaded and the host is reachable.`
      log.warn('SDN controller pre-check failed', { skipReason })
      return
    }

    // Backend gate. The plugin records the active backend in the pool's other_config 'xo:sdn-controller:of-method' = 'xapi-plugin'
    // It is written at controller connect time, not by the throwaway add above (which would
    // need a reconnect to surface it).
    const network = await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`)
    const ofMethod =
      network.$pool !== undefined
        ? (await dispatchClient.restApiClient.get(`/rest/v0/pools/${network.$pool}?fields=*`)).otherConfig?.[
            'xo:sdn-controller:of-method'
          ]
        : undefined

    if (ofMethod === undefined || ofMethod !== 'xapi-plugin') {
      skipReason =
        `SDN controller pool uses the '${ofMethod}' backend; this suite requires the ` +
        `'xapi-plugin' backend (set the useDirectChannel option to false in config.toml).`
      log.warn('SDN controller pre-check failed', { skipReason })
    }
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })

  // ---------------------------------------------------------------------------

  describe('Network rules – input validation', () => {
    const rejectsWithHttpError = async (url, body) =>
      assert.rejects(
        () => dispatchClient.restApiClient.post(url, body),
        err => {
          assert.match(
            err.message,
            /HTTP [45]\d\d/,
            `expected a 4xx/5xx HTTP error for POST ${url} with body ${JSON.stringify(body)}, got instead: ${err.message}`
          )
          return true
        },
        `expected POST ${url} with body ${JSON.stringify(body)} to be rejected with an HTTP error, but it resolved`
      )

    itSdn('should reject add when allow is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when allow is a string instead of boolean', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: 'true',
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      })
    )

    itSdn('should reject delete when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      })
    )
  })

  // ---------------------------------------------------------------------------

  describe('Network rules – CRUD', () => {
    const getNetworkRules = async () => {
      return parseRules(await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`))
    }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    itSdn('should add a TCP allow rule to the network', async () => {
      await dispatchClient.restApiClient.post(
        `${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`,
        VALID_RULE
      )
      const rules = await getNetworkRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert(found !== undefined, 'Rule should be present after add')
      assert.strictEqual(found.allow, true)
    })

    itSdn(
      'should overwrite the rule when added again with allow=false (no duplication, cookie preserved)',
      async () => {
        await dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
          ...VALID_RULE,
          allow: false,
          // the rule still has its own
          priority: VALID_RULE.priority + 1,
        })
        const rules = await getNetworkRules()
        const matching = rules.filter(r => ruleKey(r) === ruleKey(VALID_RULE))
        assert.strictEqual(matching.length, 1, 'Rule must not be duplicated')
        assert.strictEqual(matching[0].allow, false, 'Rule allow field must be updated')
      }
    )

    itSdn('should delete the rule', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        // the route matches `allow` too, which the previous test set to false
        allow: false,
        direction: VALID_RULE.direction,
        ipRange: VALID_RULE.ipRange,
        protocol: VALID_RULE.protocol,
        port: VALID_RULE.port,
      })
      const rules = await getNetworkRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      log.debug('Rules after deletion attempt', { rules })

      assert.strictEqual(found, undefined, 'Rule should be absent after delete')
    })

    itSdn('should return 404 when deleting a non-existent rule', () =>
      rejectsWithStatus(
        dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
          allow: true,
          direction: 'to',
          ipRange: '192.168.99.0/24',
          protocol: 'UDP',
          port: 9999,
        }),
        404
      )
    )
  })

  // ---------------------------------------------------------------------------

  describe('VIF rules – input validation', () => {
    const rejectsWithHttpError = async (url, body) =>
      assert.rejects(
        () => dispatchClient.restApiClient.post(url, body),
        err => {
          assert.match(
            err.message,
            /HTTP [45]\d\d/,
            `expected a 4xx/5xx HTTP error for POST ${url} with body ${JSON.stringify(body)}, got instead: ${err.message}`
          )
          return true
        },
        `expected POST ${url} with body ${JSON.stringify(body)} to be rejected with an HTTP error, but it resolved`
      )

    itSdn('should reject add when allow is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when allow is a string instead of boolean', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: 'false',
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject add when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      })
    )

    itSdn('should reject delete when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      })
    )
  })

  // ---------------------------------------------------------------------------

  describe('VIF rules – CRUD', () => {
    const getVifRules = async () => {
      return parseRules(await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}?fields=*`))
    }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    itSdn('should add a TCP allow rule to the VIF', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE)
      const rules = await getVifRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert(found !== undefined, 'Rule should be present after add')
      assert.strictEqual(found.allow, true)
    })

    itSdn('should reject the rule added again with its priority, without duplicating it', async () => {
      await rejectsWithStatus(
        dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE),
        409
      )
      const rules = await getVifRules()
      const matching = rules.filter(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert.strictEqual(matching.length, 1, 'Rule must not be duplicated')
    })

    itSdn('should delete the rule', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        allow: VALID_RULE.allow,
        direction: VALID_RULE.direction,
        ipRange: VALID_RULE.ipRange,
        protocol: VALID_RULE.protocol,
        port: VALID_RULE.port,
      })
      const rules = await getVifRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      log.debug('Rules after deletion attempt', { rules })
      assert.strictEqual(found, undefined, 'Rule should be absent after delete')
    })

    itSdn('should return 404 when deleting a non-existent rule', () =>
      rejectsWithStatus(
        dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
          allow: true,
          direction: 'to',
          ipRange: '192.168.99.0/24',
          protocol: 'UDP',
          port: 9999,
        }),
        404
      )
    )
  })

  // ---------------------------------------------------------------------------

  // The client gives the OpenFlow priority itself: XO stores it and passes it to the XAPI plugin
  describe('Traffic rule priorities', () => {
    // a range VALID_RULE does not use: the cleanup deletes every network rule in it
    const TEST_IP_RANGE = '198.51.100.0/24'
    const NET_RULE = { allow: true, direction: 'to', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 443 }
    const VIF_RULE = { allow: true, direction: 'from', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 22 }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    const addRule = (collection, id, rule, { sync = true } = {}) =>
      dispatchClient.restApiClient.post(
        `${BASE}/${collection}/${id}/actions/add_traffic_rule${sync ? '?sync=true' : ''}`,
        rule
      )
    const updateRule = (collection, id, oldRule, newRule) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/update_traffic_rule?sync=true`, {
        oldRule,
        newRule,
      })
    const deleteRule = (collection, id, { allow, direction, ipRange, protocol, port }) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/delete_traffic_rule?sync=true`, {
        allow,
        direction,
        ipRange,
        protocol,
        port,
      })

    const listRules = (collection, id) => dispatchClient.restApiClient.get(`${BASE}/${collection}/${id}/traffic-rules`)
    const findRule = (rules, rule, sourceId) => rules.find(r => r.sourceId === sourceId && ruleKey(r) === ruleKey(rule))

    // VIF rules go with the VMs, at teardown
    after(async () => {
      if (skipReason !== undefined) {
        return
      }
      for (const rule of await listRules('networks', networkId)) {
        if (rule.type === 'network' && rule.ipRange === TEST_IP_RANGE) {
          await deleteRule('networks', networkId, rule)
        }
      }
    })

    itSdn('should store and list the priority of a network rule', async () => {
      await addRule('networks', networkId, { ...NET_RULE, priority: 40000 })
      assert.deepStrictEqual(findRule(await listRules('networks', networkId), NET_RULE, networkId), {
        ...NET_RULE,
        priority: 40000,
        type: 'network',
        sourceId: networkId,
      })
    })

    itSdn('should store the priority of a VIF rule, listed with the VIF and with its network', async () => {
      await addRule('vifs', vifId, { ...VIF_RULE, priority: 50000 })
      const expected = { ...VIF_RULE, priority: 50000, type: 'VIF', sourceId: vifId }
      assert.deepStrictEqual(findRule(await listRules('vifs', vifId), VIF_RULE, vifId), expected)
      assert.deepStrictEqual(findRule(await listRules('networks', networkId), VIF_RULE, vifId), expected)
    })

    itSdn('should change the priority of a rule', async () => {
      await updateRule('networks', networkId, NET_RULE, { priority: 45000 })
      assert.strictEqual(findRule(await listRules('networks', networkId), NET_RULE, networkId)?.priority, 45000)
    })

    itSdn('should keep the priority when an update leaves it out', async () => {
      await updateRule('networks', networkId, NET_RULE, { allow: false })
      const rule = findRule(await listRules('networks', networkId), NET_RULE, networkId)
      assert.strictEqual(rule?.allow, false)
      assert.strictEqual(rule.priority, 45000)
    })

    // XO 5 and XO 6 send none yet: such a rule has the OpenFlow default, as the rules from before priorities
    itSdn('should accept a rule without a priority, and an update removing it', async () => {
      const rule = { ...NET_RULE, port: 1444 }
      await addRule('networks', networkId, rule)
      await updateRule('networks', networkId, rule, { priority: 46000 })
      assert.strictEqual(findRule(await listRules('networks', networkId), rule, networkId)?.priority, 46000)
      await updateRule('networks', networkId, rule, { priority: null })
      assert.deepStrictEqual(findRule(await listRules('networks', networkId), rule, networkId), {
        ...rule,
        type: 'network',
        sourceId: networkId,
      })
    })

    // network and VIF rules alike
    itSdn('should reject a priority another rule of the network has', async () => {
      await rejectsWithStatus(addRule('networks', networkId, { ...NET_RULE, port: 2443, priority: 50000 }), 409)
      await rejectsWithStatus(addRule('vifs', vifId, { ...VIF_RULE, port: 2222, priority: 45000 }), 409)
      await rejectsWithStatus(
        updateRule('networks', networkId, { ...NET_RULE, allow: false }, { priority: 50000 }),
        409
      )
    })

    // without sync, the 422 comes before the task, which an async call does not wait for
    itSdn('should reject a priority that is not an integer from 0 to 65535, with or without sync', async () => {
      const rule = { ...NET_RULE, port: 1443 }
      for (const sync of [true, false]) {
        for (const priority of [-1, 1.5, 65536, '1']) {
          await rejectsWithStatus(addRule('networks', networkId, { ...rule, priority }, { sync }), 422)
        }
      }
      assert.strictEqual(findRule(await listRules('networks', networkId), rule, networkId), undefined)
      await rejectsWithStatus(
        updateRule('networks', networkId, { ...NET_RULE, allow: false }, { priority: 65536 }),
        422
      )
    })

    // xo-cli calls the JSON-RPC methods. 0, a valid priority, is falsy
    itSdn('should take a priority through the JSON-RPC API too', async () => {
      const { allow, ...match } = { ...NET_RULE, port: 3443 }
      await assert.rejects(
        dispatchClient.xoClient.call('sdnController.addNetworkRule', { networkId, allow, ...match, priority: 65536 })
      )
      await dispatchClient.xoClient.call('sdnController.addNetworkRule', { networkId, allow, ...match, priority: 0 })
      assert.strictEqual(findRule(await listRules('networks', networkId), match, networkId)?.priority, 0)

      await dispatchClient.xoClient.call('sdnController.deleteNetworkRule', { networkId, ...match })
      assert.strictEqual(findRule(await listRules('networks', networkId), match, networkId), undefined)
    })

    itSdn('should delete a rule that has a priority', async () => {
      await deleteRule('vifs', vifId, VIF_RULE)
      assert.strictEqual(findRule(await listRules('vifs', vifId), VIF_RULE, vifId), undefined)
    })

    itSdn('should return 404 when listing the rules of a network that does not exist', () =>
      rejectsWithStatus(listRules('networks', randomUUID()), 404)
    )
  })
})
