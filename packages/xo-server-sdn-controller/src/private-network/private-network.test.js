import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { PrivateNetwork } from './private-network.js'

describe('PrivateNetwork.addHost', () => {
  const transportPif = { network: 'network-ref-1', IP: '10.0.0.1' }

  function makePrivateNetwork(hostResult, centerResult) {
    const controller = {
      privateNetworks: {},
      registerPrivateNetwork: privateNetwork => {
        controller.privateNetworks[privateNetwork.uuid] = privateNetwork
      },
      ovsdbClients: {
        'host-ref-1': { addInterfaceAndPort: async () => hostResult },
        'host-ref-center': { addInterfaceAndPort: async () => centerResult },
      },
    }
    const network = {
      $ref: 'network-ref-1',
      $xapi: { getRecord: async () => network },
      other_config: {},
    }
    const pif = { network: 'network-ref-1' }
    const host = {
      $ref: 'host-ref-1',
      name_label: 'host-1',
      $PIFs: [pif],
      $pool: { uuid: 'pool-uuid-1', name_label: 'pool' },
    }
    const center = {
      $ref: 'host-ref-center',
      name_label: 'center',
      $PIFs: [pif],
      $pool: { uuid: 'pool-uuid-1', name_label: 'pool' },
    }
    const privateNetwork = new PrivateNetwork(controller, 'private-network-uuid')
    privateNetwork.center = center
    privateNetwork.networks = { 'pool-uuid-1': network }
    // always report the transport PIF, so getTransportPif does not need the XAPI
    privateNetwork.getTransportPif = async () => transportPif
    return { privateNetwork, host, center }
  }

  it('returns the bridge name when the port already exists on both sides', async () => {
    const { privateNetwork, host } = makePrivateNetwork(
      { name: 'xapi1', added: false },
      { name: 'xapi2', added: false }
    )
    assert.equal(await privateNetwork.addHost(host), 'xapi1')
  })

  it('returns the bridge name when only the host side was (re)wired', async () => {
    const { privateNetwork, host } = makePrivateNetwork(
      { name: 'xapi1', added: true },
      { name: 'xapi2', added: false }
    )
    assert.equal(await privateNetwork.addHost(host), 'xapi1')
  })

  it('returns the bridge name when only the center side was (re)wired', async () => {
    const { privateNetwork, host } = makePrivateNetwork(
      { name: 'xapi1', added: false },
      { name: 'xapi2', added: true }
    )
    assert.equal(await privateNetwork.addHost(host), 'xapi1')
  })

  it('returns nothing when the host side could not be connected', async () => {
    const { privateNetwork, host } = makePrivateNetwork(undefined, { name: 'xapi2', added: true })
    assert.equal(await privateNetwork.addHost(host), undefined)
  })

  it('does nothing for the star-center host itself', async () => {
    const { privateNetwork, center } = makePrivateNetwork(undefined, undefined)
    assert.equal(await privateNetwork.addHost(center), undefined)
  })
})
