import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  collectNbdSetup,
  describeNbdSetup,
  formatNbdServers,
  formatNbdSetup,
  noNbdAvailableError,
  probeNbdAddress,
} from './_nbdDiagnostic.mjs'

// minimal stand-in for the xen-api event cache: `objects.all` is keyed by uuid and records are
// resolved from their opaque ref through getObjectByRef()
function makeXapi(records, { backupNetwork } = {}) {
  const byRef = Object.fromEntries(records.map(record => [record.$ref, record]))
  return {
    _pool: { other_config: backupNetwork === undefined ? {} : { 'xo:backupNetwork': backupNetwork } },
    objects: { all: Object.fromEntries(records.map(record => [record.uuid ?? record.$ref, record])) },
    getObjectByRef: ref => byRef[ref],
  }
}

const host = (ref, name_label) => ({ $type: 'host', $ref: ref, uuid: ref, name_label })
const pif = (ref, hostRef, IP, currently_attached = true) => ({
  $type: 'PIF',
  $ref: ref,
  uuid: ref,
  host: hostRef,
  IP,
  currently_attached,
})
const network = (ref, name_label, purpose, PIFs) => ({
  $type: 'network',
  $ref: ref,
  uuid: `${ref}-uuid`,
  name_label,
  purpose,
  PIFs,
})

// the reported setup: the hosts are only addressable on "Management", while the network the proxy
// sits on carries the NBD purpose without any host IP
const SPLIT_POOL = [
  host('h1', 'salem-1'),
  pif('mgmt', 'h1', '192.168.1.10'),
  pif('isolated', 'h1', ''),
  network('mgmtNet', 'Management', ['nbd'], ['mgmt']),
  network('isolatedNet', 'Proxy net', ['nbd'], ['isolated']),
]

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

describe('collectNbdSetup', () => {
  it('keeps every NBD enabled network when the pool has no backup network', () => {
    const setup = collectNbdSetup(makeXapi(SPLIT_POOL))

    assert.strictEqual(setup.backupNetwork, undefined)
    assert.deepStrictEqual(
      setup.networks.map(({ name }) => name),
      ['Management', 'Proxy net']
    )
  })

  it('ignores the networks without a NBD purpose', () => {
    const setup = collectNbdSetup(
      makeXapi([host('h1', 'salem-1'), pif('p1', 'h1', '10.0.0.1'), network('n1', 'Management', [], ['p1'])])
    )

    assert.deepStrictEqual(setup.networks, [])
  })

  it('reports a host with no IP on the network', () => {
    const setup = collectNbdSetup(makeXapi(SPLIT_POOL))

    assert.deepStrictEqual(setup.networks[1].hosts, [{ address: undefined, attached: true, host: 'salem-1' }])
  })

  // a pool backup network restricts every transfer to that network, so the other NBD enabled
  // networks can never be used and must not be reported
  it('keeps only the pool backup network when one is set', () => {
    const setup = collectNbdSetup(makeXapi(SPLIT_POOL, { backupNetwork: 'mgmtNet-uuid' }))

    assert.deepStrictEqual(setup.backupNetwork, { found: true, uuid: 'mgmtNet-uuid' })
    assert.deepStrictEqual(
      setup.networks.map(({ name }) => name),
      ['Management']
    )
  })

  it('keeps the pool backup network even without the NBD purpose', () => {
    const setup = collectNbdSetup(
      makeXapi([host('h1', 'salem-1'), pif('p1', 'h1', '10.0.0.1'), network('n1', 'Backup', [], ['p1'])], {
        backupNetwork: 'n1-uuid',
      })
    )

    assert.deepStrictEqual(
      setup.networks.map(({ purposes }) => purposes),
      [[]]
    )
  })

  it('reports a pool backup network missing from the pool', () => {
    const setup = collectNbdSetup(makeXapi(SPLIT_POOL, { backupNetwork: 'gone-uuid' }))

    assert.deepStrictEqual(setup.backupNetwork, { found: false, uuid: 'gone-uuid' })
    assert.deepStrictEqual(setup.networks, [])
  })

  it('returns undefined when the cache is not available', () => {
    assert.strictEqual(collectNbdSetup({}), undefined)
  })
})

