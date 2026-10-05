import '../logSetup.js'
import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

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
      const network = await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`)
      const raw = network.other_config?.['xo:sdn-controller:of-rules']
      return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
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
      const vif = await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}?fields=*`)
      const raw = vif.other_config?.['xo:sdn-controller:of-rules']
      return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
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

  // A rule can have an OpenFlow priority, unique among the rules of its network,
  // network and VIF rules alike
  describe('Traffic rule priorities', () => {
    // a range VALID_RULE does not use: the cleanup deletes every network rule in it
    const TEST_IP_RANGE = '198.51.100.0/24'
    const NET_RULE = { allow: true, direction: 'to', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 443 }
    const NET_RULE_2 = { ...NET_RULE, port: 8443 }
    const VIF_RULE = { allow: true, direction: 'from', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 22 }

    // the OpenFlow priority of a rule without one
    const DEFAULT_PRIORITY = 32768

    // free priorities, in ascending order
    let p

    const parseRules = object => {
      const raw = object.other_config?.['xo:sdn-controller:of-rules']
      return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
    }
    const rulesOf = async path => parseRules(await dispatchClient.restApiClient.get(`${path}?fields=*`))
    const networkRules = () => rulesOf(`/rest/v0/networks/${networkId}`)
    const vifRules = (id = vifId) => rulesOf(`/rest/v0/vifs/${id}`)

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`
    const findRule = (rules, match) => rules.find(r => ruleKey(r) === ruleKey(match))

    const addRule = (collection, id, rule) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/add_traffic_rule?sync=true`, rule)
    const updateRule = (collection, id, oldRule, newRule) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/update_traffic_rule?sync=true`, {
        oldRule,
        newRule,
      })

    const rejectsWithStatus = (promise, status) => assert.rejects(promise, { message: new RegExp(`^HTTP ${status}:`) })

    // Priorities nothing on the test network uses: a rule left there by another
    // suite or an aborted run must not be the one answering 409
    before(async () => {
      if (skipReason !== undefined) {
        return
      }
      const network = await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`)
      const rules = [parseRules(network), ...(await Promise.all(network.VIFs.map(id => vifRules(id))))].flat()
      const used = new Set(rules.map(rule => rule.priority))
      p = []
      for (let priority = 40000; p.length < 5; priority++) {
        if (!used.has(priority)) {
          p.push(priority)
        }
      }
    })

    // VIF rules go with the VMs, at teardown
    after(async () => {
      if (skipReason !== undefined) {
        return
      }
      for (const { allow, direction, ipRange, protocol, port } of await networkRules()) {
        if (ipRange === TEST_IP_RANGE) {
          await dispatchClient.restApiClient.post(
            `${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`,
            { allow, direction, ipRange, protocol, port }
          )
        }
      }
    })

    itSdn('should store the priority of a network rule', async () => {
      await addRule('networks', networkId, { ...NET_RULE, priority: p[0] })
      assert.strictEqual(findRule(await networkRules(), NET_RULE)?.priority, p[0])
    })

    itSdn('should reject a priority that is not an integer from 0 to 65535', async () => {
      for (const priority of [-1, 65536, 1.5, '40000']) {
        await rejectsWithStatus(addRule('networks', networkId, { ...NET_RULE_2, priority }), 422)
      }
      assert.strictEqual(findRule(await networkRules(), NET_RULE_2), undefined)
    })

    itSdn('should reject a VIF rule with the priority of a network rule', async () => {
      await rejectsWithStatus(addRule('vifs', vifId, { ...VIF_RULE, priority: p[0] }), 409)
      assert.strictEqual(findRule(await vifRules(), VIF_RULE), undefined)
    })

    itSdn('should reject a network rule with the priority of a VIF rule', async () => {
      await addRule('vifs', vifId, { ...VIF_RULE, priority: p[1] })
      assert.strictEqual(findRule(await vifRules(), VIF_RULE)?.priority, p[1])

      await rejectsWithStatus(addRule('networks', networkId, { ...NET_RULE_2, priority: p[1] }), 409)
      assert.strictEqual(findRule(await networkRules(), NET_RULE_2), undefined)
    })

    // XO 5 sends no priority
    itSdn('should keep the priority when the rule is added again', async () => {
      await addRule('networks', networkId, { ...NET_RULE, priority: p[0] })
      await addRule('networks', networkId, { ...NET_RULE, allow: false })
      const rule = findRule(await networkRules(), NET_RULE)
      assert.strictEqual(rule.allow, false)
      assert.strictEqual(rule.priority, p[0])
    })

    itSdn('should store the rules highest priority first', async () => {
      await addRule('networks', networkId, { ...NET_RULE_2, priority: p[2] })
      const rules = await networkRules()
      const priorities = rules.map(rule => rule.priority ?? DEFAULT_PRIORITY)
      assert.deepStrictEqual(
        priorities,
        [...priorities].sort((a, b) => b - a)
      )
      assert(rules.indexOf(findRule(rules, NET_RULE_2)) < rules.indexOf(findRule(rules, NET_RULE)))
    })

    itSdn('should move a rule to another priority', async () => {
      await updateRule('networks', networkId, { ...NET_RULE, allow: false }, { priority: p[3] })
      assert.strictEqual(findRule(await networkRules(), NET_RULE)?.priority, p[3])
    })

    itSdn('should keep the priority when an update does not mention it', async () => {
      await updateRule('networks', networkId, { ...NET_RULE, allow: false }, { allow: true })
      const rule = findRule(await networkRules(), NET_RULE)
      assert.strictEqual(rule.allow, true)
      assert.strictEqual(rule.priority, p[3])
    })

    itSdn('should reject an update to the priority of another rule of the network', async () => {
      await rejectsWithStatus(updateRule('networks', networkId, NET_RULE, { priority: p[1] }), 409)
      assert.strictEqual(findRule(await networkRules(), NET_RULE)?.priority, p[3])
    })

    itSdn('should reject an update to a priority that is not an integer from 0 to 65535', () =>
      rejectsWithStatus(updateRule('networks', networkId, NET_RULE, { priority: 70000 }), 422)
    )

    itSdn('should remove the priority when an update sets it to null', async () => {
      await updateRule('networks', networkId, NET_RULE, { priority: null })
      const rule = findRule(await networkRules(), NET_RULE)
      assert(rule !== undefined, 'Rule should still be present')
      assert.strictEqual('priority' in rule, false)
    })

    itSdn('should move a VIF rule to another priority', async () => {
      await updateRule('vifs', vifId, VIF_RULE, { priority: p[4] })
      assert.strictEqual(findRule(await vifRules(), VIF_RULE)?.priority, p[4])
    })

    // The flows of a halted VM's rules go, but the rules stay for its next start
    itSdn('should keep the rules of a halted VM, and their priorities', async () => {
      await dispatchClient.vm.stop(vm.uuid, { force: true })
      assert.strictEqual(findRule(await vifRules(), VIF_RULE)?.priority, p[4])
      await rejectsWithStatus(updateRule('networks', networkId, NET_RULE, { priority: p[4] }), 409)
    })

    // XAPI copies the VIFs' other_config to a clone, so its rules share the
    // priorities of the original ones. VM.clone needs the VM halted, as the previous
    // test left it.
    itSdn('should let a clone edit the rules it copied', async () => {
      const cloneName = `${vm.name_label}-sdn-clone`
      const cloneId = await dispatchClient.vm.clone(vm.uuid, cloneName)
      tracker.trackResource('vm', cloneId, { name: cloneName })
      const [cloneVifId] = (await dispatchClient.restApiClient.get(`/rest/v0/vms/${cloneId}`)).VIFs
      assert.strictEqual(findRule(await vifRules(cloneVifId), VIF_RULE)?.priority, p[4])

      await updateRule('vifs', cloneVifId, VIF_RULE, { allow: false })
      const rule = findRule(await vifRules(cloneVifId), VIF_RULE)
      assert.strictEqual(rule.allow, false)
      assert.strictEqual(rule.priority, p[4])
      assert.strictEqual(findRule(await vifRules(), VIF_RULE)?.allow, true, 'The original rule must not change')

      await rejectsWithStatus(updateRule('vifs', cloneVifId, { ...VIF_RULE, allow: false }, { priority: p[2] }), 409)
    })
  })
})
