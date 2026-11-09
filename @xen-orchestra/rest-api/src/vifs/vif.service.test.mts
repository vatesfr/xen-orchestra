import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { VifService } from './vif.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { XoNetwork, XoVif } from '@vates/types'

const VIF_ID = 'f07ab729-c0e8-721c-45ec-f11276377030' as XoVif['id']
const NEW_VIF_ID = '0d3d4a8f-9c1b-4c55-8d0e-5d6a3c1b2e4f'
const ORIGINAL_MAC = 'aa:bb:cc:dd:ee:ff'
const NEW_MAC = '02:22:33:44:55:66'
const IPV4_ADDRESSES = ['192.168.0.42']
const IPV6_ADDRESSES = ['fe80::42']
const NEW_IP_ADDRESSES = ['10.1.0.9']
const NETWORK = { id: 'network-b', _xapiRef: 'OpaqueRef:network-b' } as XoNetwork

const XAPI_VIF = {
  currently_attached: true,
  device: '1',
  ipv4_allowed: IPV4_ADDRESSES,
  ipv6_allowed: IPV6_ADDRESSES,
  locking_mode: 'locked',
  MAC: ORIGINAL_MAC,
  MTU: 9000,
  network: 'OpaqueRef:network',
  other_config: { 'ethtool-tx': 'false', 'xo:sdn-controller:of-rules': '[]' },
  qos_algorithm_params: { kbps: '1000' },
  qos_algorithm_type: 'ratelimit',
  VM: 'OpaqueRef:vm',
}

const EXPECTED_SETTINGS = {
  currently_attached: true,
  device: '1',
  ipv4_allowed: IPV4_ADDRESSES,
  ipv6_allowed: IPV6_ADDRESSES,
  locking_mode: 'locked',
  MTU: 9000,
  network: 'OpaqueRef:network',
  other_config: { 'ethtool-tx': 'false', 'xo:sdn-controller:of-rules': '[]' },
  qos_algorithm_params: { kbps: '1000' },
  qos_algorithm_type: 'ratelimit',
  VM: 'OpaqueRef:vm',
}

/**
 * - `failingMove`: whether `VIF.move` fails
 * - `failingDeletion`: whether `deleteVif` fails
 * - `failingMacs`: MAC addresses for which `VIF_create` fails
 * - `failingAllocation`: whether `allocIpAddresses` fails when allocating IP addresses to the recreated VIF
 */
function createRestApi({
  failingMove = false,
  failingDeletion = false,
  failingMacs = [],
  failingAllocation = false,
}: { failingMove?: boolean; failingDeletion?: boolean; failingMacs?: string[]; failingAllocation?: boolean } = {}) {
  const calls: unknown[][] = []

  const xapi = {
    callAsync: async (...args: unknown[]) => {
      calls.push(args)
      if (failingMove) {
        throw new Error('VIF.move failed')
      }
    },
    deleteVif: async (id: string) => {
      calls.push(['deleteVif', id])
      if (failingDeletion) {
        throw new Error('deleteVif failed')
      }
    },
    VIF_create: async (settings: unknown, { MAC }: { MAC: string }) => {
      calls.push(['VIF_create', settings, MAC])
      if (failingMacs.includes(MAC)) {
        throw new Error(`VIF_create failed for ${MAC}`)
      }
      return `OpaqueRef:vif-${MAC}`
    },
    barrier: async (ref: string) => ({ uuid: ref === `OpaqueRef:vif-${NEW_MAC}` ? NEW_VIF_ID : 'restored-vif-id' }),
  }

  const restApi = {
    getObject: () => ({
      _xapiRef: 'OpaqueRef:vif',
      MAC: ORIGINAL_MAC,
      allowedIpv4Addresses: IPV4_ADDRESSES,
      allowedIpv6Addresses: IPV6_ADDRESSES,
    }),
    getXapiObject: () => XAPI_VIF,
    xoApp: {
      getXapi: () => xapi,
      allocIpAddresses: async (...args: unknown[]) => {
        calls.push(['allocIpAddresses', ...args])
        if (failingAllocation && args[0] === NEW_VIF_ID) {
          throw new Error('allocIpAddresses failed')
        }
      },
    },
  } as unknown as RestApi

  return { calls, service: new VifService(restApi) }
}

