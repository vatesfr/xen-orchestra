import '../logSetup.js'
import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { DispatchClient } from '../client/dispatchClient.js'
import { RestApiClient } from '../client/restApiClient.js'
import { createTestUser, deleteTestUser } from '../utils/aclUtils.js'
import { getRequiredEnv } from '../utils/index.js'
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

    itSdn('should reject the rule added again with its priority, without duplicating it', async () => {
      await assert.rejects(
        dispatchClient.restApiClient.post(
          `${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`,
          VALID_RULE
        ),
        { message: /^HTTP 409:/ }
      )
      const rules = await getNetworkRules()
      const matching = rules.filter(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert.strictEqual(matching.length, 1, 'Rule must not be duplicated')
    })

    itSdn('should delete the rule', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        allow: VALID_RULE.allow,
        direction: VALID_RULE.direction,
        ipRange: VALID_RULE.ipRange,
        protocol: VALID_RULE.protocol,
        port: VALID_RULE.port,
        priority: VALID_RULE.priority,
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

    itSdn('should reject the rule added again with its priority, without duplicating it', async () => {
      await assert.rejects(
        dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE),
        { message: /^HTTP 409:/ }
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
        priority: VALID_RULE.priority,
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

  // The client gives the OpenFlow priority itself: XO stores it and passes it to the XAPI plugin
  describe('Traffic rule priorities', () => {
    // a range VALID_RULE does not use: the cleanup deletes every network rule in it
    const TEST_IP_RANGE = '198.51.100.0/24'
    const NET_RULE = { allow: true, direction: 'to', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 443 }
    const VIF_RULE = { allow: true, direction: 'from', ipRange: TEST_IP_RANGE, protocol: 'TCP', port: 22 }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    const addRule = (collection, id, rule) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/add_traffic_rule?sync=true`, rule)
    const updateRule = (collection, id, oldRule, newRule) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/update_traffic_rule?sync=true`, {
        oldRule,
        newRule,
      })
    const deleteRule = (collection, id, { allow, direction, ipRange, protocol, port, priority }) =>
      dispatchClient.restApiClient.post(`${BASE}/${collection}/${id}/actions/delete_traffic_rule?sync=true`, {
        allow,
        direction,
        ipRange,
        protocol,
        port,
        priority,
      })

    // `collection` is `networks` or `vifs`, in the core REST API as in the plugin's
    const rulesOf = async (collection, id) =>
      parseRules(await dispatchClient.restApiClient.get(`/rest/v0/${collection}/${id}?fields=*`))
    const findRule = (rules, rule) => rules.find(r => ruleKey(r) === ruleKey(rule))

    const rejectsWithStatus = (promise, status) => assert.rejects(promise, { message: new RegExp(`^HTTP ${status}:`) })

    // VIF rules go with the VMs, at teardown
    after(async () => {
      if (skipReason !== undefined) {
        return
      }
      for (const rule of await rulesOf('networks', networkId)) {
        if (rule.ipRange === TEST_IP_RANGE) {
          await deleteRule('networks', networkId, rule)
        }
      }
    })

    itSdn('should store the priority of a network rule', async () => {
      await addRule('networks', networkId, { ...NET_RULE, priority: 40000 })
      const { cookie, ...rule } = findRule(await rulesOf('networks', networkId), NET_RULE)
      assert.deepStrictEqual(rule, { ...NET_RULE, priority: 40000 })
    })

    itSdn('should store the priority of a VIF rule', async () => {
      await addRule('vifs', vifId, { ...VIF_RULE, priority: 50000 })
      assert.deepStrictEqual(findRule(await rulesOf('vifs', vifId), VIF_RULE), { ...VIF_RULE, priority: 50000 })
    })

    itSdn('should change the priority of a rule', async () => {
      await updateRule('networks', networkId, { ...NET_RULE, priority: 40000 }, { priority: 45000 })
      assert.strictEqual(findRule(await rulesOf('networks', networkId), NET_RULE)?.priority, 45000)
    })

    itSdn('should keep the priority when an update leaves it out', async () => {
      await updateRule('networks', networkId, { ...NET_RULE, priority: 45000 }, { allow: false })
      const rule = findRule(await rulesOf('networks', networkId), NET_RULE)
      assert.strictEqual(rule?.allow, false)
      assert.strictEqual(rule.priority, 45000)
    })

    // XO 5 and XO 6 send none yet: such a rule has the OpenFlow default, as the rules from before priorities
    itSdn('should accept a rule without a priority, and refuse an update removing one', async () => {
      const rule = { ...NET_RULE, port: 1444 }
      await addRule('networks', networkId, rule)
      const { cookie, ...stored } = findRule(await rulesOf('networks', networkId), rule)
      assert.deepStrictEqual(stored, rule)
      await updateRule('networks', networkId, rule, { priority: 46000 })
      assert.strictEqual(findRule(await rulesOf('networks', networkId), rule)?.priority, 46000)
      await rejectsWithStatus(updateRule('networks', networkId, { ...rule, priority: 46000 }, { priority: null }), 422)
    })

    // network and VIF rules alike
    itSdn('should reject a priority another rule of the network has', async () => {
      await rejectsWithStatus(addRule('networks', networkId, { ...NET_RULE, port: 2443, priority: 50000 }), 409)
      await rejectsWithStatus(addRule('vifs', vifId, { ...VIF_RULE, port: 2222, priority: 45000 }), 409)
      await rejectsWithStatus(
        updateRule('networks', networkId, { ...NET_RULE, allow: false, priority: 45000 }, { priority: 50000 }),
        409
      )
    })

    itSdn('should reject a priority that is not an integer from 0 to 65535', async () => {
      const rule = { ...NET_RULE, port: 1443 }
      for (const priority of [-1, 1.5, 65536, '1']) {
        await rejectsWithStatus(addRule('networks', networkId, { ...rule, priority }), 422)
      }
      assert.strictEqual(findRule(await rulesOf('networks', networkId), rule), undefined)
      await rejectsWithStatus(
        updateRule('networks', networkId, { ...NET_RULE, allow: false, priority: 45000 }, { priority: 65536 }),
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
      assert.strictEqual(findRule(await rulesOf('networks', networkId), match)?.priority, 0)

      await dispatchClient.xoClient.call('sdnController.deleteNetworkRule', { networkId, ...match, priority: 0 })
      assert.strictEqual(findRule(await rulesOf('networks', networkId), match), undefined)
    })

    itSdn('should delete a rule that has a priority, only when given it', async () => {
      await rejectsWithStatus(deleteRule('vifs', vifId, VIF_RULE), 404)
      await deleteRule('vifs', vifId, { ...VIF_RULE, priority: 50000 })
      assert.strictEqual(findRule(await rulesOf('vifs', vifId), VIF_RULE), undefined)
    })
  })
})

// ---------------------------------------------------------------------------

// The networks go on the pools the suite already tests on: the pool of SDN_CONTROLLER_VM_ID and, when it is another
// one, the pool of REFERENCE_VM_ID. Never any other pool XO is connected to: a private network sets the SDN controller
// of its pools. The tunnels go through the network of the management PIF of each pool's master
describe('SDN Controller private networks', { skip: !process.env.SDN_CONTROLLER_VM_ID }, () => {
  let dispatchClient
  let pools
  const networkIds = []

  // RestApiClient answers only the body, and the route's statuses are checked too
  const createPrivateNetwork = async (body, client = dispatchClient.restApiClient) => {
    const response = await fetch(`${client.baseUrl}${BASE}/private_networks?sync=true`, {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify(body),
    })
    const result = await response.json()
    networkIds.push(...(result.ids ?? []))
    return { status: response.status, result }
  }

  const bodyFor = (pools, params) => ({
    poolIds: pools.map(pool => pool.id),
    pifIds: pools.map(pool => pool.pifId),
    name: `qa-sdn-private-network-${Date.now()}`,
    description: 'created by the qa-test suite',
    encapsulation: 'gre',
    ...params,
  })

  const networksNamed = async name =>
    (await dispatchClient.restApiClient.getObjects('/rest/v0/networks')).filter(network => network.name_label === name)

  before(async () => {
    dispatchClient = new DispatchClient()
    await dispatchClient.initialize()

    const { restApiClient } = dispatchClient
    const vmPoolIds = await Promise.all(
      [process.env.SDN_CONTROLLER_VM_ID, getRequiredEnv('REFERENCE_VM_ID')].map(
        async id => (await restApiClient.get(`/rest/v0/vms/${id}`)).$pool
      )
    )
    const [allPools, hosts, pifs] = await Promise.all(
      ['pools', 'hosts', 'pifs'].map(collection => restApiClient.getObjects(`/rest/v0/${collection}`))
    )
    pools = [...new Set(vmPoolIds)].map(id => {
      const { master } = allPools.find(pool => pool.id === id)
      return {
        id,
        masterId: master,
        pifId: pifs.find(pif => pif.$host === master && pif.management)?.id,
        hostCount: hosts.filter(host => host.$pool === id).length,
      }
    })
    log.debug('Private network pools', { pools })
  })

  after(async () => {
    for (const id of networkIds) {
      try {
        await dispatchClient.restApiClient.delete(`/rest/v0/networks/${id}`)
      } catch (error) {
        log.warn('Failed to delete a private network', { error, networkId: id })
      }
    }
    await dispatchClient?.close()
  })

  // the preferred center is a host of the last pool, so that its network is not the first one asked for
  it('should create one network per pool, each with a tunnel on every host, in a single private network', async t => {
    if (pools.length === 1) {
      t.diagnostic('XO is connected to a single pool: the private network spans it alone')
    }
    const preferredCenterId = pools.at(-1).masterId
    const body = bodyFor(pools, { mtu: 1400, preferredCenterId })

    const { status, result } = await createPrivateNetwork(body)
    assert.strictEqual(status, 201, JSON.stringify(result))
    assert.strictEqual(result.ids.length, pools.length)

    const networks = await Promise.all(
      result.ids.map(id => dispatchClient.restApiClient.get(`/rest/v0/networks/${id}?fields=*`))
    )
    const { 'xo:sdn-controller:private-network-uuid': privateNetworkUuid, 'xo:sdn-controller:vni': vni } =
      networks[0].other_config
    assert.match(privateNetworkUuid, /^[0-9a-f-]{36}$/)
    assert.match(vni, /^\d+$/)
    assert.deepStrictEqual(networks.map(network => network.$pool).sort(), pools.map(pool => pool.id).sort())
    for (const network of networks) {
      const pool = pools.find(pool => pool.id === network.$pool)
      assert.strictEqual(network.name_label, body.name)
      assert.strictEqual(network.MTU, 1400)
      assert.strictEqual(network.PIFs.length, pool.hostCount, 'one tunnel access PIF per host')
      assert.deepStrictEqual(
        {
          encapsulation: network.other_config['xo:sdn-controller:encapsulation'],
          preferredCenter: network.other_config['xo:sdn-controller:preferred-center'],
          privateNetworkUuid: network.other_config['xo:sdn-controller:private-network-uuid'],
          vni: network.other_config['xo:sdn-controller:vni'],
        },
        { encapsulation: 'gre', preferredCenter: preferredCenterId, privateNetworkUuid, vni }
      )
    }
  })

  it('should refuse an unknown pool, a pool without a PIF or an unknown encapsulation, creating no network', async () => {
    const body = bodyFor(pools.slice(0, 1))
    for (const [params, expectedStatus] of [
      [{ poolIds: ['00000000-0000-0000-0000-000000000000'] }, 404],
      [{ pifIds: [] }, 422],
      [{ encapsulation: 'ipip' }, 422],
    ]) {
      const { status, result } = await createPrivateNetwork({ ...body, ...params })
      assert.strictEqual(status, expectedStatus, `${JSON.stringify(params)}: ${JSON.stringify(result)}`)
    }
    assert.deepStrictEqual(await networksNamed(body.name), [])
  })

  it('should refuse a user who is not an admin', async () => {
    const user = await createTestUser(dispatchClient.xoClient)
    try {
      const client = new RestApiClient({
        xoUrl: getRequiredEnv('HOSTNAME'),
        username: user.email,
        password: user.password,
      })
      await client.connect()
      const body = bodyFor(pools.slice(0, 1))
      const { status, result } = await createPrivateNetwork(body, client)
      assert.strictEqual(status, 403, JSON.stringify(result))
      assert.deepStrictEqual(await networksNamed(body.name), [])
    } finally {
      await deleteTestUser(dispatchClient.xoClient, user.id)
    }
  })
})
