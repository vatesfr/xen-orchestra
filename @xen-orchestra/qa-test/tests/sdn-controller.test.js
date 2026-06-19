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

  before(async () => {
    const sdnVmId = process.env.SDN_CONTROLLER_VM_ID

    ;({ dispatchClient, tracker, vm } = await setup({ referenceVmId: sdnVmId }))

    const vmDetails = await dispatchClient.restApiClient.get(`/rest/v0/vms/${vm.uuid}`)
    assert(vmDetails.VIFs?.length > 0, 'Test VM must have at least one VIF')

    vifId = vmDetails.VIFs[0]
    const vif = await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}`)
    networkId = vif.$network ?? vif.network
    assert(networkId !== undefined, 'VIF must have an associated network')

    log.debug('Test IDs derived from VM', { vifId, networkId })
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

    it('should reject add when allow is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when allow is a string instead of boolean', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: 'true',
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      }))

    it('should reject add when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      }))

    it('should reject delete when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        protocol: 'TCP',
      }))

    it('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
      }))
  })

  // ---------------------------------------------------------------------------

  describe('Network rules – CRUD', () => {
    const getNetworkRules = async () => {
      const network = await dispatchClient.restApiClient.get(`/rest/v0/networks/${networkId}?fields=*`)
      const raw = network.other_config?.['xo:sdn-controller:of-rules']
      return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
    }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    it('should add a TCP allow rule to the network', async () => {
      await dispatchClient.restApiClient.post(
        `${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`,
        VALID_RULE
      )
      const rules = await getNetworkRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert(found !== undefined, 'Rule should be present after add')
      assert.strictEqual(found.allow, true)
    })

    it('should overwrite the rule when added again with allow=false (no duplication, cookie preserved)', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/add_traffic_rule?sync=true`, {
        ...VALID_RULE,
        allow: false,
      })
      const rules = await getNetworkRules()
      const matching = rules.filter(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert.strictEqual(matching.length, 1, 'Rule must not be duplicated')
      assert.strictEqual(matching[0].allow, false, 'Rule allow field must be updated')
    })

    it('should delete the rule', async () => {
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

    it('should not error when deleting a non-existent rule', () =>
      dispatchClient.restApiClient.post(`${BASE}/networks/${networkId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'to',
        ipRange: '192.168.99.0/24',
        protocol: 'UDP',
        port: 9999,
      }))
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

    it('should reject add when allow is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when allow is a string instead of boolean', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: 'false',
        direction: 'from',
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject add when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        protocol: 'TCP',
      }))

    it('should reject add when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, {
        allow: true,
        direction: 'from',
        ipRange: '10.0.0.0/8',
      }))

    it('should reject delete when direction is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        ipRange: '10.0.0.0/8',
        protocol: 'TCP',
      }))

    it('should reject delete when ipRange is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        protocol: 'TCP',
      }))

    it('should reject delete when protocol is missing', () =>
      rejectsWithHttpError(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'from',
        ipRange: '10.0.0.0/8',
      }))
  })

  // ---------------------------------------------------------------------------

  describe('VIF rules – CRUD', () => {
    const getVifRules = async () => {
      const vif = await dispatchClient.restApiClient.get(`/rest/v0/vifs/${vifId}?fields=*`)
      const raw = vif.other_config?.['xo:sdn-controller:of-rules']
      return raw !== undefined ? JSON.parse(raw).map(JSON.parse) : []
    }

    const ruleKey = r => `${r.direction}:${r.ipRange}:${r.protocol}:${r.port}`

    it('should add a TCP allow rule to the VIF', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE)
      const rules = await getVifRules()
      const found = rules.find(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert(found !== undefined, 'Rule should be present after add')
      assert.strictEqual(found.allow, true)
    })

    it('should not duplicate the rule when added again', async () => {
      await dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/add_traffic_rule?sync=true`, VALID_RULE)
      const rules = await getVifRules()
      const matching = rules.filter(r => ruleKey(r) === ruleKey(VALID_RULE))
      assert.strictEqual(matching.length, 1, 'Rule must not be duplicated')
    })

    it('should delete the rule', async () => {
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

    it('should not error when deleting a non-existent rule', () =>
      dispatchClient.restApiClient.post(`${BASE}/vifs/${vifId}/actions/delete_traffic_rule?sync=true`, {
        direction: 'to',
        ipRange: '192.168.99.0/24',
        protocol: 'UDP',
        port: 9999,
      }))
  })
})