describe('VifService.moveToNetwork', () => {
  it('moves the VIF and moves its IP addresses to the IP pools of the new network', async () => {
    const { calls, service } = createRestApi()

    await service.moveToNetwork(VIF_ID, NETWORK, NEW_IP_ADDRESSES)
    assert.deepEqual(calls, [
      ['allocIpAddresses', VIF_ID, undefined, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
      ['VIF.move', 'OpaqueRef:vif', 'OpaqueRef:network-b'],
      ['allocIpAddresses', VIF_ID, NEW_IP_ADDRESSES],
    ])
  })

  it('gives the IP addresses back to the VIF when the move fails', async () => {
    const { calls, service } = createRestApi({ failingMove: true })

    await assert.rejects(service.moveToNetwork(VIF_ID, NETWORK, NEW_IP_ADDRESSES), { message: 'VIF.move failed' })
    assert.deepEqual(calls, [
      ['allocIpAddresses', VIF_ID, undefined, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
      ['VIF.move', 'OpaqueRef:vif', 'OpaqueRef:network-b'],
      ['allocIpAddresses', VIF_ID, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
    ])
  })
})

describe('VifService.changeMac', () => {
  it('refuses a multicast MAC address without any side effect', async () => {
    const { calls, service } = createRestApi()

    await assert.rejects(service.changeMac(VIF_ID, '01:00:5e:00:00:01'), /invalid unicast MAC address/)
    assert.deepEqual(calls, [])
  })

  it('does nothing when the MAC address is unchanged, whatever its case', async () => {
    const { calls, service } = createRestApi()

    assert.equal(await service.changeMac(VIF_ID, ORIGINAL_MAC.toUpperCase()), VIF_ID)
    assert.deepEqual(calls, [])
  })

  it('recreates the VIF with the new MAC address and the same settings, and moves its IP addresses', async () => {
    const { calls, service } = createRestApi()

    assert.equal(await service.changeMac(VIF_ID, NEW_MAC), NEW_VIF_ID)
    assert.deepEqual(calls, [
      ['allocIpAddresses', VIF_ID, undefined, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
      ['deleteVif', VIF_ID],
      ['VIF_create', EXPECTED_SETTINGS, NEW_MAC],
      ['allocIpAddresses', NEW_VIF_ID, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
    ])
  })

  it('gives the IP addresses back to the VIF when its deletion fails', async () => {
    const { calls, service } = createRestApi({ failingDeletion: true })

    await assert.rejects(service.changeMac(VIF_ID, NEW_MAC), { message: 'deleteVif failed' })
    assert.deepEqual(calls, [
      ['allocIpAddresses', VIF_ID, undefined, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
      ['deleteVif', VIF_ID],
      ['allocIpAddresses', VIF_ID, [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
    ])
  })

  it('restores the VIF with its original MAC address when the recreation fails', async () => {
    const { calls, service } = createRestApi({ failingMacs: [NEW_MAC] })

    await assert.rejects(service.changeMac(VIF_ID, NEW_MAC), { message: `VIF_create failed for ${NEW_MAC}` })
    assert.deepEqual(calls.slice(2), [
      ['VIF_create', EXPECTED_SETTINGS, NEW_MAC],
      ['VIF_create', EXPECTED_SETTINGS, ORIGINAL_MAC],
      ['allocIpAddresses', 'restored-vif-id', [...IPV4_ADDRESSES, ...IPV6_ADDRESSES]],
    ])
  })

  it('does not restore the VIF when it has been recreated but its IP addresses cannot be allocated', async () => {
    const { calls, service } = createRestApi({ failingAllocation: true })

    await assert.rejects(service.changeMac(VIF_ID, NEW_MAC), { message: 'allocIpAddresses failed' })
    assert.equal(calls.filter(([name]) => name === 'VIF_create').length, 1)
  })

  it('rethrows the original error when the VIF cannot be restored either', async () => {
    const { service } = createRestApi({ failingMacs: [NEW_MAC, ORIGINAL_MAC] })

    await assert.rejects(service.changeMac(VIF_ID, NEW_MAC), { message: `VIF_create failed for ${NEW_MAC}` })
  })
})
