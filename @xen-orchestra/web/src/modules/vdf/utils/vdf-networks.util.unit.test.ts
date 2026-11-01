import {
  interfaceAddresses,
  isNetworkTag,
  isOnNetworks,
  networkTagFor,
  networkTagLabel,
} from '@/modules/vdf/utils/vdf-networks.util.ts'
import { describe, expect, it } from 'vitest'

describe('network tags', () => {
  it('proposes a tag from the network name', () => {
    expect(networkTagFor('DMZ VLAN 20')).toBe('vdf:net=dmz-vlan-20')
    expect(networkTagFor('  Réseau privé ')).toBe('vdf:net=reseau-prive')
    expect(networkTagFor('***')).toBe('vdf:net=network')
    expect(isNetworkTag(networkTagFor('Pool-wide network associated with eth2'))).toBe(true)
    expect(isNetworkTag('vdf:net=')).toBe(false)
    expect(networkTagLabel('vdf:net=dmz')).toBe('dmz')
  })

  it('matches a network carrying all the tags, any without', () => {
    expect(isOnNetworks(['vdf:net=dmz', 'other'], ['vdf:net=dmz'])).toBe(true)
    expect(isOnNetworks(['vdf:net=backend'], ['vdf:net=dmz'])).toBe(false)
    expect(isOnNetworks([], [])).toBe(true)
  })
})

describe('interfaceAddresses', () => {
  const guest = { '0/ipv4/0': '10.0.20.99', '1/ipv4/0': '10.0.30.5', '1/ipv6/0': 'fe80::1', '1/ipv6/1': 'fd00::5' }

  it("takes a locked VIF's allowed addresses, else the guest's for its device", () => {
    expect(
      interfaceAddresses({ device: '0', lockingMode: 'locked', allowedIpv4Addresses: ['10.0.20.5'] }, guest)
    ).toEqual(['10.0.20.5'])
    expect(interfaceAddresses({ device: '1', lockingMode: 'network_default' }, guest)).toEqual(['10.0.30.5', 'fd00::5'])
    expect(interfaceAddresses({ device: '2', lockingMode: 'unlocked' }, guest)).toEqual([])
  })
})
