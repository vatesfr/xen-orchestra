import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { detectLocalAddress, getHostAddresses } from './_address.mjs'

describe('detectLocalAddress', () => {
  it('resolves the local address the OS would route through to reach the given host', async () => {
    // loopback always has a route, in any sandboxed/offline environment
    const address = await detectLocalAddress('127.0.0.1')
    assert.equal(address, '127.0.0.1')
  })

  it('does not require anything to be listening on the target port', async () => {
    // connecting a UDP socket never sends a packet, so an arbitrary, surely
    // unused port must not make this fail
    const address = await detectLocalAddress('127.0.0.1', 65535)
    assert.equal(address, '127.0.0.1')
  })
})

describe('getHostAddresses', () => {
  it('ignores the empty IPv6 addresses XAPI reports when IPv6 is disabled', async () => {
    const xapi = {
      async getRecord() {
        return {
          IP: '10.1.0.205',
          IPv6: [''],
        }
      },
      async getField() {
        return ['OpaqueRef:pif']
      },
    }
    const addresses = await getHostAddresses(xapi, 'OpaqueRef:host', '10.1.0.205')
    assert.deepEqual(addresses, ['10.1.0.205'])
  })
})