describe('formatNbdSetup', () => {
  const verdicts = new Map([['192.168.1.10', 'unreachable (ETIMEDOUT)']])

  it('reports each network, address and reachability verdict', () => {
    assert.strictEqual(
      formatNbdSetup(collectNbdSetup(makeXapi(SPLIT_POOL)), verdicts),
      'NBD enabled networks: "Management" (nbd): salem-1: 192.168.1.10 unreachable (ETIMEDOUT) ; ' +
        '"Proxy net" (nbd): salem-1 has no IP on it'
    )
  })

  it('marks an address whose verdict is missing as not probed', () => {
    assert.match(formatNbdSetup(collectNbdSetup(makeXapi(SPLIT_POOL))), /192\.168\.1\.10 not probed/)
  })

  it('reports an unplugged PIF', () => {
    const setup = collectNbdSetup(
      makeXapi([
        host('h1', 'salem-1'),
        pif('p1', 'h1', '10.0.0.1', false),
        network('n1', 'backup', ['insecure_nbd'], ['p1']),
      ])
    )

    assert.strictEqual(
      formatNbdSetup(setup, new Map([['10.0.0.1', 'reachable']])),
      'NBD enabled networks: "backup" (insecure_nbd): salem-1: 10.0.0.1 (PIF not attached) reachable'
    )
  })

  it('states that no network has the NBD purpose', () => {
    assert.strictEqual(formatNbdSetup({ networks: [] }), 'no network of this pool has the NBD purpose enabled')
  })

  it('states that the pool backup network is the only usable one', () => {
    assert.strictEqual(
      formatNbdSetup(collectNbdSetup(makeXapi(SPLIT_POOL, { backupNetwork: 'mgmtNet-uuid' })), verdicts),
      'the pool backup network is the only one that can be used for NBD: "Management" (nbd): ' +
        'salem-1: 192.168.1.10 unreachable (ETIMEDOUT)'
    )
  })

  it('states when the pool backup network has no NBD purpose', () => {
    const setup = collectNbdSetup(
      makeXapi([host('h1', 'salem-1'), pif('p1', 'h1', '10.0.0.1'), network('n1', 'Backup', [], ['p1'])], {
        backupNetwork: 'n1-uuid',
      })
    )

    assert.strictEqual(
      formatNbdSetup(setup),
      'the pool backup network is the only one that can be used for NBD, and "Backup" does not have the NBD purpose enabled'
    )
  })

  it('states when the pool backup network is missing from the pool', () => {
    assert.strictEqual(
      formatNbdSetup(collectNbdSetup(makeXapi(SPLIT_POOL, { backupNetwork: 'gone-uuid' }))),
      'the pool backup network is the only one that can be used for NBD, and gone-uuid was not found in this pool'
    )
  })

  it('reports a network without PIF', () => {
    const setup = collectNbdSetup(makeXapi([network('n1', 'orphan', ['nbd'], [])]))

    assert.strictEqual(formatNbdSetup(setup), 'NBD enabled networks: "orphan" (nbd): no PIF')
  })
})

// loopback only: nothing listens on this port, so connect() is refused immediately
const UNUSED_LOOPBACK_PORT = 1
describe('probeNbdAddress', () => {
  it('reports an unreachable address with its error code', async () => {
    assert.match(await probeNbdAddress('127.0.0.1', UNUSED_LOOPBACK_PORT), /^unreachable \(E[A-Z]+\)$/)
  })
})

describe('describeNbdSetup', () => {
  it('probes every address of the eligible networks', async () => {
    const description = await describeNbdSetup(makeXapi(SPLIT_POOL), { port: UNUSED_LOOPBACK_PORT, timeout: 500 })

    // 192.168.1.10 is not routable from the test runner: accept either verdict, what matters is
    // that a verdict was produced for it and that the IP-less host is still reported
    assert.match(description, /"Management" \(nbd\): salem-1: 192\.168\.1\.10 (unreachable \(|reachable)/)
    assert.match(description, /"Proxy net" \(nbd\): salem-1 has no IP on it/)
  })

  it('returns undefined when the cache is not available', async () => {
    assert.strictEqual(await describeNbdSetup({}), undefined)
  })

  it('does not throw when the cache is malformed', async () => {
    assert.strictEqual(await describeNbdSetup({ objects: { all: { broken: null } } }), undefined)
  })
})

describe('noNbdAvailableError', () => {
  it('appends the state of the NBD setup to the reason', async () => {
    const error = await noNbdAvailableError('nothing reachable', {
      xapi: makeXapi([host('h1', 'salem-1'), pif('p1', 'h1', ''), network('n1', 'Proxy net', ['nbd'], ['p1'])]),
      vdiRef: 'OpaqueRef:vdi',
    })

    assert.strictEqual(
      error.message,
      'nothing reachable. NBD enabled networks: "Proxy net" (nbd): salem-1 has no IP on it'
    )
    assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
    assert.strictEqual(error.vdiRef, 'OpaqueRef:vdi')
  })

  it('keeps the underlying error as cause', async () => {
    const cause = new Error('operation timed out')
    const error = await noNbdAvailableError('nothing reachable', { xapi: {}, vdiRef: 'ref', cause })

    assert.strictEqual(error.cause, cause)
  })

  it('is usable without the cache', async () => {
    const error = await noNbdAvailableError('nothing advertised', { xapi: {}, vdiRef: 'ref' })

    assert.strictEqual(error.message, 'nothing advertised')
  })
})
