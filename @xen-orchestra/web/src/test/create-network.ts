import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { createPif } from '@/test/create-pif.ts'
import {
  SDN_CONTROLLER_ENCAPSULATION_KEY,
  SDN_CONTROLLER_ENCRYPTED_KEY,
  SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY,
  type TUNNEL_PROTOCOL,
} from '@vates/types'

/**
 * Builds a fully-populated `FrontXoNetwork` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createNetwork(overrides: Partial<FrontXoNetwork> = {}): FrontXoNetwork {
  return {
    id: 'network-123' as FrontXoNetwork['id'],
    name_label: 'Test network',
    name_description: 'A test network',
    defaultIsLocked: false,
    nbd: false,
    tags: [],
    $pool: 'pool-789' as FrontXoNetwork['$pool'],
    MTU: 1500,
    PIFs: [],
    other_config: {},
    type: 'network',
    isBonded: false,
    ...overrides,
  }
}

export const PRIVATE_NETWORK_UUID = 'private-network-1'

/**
 * Builds a private network: a `FrontXoNetwork` whose `other_config` names the private network `uuid` it belongs to,
 * beside the `other_config` of `overrides`.
 */
export function createPrivateNetwork(overrides: Partial<FrontXoNetwork> = {}, uuid = PRIVATE_NETWORK_UUID) {
  return createNetwork({
    ...overrides,
    other_config: { [SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]: uuid, ...overrides.other_config },
  })
}

/**
 * Builds an encrypted private network, on the `encapsulation` tunnel protocol when given, beside the `other_config` of
 * `overrides`.
 */
export function createEncryptedNetwork(encapsulation?: TUNNEL_PROTOCOL, overrides: Partial<FrontXoNetwork> = {}) {
  return createPrivateNetwork({
    ...overrides,
    other_config: {
      [SDN_CONTROLLER_ENCRYPTED_KEY]: 'true',
      ...(encapsulation !== undefined && { [SDN_CONTROLLER_ENCAPSULATION_KEY]: encapsulation }),
      ...overrides.other_config,
    },
  })
}

// One network of each kind, the ones with PIFs on the PIF of `createPif()`
export const PHYSICAL_NETWORK = createNetwork({ PIFs: [createPif().id] })

export const BONDED_NETWORK = createNetwork({ isBonded: true, PIFs: [createPif().id] })

export const INTERNAL_NETWORK = createNetwork({ PIFs: [] })

export const PRIVATE_NETWORK = createPrivateNetwork({ PIFs: [createPif().id] })

// Marked encrypted, but outside the SDN controller: no private network uuid names it
export const NON_PRIVATE_ENCRYPTED_NETWORK = createNetwork({ other_config: { [SDN_CONTROLLER_ENCRYPTED_KEY]: 'true' } })
