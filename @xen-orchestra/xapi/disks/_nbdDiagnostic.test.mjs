import { describe, it } from 'node:test'
import assert from 'node:assert'

import { describeNbdNetworks, formatNbdServers, noNbdAvailableError } from './_nbdDiagnostic.mjs'

// minimal stand-in for the xen-api event cache: `objects.all` is keyed by uuid and records are
// resolved from their opaque ref through getObjectByRef()
function makeXapi(records) {
  const byRef = Object.fromEntries(records.map(record => [record.$ref, record]))
  return {
    objects: { all: Object.fromEntries(records.map(record => [record.$ref, record])) },
    getObjectByRef: ref => byRef[ref],
  }
}

const host = (ref, name_label) => ({ $type: 'host', $ref: ref, name_label })
const pif = (ref, hostRef, IP, currently_attached = true) => ({
  $type: 'PIF',
  $ref: ref,
  host: hostRef,
  IP,
  currently_attached,
})
const network = (ref, name_label, purpose, PIFs) => ({ $type: 'network', $ref: ref, name_label, purpose, PIFs })

describe('formatNbdServers', () => {
  it('defaults the port to the NBD one', () => {
    assert.strictEqual(
      formatNbdServers([{ address: '10.0.0.1' }, { address: '10.0.0.2', port: 1234 }]),
      '10.0.0.1:10809, 10.0.0.2:1234'
    )
  })

  it('describes an empty list', () => {
    assert.strictEqual(formatNbdServers([]), 'none')
  })
})

describe('describeNbdNetworks', () => {
  it('reports the address of each host of a NBD enabled network', () => {
    const xapi = makeXapi([
      host('host1', 'srv-1'),
      pif('pif1', 'host1', '10.0.0.1'),
      network('net1', 'backup', ['nbd'], ['pif1']),
    ])

    assert.strictEqual(describeNbdNetworks(xapi), 'NBD enabled networks: "backup" (nbd): srv-1: 10.0.0.1')
  })

  it('reports a NBD enabled network on which a host has no IP', () => {
    const xapi = makeXapi([
      host('host1', 'srv-1'),
      pif('pif1', 'host1', ''),
      network('net1', 'proxy-only', ['nbd'], ['pif1']),
    ])

    assert.strictEqual(describeNbdNetworks(xapi), 'NBD enabled networks: "proxy-only" (nbd): srv-1 has no IP on it')
  })

  it('reports an unplugged PIF', () => {
    const xapi = makeXapi([
      host('host1', 'srv-1'),
      pif('pif1', 'host1', '10.0.0.1', false),
      network('net1', 'backup', ['insecure_nbd'], ['pif1']),
    ])

    assert.strictEqual(
      describeNbdNetworks(xapi),
      'NBD enabled networks: "backup" (insecure_nbd): srv-1: 10.0.0.1 (PIF not attached)'
    )
  })

  it('ignores the networks without a NBD purpose', () => {
    const xapi = makeXapi([
      host('host1', 'srv-1'),
      pif('pif1', 'host1', '10.0.0.1'),
      network('net1', 'management', [], ['pif1']),
      network('net2', 'legacy', undefined, ['pif1']),
    ])

    assert.strictEqual(describeNbdNetworks(xapi), 'no network of this pool has the NBD purpose enabled')
  })

  it('returns undefined when the cache is not available', () => {
    assert.strictEqual(describeNbdNetworks({}), undefined)
  })

  it('does not throw when the cache is malformed', () => {
    assert.strictEqual(describeNbdNetworks({ objects: { all: { broken: null } } }), undefined)
  })
})

describe('noNbdAvailableError', () => {
  const xapi = makeXapi([
    host('host1', 'srv-1'),
    pif('pif1', 'host1', ''),
    network('net1', 'proxy-only', ['nbd'], ['pif1']),
  ])

  it('appends the state of the NBD enabled networks to the reason', () => {
    const error = noNbdAvailableError('nothing reachable', { xapi, vdiRef: 'OpaqueRef:vdi' })

    assert.strictEqual(
      error.message,
      'nothing reachable. NBD enabled networks: "proxy-only" (nbd): srv-1 has no IP on it'
    )
    assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
    assert.strictEqual(error.vdiRef, 'OpaqueRef:vdi')
  })

  it('keeps the underlying error as cause', () => {
    const cause = new Error('operation timed out')

    assert.strictEqual(noNbdAvailableError('nothing reachable', { xapi, vdiRef: 'ref', cause }).cause, cause)
  })

  it('is usable without the cache', () => {
    assert.strictEqual(
      noNbdAvailableError('nothing advertised', { xapi: {}, vdiRef: 'ref' }).message,
      'nothing advertised'
    )
  })
})
