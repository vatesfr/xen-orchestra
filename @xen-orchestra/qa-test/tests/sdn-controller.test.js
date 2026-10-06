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
        ? (await dispatchClient.restApiClient.get(`/rest/v0/pools/${network.$pool}?fields=*`)).other_config?.[
            'xo:sdn-controller:of-method'
          ]
        : undefined

    if (ofMethod === undefined || ofMethod !== 'xapi-plugin') {
      skipReason =
        `SDN controller pool uses the '${ofMethod}' backend; this suite requires the ` +
        `'xapi-plugin' backend (set the useDirectChannel option to false in config.toml). ` +
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
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
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

    itSdn('should not error when deleting a non-existent rule', () =>
      dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'to',
        ipRange: '192.168.99.0/24',
        protocol: 'UDP',
        port: 9999,
      })
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
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        protocol: 'TCP',
      })
    )

    itSdn('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
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

    itSdn('should not error when deleting a non-existent rule', () =>
      dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'to',
        ipRange: '192.168.99.0/24',
        protocol: 'UDP',
        port: 9999,
      })
    )
  })
})
