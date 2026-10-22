import '../logSetup.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { RestApiClient } from '../client/restApiClient.js'
import { createTestUser, deleteTestUser, TEST_USER_PREFIX } from '../utils/aclUtils.js'
import { getRequiredEnv, waitUntil } from '../utils/index.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:sdn-controller')

const BASE = '/rest/v0/plugins/sdn-controller'

// Note : this test assumes that the config has the useDirectChannel option set to false
// the old backend is being replaced and doesn't have support for network rules deletion, and is generally unstable.

const VALID_RULE = {
  allow: true,
  direction: 'from',
  ipRange: '10.0.0.0/8',
  protocol: 'TCP',
  port: 8080,
}

// the rules of a network or a VIF, stored as JSON strings inside their `other_config`
const parseRules = object => {
  const raw = object.other_config?.['xo:sdn-controller:of-rules']
  return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
}

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
    const SENTINEL_RULE = { allow: true, direction: 'to', ipRange: '192.0.2.0/24', protocol: 'UDP', port: 1 }
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
      assert.rejects(
        dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
          allow: true,
          direction: 'to',
          ipRange: '192.168.99.0/24',
          protocol: 'UDP',
          port: 9999,
        }),
        { message: /^HTTP 404:/ }
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

    itSdn('should not duplicate the rule when added again', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE)
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
      assert.rejects(
        dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
          allow: true,
          direction: 'to',
          ipRange: '192.168.99.0/24',
          protocol: 'UDP',
          port: 9999,
        }),
        { message: /^HTTP 404:/ }
      )
    )
  })

  // ---------------------------------------------------------------------------

  // The rules of a network, network and VIF rules alike, apply in the order of their
  // priority, which is their rank: 1 applies first
  describe('Traffic rule priorities', () => {
    // a range VALID_RULE does not use: the cleanup deletes every network rule in it
    const TEST_IP_RANGE = '198.51.100.0/24'
    const NET_RULE = { allow: true, direction: 'to', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 443 }
    const NET_RULE_2 = { ...NET_RULE, port: 8443 }
    const NET_RULE_3 = { ...NET_RULE, port: 9443 }
    const VIF_RULE = { allow: true, direction: 'from', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 22 }
    // the first one put first, the others inserted under it until no priority is free
    const SPREAD_RULES = [2443, 2444, 2445, 2446, 2447, 2448].map(port => ({ ...NET_RULE, port }))

    const networkRules = async () =>
      parseRules(await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`))

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    // `client` is signed in as another user than the admin
    const addRule = (collection, id, rule, { sync = true, client = dispatchClient.restApiClient } = {}) =>
      client.post(`${BASE}/${collection}/${id}/actions/add_traffic_rule${sync ? '?sync=true' : ''}`, rule)
    const updateRule = (collection, id, oldRule, newRule, { client = dispatchClient.restApiClient } = {}) =>
      client.post(`${BASE}/${collection}/${id}/actions/update_traffic_rule?sync=true`, { oldRule, newRule })
    const deleteRule = (
      collection,
      id,
      { allow, direction, ipRange, protocol, port },
      { client = dispatchClient.restApiClient } = {}
    ) => {
      const url = `${BASE}/${collection}/${id}/actions/delete_traffic_rule?sync=true`
      return client.post(url, { allow, direction, ipRange, protocol, port })
    }

    const rejectsWithStatus = (promise, status) => assert.rejects(promise, { message: new RegExp(`^HTTP ${status}:`) })

    // the rules of the network and of its VIFs, by rank
    const listRules = () => dispatchClient.restApiClient.get(`${BASE}/networks/${networkId}/traffic-rules`)
    const findListed = (rules, type, match, sourceId) =>
      rules.find(
        r => r.type === type && ruleKey(r) === ruleKey(match) && (sourceId === undefined || r.sourceId === sourceId)
      )
    const rankOf = async (type, match, sourceId) => findListed(await listRules(), type, match, sourceId)?.priority

    // rules from before priorities, the only ones which may come after a rule put
    // last, are numbered when XO connects to the pool
    const assertLast = async (type, match) => {
      const rules = await listRules()
      assert.strictEqual(findListed(rules, type, match), rules[rules.length - 1])
    }

    // VIF rules go with the VMs, at teardown
    after(async () => {
      if (skipReason !== undefined) {
        return
      }
      for (const rule of await networkRules()) {
        if (rule.ipRange === TEST_IP_RANGE) {
          await deleteRule('networks', networkId, rule)
        }
      }
    })

    itSdn('should put a rule added without a priority last, and answer its priority', async () => {
      const { priority } = await addRule('networks', networkId, NET_RULE)
      assert.strictEqual(priority, await rankOf('network', NET_RULE))
      await assertLast('network', NET_RULE)
    })

    itSdn('should put a rule of priority 1 first', async () => {
      assert.deepStrictEqual(await addRule('vifs', vifId, { ...VIF_RULE, priority: 1 }), { priority: 1 })
      const [first] = await listRules()
      assert.strictEqual(ruleKey(first), ruleKey(VIF_RULE))
    })

    itSdn('should insert a rule before the rule which had its priority', async () => {
      assert.deepStrictEqual(await addRule('networks', networkId, { ...NET_RULE_2, priority: 2 }), { priority: 2 })
      const rules = await listRules()
      assert.deepStrictEqual(rules.slice(0, 2).map(ruleKey), [ruleKey(VIF_RULE), ruleKey(NET_RULE_2)])
      assert.strictEqual(findListed(rules, 'VIF', VIF_RULE).priority, 1)
    })

    itSdn('should put a rule given a priority past the last one last', async () => {
      const { priority } = await addRule('networks', networkId, { ...NET_RULE_3, priority: 100000 })
      assert.strictEqual(priority, await rankOf('network', NET_RULE_3))
      await assertLast('network', NET_RULE_3)
    })

    // without sync, the 422 comes before the task, which an async call does not wait for
    itSdn('should reject a priority that is not an integer from 1, with or without sync', async () => {
      for (const sync of [true, false]) {
        for (const priority of [0, -1, 1.5, '1']) {
          await rejectsWithStatus(addRule('networks', networkId, { ...NET_RULE, port: 1443, priority }, { sync }), 422)
        }
        assert.strictEqual(await rankOf('network', { ...NET_RULE, port: 1443 }), undefined)
      }
    })

    // XO 5 sends no priority
    itSdn('should keep the place of a rule added again without a priority', async () => {
      const rank = await rankOf('network', NET_RULE_2)
      assert.deepStrictEqual(await addRule('networks', networkId, { ...NET_RULE_2, allow: false }), { priority: rank })
    })

    itSdn('should store the rules highest OpenFlow priority first', async () => {
      // a rule from before priorities has none: it counts as the lowest one, 8001
      const priorities = (await networkRules()).map(rule => rule.ofPriority ?? 8001)
      assert.deepStrictEqual(
        priorities,
        [...priorities].sort((a, b) => b - a)
      )
    })

    itSdn('should move a rule to another priority', async () => {
      assert.deepStrictEqual(await updateRule('networks', networkId, NET_RULE, { priority: 1 }), { priority: 1 })
      const [first, second] = await listRules()
      assert.strictEqual(ruleKey(first), ruleKey(NET_RULE))
      assert.strictEqual(ruleKey(second), ruleKey(VIF_RULE))
    })

    itSdn('should keep the place of a rule when an update does not mention its priority', async () => {
      assert.deepStrictEqual(await updateRule('networks', networkId, NET_RULE, { allow: false }), { priority: 1 })
      assert.strictEqual((await listRules())[0].allow, false)
    })

    itSdn('should move a rule after the last one when an update sets its priority to null', async () => {
      await updateRule('networks', networkId, { ...NET_RULE, allow: false }, { priority: null })
      await assertLast('network', NET_RULE)
    })

    itSdn('should reject an update to a priority that is not an integer from 1', () =>
      rejectsWithStatus(updateRule('networks', networkId, { ...NET_RULE, allow: false }, { priority: 0 }), 422)
    )

    itSdn('should reject an update onto the match of another rule', () =>
      rejectsWithStatus(updateRule('networks', networkId, NET_RULE_3, { port: NET_RULE_2.port }), 409)
    )

    itSdn('should return 404 when updating a rule that does not exist', () =>
      rejectsWithStatus(updateRule('networks', networkId, { ...NET_RULE, port: 1443 }, { allow: false }), 404)
    )

    itSdn('should list the rules of the network and of its VIFs by rank', async () => {
      const rules = await listRules()
      const priorities = rules.map(rule => rule.priority)
      assert.deepStrictEqual(
        priorities,
        [...priorities].sort((a, b) => a - b)
      )
      assert.deepStrictEqual(findListed(rules, 'network', NET_RULE_2), {
        ...NET_RULE_2,
        allow: false,
        priority: 2,
        type: 'network',
        sourceId: networkId,
        networkId,
        active: true,
      })
      assert.deepStrictEqual(findListed(rules, 'VIF', VIF_RULE), {
        ...VIF_RULE,
        priority: 1,
        type: 'VIF',
        sourceId: vifId,
        networkId,
        active: true,
      })
    })

    itSdn('should return 404 when listing the rules of a network that does not exist', () =>
      rejectsWithStatus(dispatchClient.restApiClient.get(`${BASE}/networks/${randomUUID()}/traffic-rules`), 404)
    )

    // xo-cli calls the JSON-RPC methods
    itSdn('should take a priority through the JSON-RPC API too', async () => {
      const { allow, ...match } = { ...NET_RULE, port: 3443 }
      assert.deepStrictEqual(
        await dispatchClient.xoClient.call('sdnController.addNetworkRule', { networkId, allow, ...match, priority: 1 }),
        { priority: 1 }
      )
      assert.strictEqual(ruleKey((await listRules())[0]), ruleKey(match))

      await dispatchClient.xoClient.call('sdnController.deleteNetworkRule', { networkId, ...match })
      assert.strictEqual(await rankOf('network', match), undefined)
    })

    // moving down, it leaves its place to the rules it passes
    itSdn('should move a VIF rule to another priority', async () => {
      assert.deepStrictEqual(await updateRule('vifs', vifId, VIF_RULE, { priority: 2 }), { priority: 2 })
      const rules = await listRules()
      assert.strictEqual(findListed(rules, 'network', NET_RULE_2).priority, 1)
      assert.strictEqual(findListed(rules, 'VIF', VIF_RULE).priority, 2)
    })

    // A new rule put first gets a priority 5 above the rule that was first, which leaves 4 free between them:
    // the 4th rule inserted under it finds none, and the priorities of the network are spread again, VIF rules too
    itSdn('should keep the order of the rules when no priority is free at a rank', async () => {
      const ofPriorityOfVifRule = async () =>
        parseRules(await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}?fields=*`)).find(
          rule => ruleKey(rule) === ruleKey(VIF_RULE)
        ).ofPriority
      const previous = (await listRules()).map(ruleKey)
      const ofPriority = await ofPriorityOfVifRule()

      const [first, ...inserted] = SPREAD_RULES
      assert.deepStrictEqual(await addRule('networks', networkId, { ...first, priority: 1 }), { priority: 1 })
      for (const rule of inserted) {
        assert.deepStrictEqual(await addRule('networks', networkId, { ...rule, priority: 2 }), { priority: 2 })
      }

      const rules = await listRules()
      assert.deepStrictEqual(rules.map(ruleKey), [first, ...[...inserted].reverse()].map(ruleKey).concat(previous))
      const priorities = rules.slice(0, SPREAD_RULES.length).map(rule => rule.priority)
      assert.deepStrictEqual(priorities, [1, 2, 3, 4, 5, 6])
      assert.notStrictEqual(await ofPriorityOfVifRule(), ofPriority, 'The VIF rule should have been moved')
    })

    itSdn('should close up the ranks of the rules after a deleted one', async () => {
      const rank = await rankOf('VIF', VIF_RULE)
      await deleteRule('networks', networkId, SPREAD_RULES[0])
      const rules = await listRules()
      assert.strictEqual(findListed(rules, 'network', SPREAD_RULES[0]), undefined)
      assert.strictEqual(findListed(rules, 'VIF', VIF_RULE).priority, rank - 1)
    })

    // A halted VM's rules lose their flows, but keep their place for its next start
    itSdn('should keep the rules of a halted VM, and their place', async () => {
      const rank = await rankOf('VIF', VIF_RULE)
      await dispatchClient.vm.stop(vm.uuid, { force: true })
      const listed = findListed(await listRules(), 'VIF', VIF_RULE)
      assert.strictEqual(listed?.priority, rank)
      assert.strictEqual(listed.active, false)
    })

    // XAPI copies the VIFs' other_config to a clone, whose rules share the priorities of
    // the original ones. VM.clone needs the VM halted, as the previous test left it
    itSdn('should let a clone edit the rules it copied, and move them', async () => {
      const cloneName = `${vm.name_label}-sdn-clone`
      const cloneId = await dispatchClient.vm.clone(vm.uuid, cloneName)
      tracker.trackResource('vm', cloneId, { name: cloneName })
      const [cloneVifId] = (await dispatchClient.restApiClient.get(`/rest/v0/vms/${cloneId}`)).VIFs
      const rank = await rankOf('VIF', VIF_RULE, vifId)
      assert.strictEqual(await rankOf('VIF', VIF_RULE, cloneVifId), rank)

      assert.deepStrictEqual(await updateRule('vifs', cloneVifId, VIF_RULE, { allow: false }), { priority: rank })
      const rules = await listRules()
      assert.strictEqual(findListed(rules, 'VIF', VIF_RULE, cloneVifId).allow, false)
      assert.strictEqual(findListed(rules, 'VIF', VIF_RULE, vifId).allow, true, 'The original rule must not change')

      // before the original, which shared its priority
      await updateRule('vifs', cloneVifId, { ...VIF_RULE, allow: false }, { priority: rank })
      assert.strictEqual(await rankOf('VIF', VIF_RULE, cloneVifId), rank)
      assert.strictEqual(await rankOf('VIF', VIF_RULE, vifId), rank + 1)
    })

    // XAPI copies them to a snapshot too, whose VIFs never apply
    itSdn('should not list the rules of the VIFs of a snapshot', async () => {
      const rules = await listRules()
      // destroyed with the VM, at teardown
      const { id: snapshotId } = await dispatchClient.restApiClient.post(
        `/rest/v0/vms/${vm.uuid}/actions/snapshot?sync=true`,
        { name_label: `${vm.name_label}-sdn-snapshot` }
      )
      // XO gets the snapshot from the next XAPI events
      const snapshotVifs = await waitUntil(async () => {
        const { VIFs } = await dispatchClient.restApiClient.get(`/rest/v0/vm-snapshots/${snapshotId}`)
        return Promise.all(VIFs.map(id => dispatchClient.restApiClient.get(`/rest/v0/vifs/${id}?fields=*`)))
      }, 500)
      assert(
        snapshotVifs.some(vif => parseRules(vif).some(rule => ruleKey(rule) === ruleKey(VIF_RULE))),
        'The snapshot should have a copy of the VIF rule'
      )

      assert.deepStrictEqual(await listRules(), rules)
    })

    // Without the privilege on the network, a user with privileges on a VIF could put its
    // rules above those of the network: it can add rules, put last, but neither give a
    // priority nor change a rule that has one, as every rule added since priorities has
    describe('privileges', () => {
      const USER_RULE = { allow: true, direction: 'from', ipRange: TEST_IP_RANGE, protocol: 'UDP', port: 53 }

      let testUser
      let roleId
      let userClient

      before(async () => {
        if (skipReason !== undefined) {
          return
        }
        // the ACL suite deletes the users with its prefix that a failed run left
        testUser = await createTestUser(dispatchClient.xoClient)
        ;({ id: roleId } = await dispatchClient.restApiClient.post('/rest/v0/acl-roles', {
          name: `${TEST_USER_PREFIX}sdn-controller-${Date.now()}`,
          privileges: [{ resource: 'vif', action: 'update:other_config', effect: 'allow', selector: `id:${vifId}` }],
        }))
        await dispatchClient.restApiClient.put(`/rest/v0/acl-roles/${roleId}/users/${testUser.id}`)

        userClient = new RestApiClient({
          xoUrl: getRequiredEnv('HOSTNAME'),
          username: testUser.email,
          password: testUser.password,
        })
        await userClient.connect()
      })

      after(async () => {
        if (roleId !== undefined) {
          await dispatchClient.restApiClient.delete(`/rest/v0/acl-roles/${roleId}`)
        }
        if (testUser !== undefined) {
          await deleteTestUser(dispatchClient.xoClient, testUser.id)
        }
      })

      itSdn('should let a user with privileges on the VIF only add a rule, put last', async () => {
        const { priority } = await addRule('vifs', vifId, USER_RULE, { client: userClient })
        assert.strictEqual(priority, await rankOf('VIF', USER_RULE))
        await assertLast('VIF', USER_RULE)
      })

      itSdn('should not let it give a priority', async () => {
        const rule = { ...USER_RULE, port: 853 }
        await rejectsWithStatus(addRule('vifs', vifId, { ...rule, priority: 1 }, { client: userClient }), 403)
        assert.strictEqual(await rankOf('VIF', rule), undefined)
      })

      itSdn('should not let it change or delete a rule that has a priority', async () => {
        await rejectsWithStatus(addRule('vifs', vifId, { ...USER_RULE, allow: false }, { client: userClient }), 403)
        await rejectsWithStatus(updateRule('vifs', vifId, USER_RULE, { port: 853 }, { client: userClient }), 403)
        await rejectsWithStatus(deleteRule('vifs', vifId, USER_RULE, { client: userClient }), 403)
        assert.strictEqual(findListed(await listRules(), 'VIF', USER_RULE)?.allow, true)
      })

      itSdn('should let it do so with the privilege on the network too', async () => {
        await dispatchClient.restApiClient.post('/rest/v0/acl-privileges', {
          roleId,
          resource: 'network',
          action: 'update:other_config',
          effect: 'allow',
          selector: `id:${networkId}`,
        })
        assert.deepStrictEqual(await updateRule('vifs', vifId, USER_RULE, { priority: 1 }, { client: userClient }), {
          priority: 1,
        })
        await deleteRule('vifs', vifId, USER_RULE, { client: userClient })
        assert.strictEqual(await rankOf('VIF', USER_RULE), undefined)
      })
    })
  })
})
