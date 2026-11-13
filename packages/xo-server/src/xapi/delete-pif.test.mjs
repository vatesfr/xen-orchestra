import assert from 'node:assert/strict'
import test from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import Xapi from './index.mjs'

const { describe, it } = test

// the @mixin decorator hides the class prototype: it is only reachable from an instance
const { deletePif } = Object.getPrototypeOf(
  new Xapi({
    auth: { user: 'user', password: 'password' },
    restartHostTimeout: '1 minute',
    url: 'https://localhost',
    vmShutdownTimeout: '1 minute',
  })
)

function createFakeXapi(pif) {
  const calls = []
  const record = async (...args) => {
    calls.push(args)
  }
  const xapi = {
    getObject: () => ({
      $ref: 'OpaqueRef:pif',
      management: false,
      VLAN_master_of: 'OpaqueRef:NULL',
      bond_master_of: [],
      tunnel_access_PIF_of: [],
      ...pif,
    }),
    call: record,
    callAsync: record,
  }
  return { calls, deletePif: () => deletePif.call(xapi, 'pif-id') }
}

describe('Xapi#deletePif', () => {
  it('forgets a physical PIF', async () => {
    const { calls, deletePif } = createFakeXapi()
    await deletePif()
    assert.deepEqual(calls, [['PIF.forget', 'OpaqueRef:pif']])
  })

  it('refuses to delete the management interface', async () => {
    const { calls, deletePif } = createFakeXapi({ management: true })
    await assert.rejects(deletePif(), error => forbiddenOperation.is(error))
    assert.deepEqual(calls, [])
  })

  it('destroys the VLAN of a VLAN PIF', async () => {
    const { calls, deletePif } = createFakeXapi({ VLAN_master_of: 'OpaqueRef:vlan' })
    await deletePif()
    assert.deepEqual(calls, [['VLAN.destroy', 'OpaqueRef:vlan']])
  })

  it('destroys the bond of a bond PIF', async () => {
    const { calls, deletePif } = createFakeXapi({ bond_master_of: ['OpaqueRef:bond'] })
    await deletePif()
    assert.deepEqual(calls, [['Bond.destroy', 'OpaqueRef:bond']])
  })

  it('unplugs the PIF and destroys the tunnel of a tunnel PIF', async () => {
    const { calls, deletePif } = createFakeXapi({ tunnel_access_PIF_of: ['OpaqueRef:tunnel'] })
    await deletePif()
    assert.deepEqual(calls, [
      ['PIF.unplug', 'OpaqueRef:pif'],
      ['tunnel.destroy', 'OpaqueRef:tunnel'],
    ])
  })
})
