import '../logSetup.js'
import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { randomBytes } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'

import { delay } from '../utils/index.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:vif-trunks')

// XAPI stores the VLANs as a set, in no particular order
const sortVlans = trunks => trunks?.toSorted((a, b) => a - b)

// a locally administered unicast MAC
const randomMac = () => ['02', ...Array.from(randomBytes(5), byte => byte.toString(16).padStart(2, '0'))].join(':')

describe('VIF VLAN filtering (trunks)', () => {
  let dispatchClient
  let tracker
  let restApiClient
  let vm
  let vifId
  let networkId
  let vlanNetworkId

  let skipReason

  const itTrunks = (name, fn) =>
    it(name, async t => {
      if (skipReason !== undefined) return t.skip(skipReason)
      return fn(t)
    })

  // XO sees a change once XAPI's event comes back, a moment after the call returns
  const assertTrunks = async (id, expected) => {
    let trunks
    for (let i = 0; i < 20; i++) {
      ;({ trunks } = await restApiClient.get(`/rest/v0/vifs/${id}`))
      if (isDeepStrictEqual(sortVlans(trunks), expected)) {
        return
      }
      await delay(500)
    }
    assert.deepStrictEqual(sortVlans(trunks), expected, `trunks of VIF ${id}`)
  }

  // the VIFs created on the test VM go with it at teardown. Unplugged: hot-plugging into the running
  // test VM needs PV drivers in its guest (VM_MISSING_PV_DRIVERS), and XAPI keeps trunks either way
  const createVif = async body =>
    (await restApiClient.post('/rest/v0/vifs', { vmId: vm.uuid, currently_attached: false, ...body })).id

  before(async () => {
    let vms
    ;({ dispatchClient, tracker, vms } = await setup())
    restApiClient = dispatchClient.restApiClient
    vm = vms[0]

    const { $pool, VIFs } = await restApiClient.get(`/rest/v0/vms/${vm.uuid}`)
    if (!(VIFs?.length > 0)) {
      skipReason = `REFERENCE_VM_ID has no VIF`
      return
    }

    vifId = VIFs[0]
    const vif = await restApiClient.get(`/rest/v0/vifs/${vifId}`)
    networkId = vif.$network
    if (vif.trunks === undefined) {
      skipReason = `the pool of REFERENCE_VM_ID has no VLAN filtering (xapi < 26.1.16)`
      return
    }

    const pifs = await restApiClient.getObjects('/rest/v0/pifs', { fields: ['vlan', '$network', '$pool'] })
    if (pifs.some(pif => pif.$network === networkId && pif.vlan !== -1)) {
      skipReason = `the first VIF of REFERENCE_VM_ID is on a VLAN network, where XAPI refuses trunks`
      return
    }
    vlanNetworkId = pifs.find(pif => pif.$pool === $pool && pif.vlan !== -1)?.$network

    log.debug('Test IDs', { vifId, networkId, vlanNetworkId })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })

  itTrunks('PATCH sets the VLANs a VIF is restricted to', async () => {
    await restApiClient.patch(`/rest/v0/vifs/${vifId}`, { trunks: [20, 10] })

    await assertTrunks(vifId, [10, 20])
  })

  itTrunks('PUT and DELETE add and remove one VLAN, removing the last one lets every VLAN through', async () => {
    await restApiClient.patch(`/rest/v0/vifs/${vifId}`, { trunks: [10, 20] })
    await restApiClient.put(`/rest/v0/vifs/${vifId}/trunks/30`)
    await restApiClient.delete(`/rest/v0/vifs/${vifId}/trunks/10`)
    await assertTrunks(vifId, [20, 30])

    await restApiClient.delete(`/rest/v0/vifs/${vifId}/trunks/20`)
    await restApiClient.delete(`/rest/v0/vifs/${vifId}/trunks/30`)
    await assertTrunks(vifId, [])
  })

  itTrunks('refuses a VLAN outside 0-4094', async () => {
    await assert.rejects(restApiClient.put(`/rest/v0/vifs/${vifId}/trunks/4095`), /HTTP 422/)
  })

  itTrunks('POST creates a VIF restricted to VLANs', async () => {
    const id = await createVif({ networkId, trunks: [10] })

    await assertTrunks(id, [10])
  })

  itTrunks('refuses trunks on a network with a VLAN', async t => {
    if (vlanNetworkId === undefined) {
      return t.skip(`the pool of REFERENCE_VM_ID has no VLAN network`)
    }

    await assert.rejects(createVif({ networkId: vlanNetworkId, trunks: [10] }), /HTTP 422/)

    const id = await createVif({ networkId: vlanNetworkId })
    await assert.rejects(restApiClient.patch(`/rest/v0/vifs/${id}`, { trunks: [10] }), /HTTP 422/)
    await assert.rejects(restApiClient.put(`/rest/v0/vifs/${id}/trunks/10`), /HTTP 422/)

    // clearing is always allowed
    await restApiClient.patch(`/rest/v0/vifs/${id}`, { trunks: [] })
  })

  itTrunks('XO 5 keeps the VLANs when a MAC change recreates the VIF', async () => {
    const id = await createVif({ networkId, trunks: [10, 20] })
    // vif.set copies the VLANs XO knows of
    await assertTrunks(id, [10, 20])

    const newId = await dispatchClient.xoClient.call('vif.set', { id, mac: randomMac() })

    assert.notStrictEqual(newId, id, 'a MAC change recreates the VIF')
    await assertTrunks(newId, [10, 20])
  })
})
