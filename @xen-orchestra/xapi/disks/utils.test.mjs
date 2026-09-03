import { describe, it, mock } from 'node:test'
import assert from 'node:assert'

// connectNbdClientIfPossible instantiates MultiNbdClient itself, replace the module to script
// what connecting to the advertised servers does
let connectError
class FakeMultiNbdClient {
  constructor(nbdInfos) {
    this.nbdInfos = nbdInfos
  }

  async connect() {
    if (connectError !== undefined) {
      throw connectError
    }
  }
}

mock.module('@vates/nbd-client/multi.mjs', {
  defaultExport: FakeMultiNbdClient,
})

const { connectNbdClientIfPossible } = await import('./utils.mjs')

// a pool with two NBD enabled networks: the hosts are only addressable on one of them, which is
// the setup that makes XAPI advertise addresses unreachable from a XO/proxy attached to the other
const POOL_RECORDS = [
  { $type: 'host', $ref: 'host1', name_label: 'srv-1' },
  { $type: 'PIF', $ref: 'mgmtPif', host: 'host1', IP: '192.168.1.10', currently_attached: true },
  { $type: 'PIF', $ref: 'isolatedPif', host: 'host1', IP: '', currently_attached: true },
  { $type: 'network', $ref: 'mgmtNet', name_label: 'Management', purpose: ['nbd'], PIFs: ['mgmtPif'] },
  { $type: 'network', $ref: 'isolatedNet', name_label: 'Proxy net', purpose: ['nbd'], PIFs: ['isolatedPif'] },
]

const NBD_NETWORKS_DESCRIPTION =
  'NBD enabled networks: "Management" (nbd): srv-1: 192.168.1.10 ; "Proxy net" (nbd): srv-1 has no IP on it'

function makeXapi({ advertised, backupNetwork, backupNetworkIps = [] }) {
  const byRef = Object.fromEntries(POOL_RECORDS.map(record => [record.$ref, record]))
  return {
    _pool: { other_config: backupNetwork === undefined ? {} : { 'xo:backupNetwork': backupNetwork } },
    objects: { all: byRef },
    getObjectByRef: ref => byRef[ref],
    call: async (method, ref) => {
      if (method === 'VDI.get_nbd_info') {
        assert.strictEqual(ref, 'OpaqueRef:vdi')
        return advertised
      }
      if (method === 'network.get_by_uuid') {
        assert.strictEqual(ref, backupNetwork)
        return 'backupNet'
      }
      throw new Error(`unexpected call to ${method}`)
    },
    getField: async (type, ref, field) => {
      if (type === 'network' && field === 'PIFs') {
        return backupNetworkIps.map((_, i) => `backupPif${i}`)
      }
      if (type === 'PIF' && field === 'IP') {
        return backupNetworkIps[Number(ref.slice('backupPif'.length))]
      }
      throw new Error(`unexpected getField ${type}.${field}`)
    },
  }
}

const connect = xapi => connectNbdClientIfPossible(xapi, 'OpaqueRef:vdi', 2)

const rejection = promise =>
  promise.then(
    () => assert.fail('should have rejected'),
    error => error
  )

describe('connectNbdClientIfPossible', () => {
  it('returns a connected client when a server answers', async t => {
    t.after(() => {
      connectError = undefined
    })

    const client = await connect(makeXapi({ advertised: [{ address: '192.168.1.10', port: 10809 }] }))

    assert.deepStrictEqual(client.nbdInfos, [{ address: '192.168.1.10', port: 10809 }])
  })

  it('states that XAPI advertised nothing, and the state of the NBD networks', async () => {
    const error = await rejection(connect(makeXapi({ advertised: [] })))

    assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
    assert.strictEqual(
      error.message,
      'XAPI advertises no NBD server for this VDI (VDI.get_nbd_info returned an empty list): the hosts able to reach its SR must have an IP address on a network with the NBD purpose enabled. ' +
        NBD_NETWORKS_DESCRIPTION
    )
  })

  it('states which servers the backup network filtered out', async () => {
    const error = await rejection(
      connect(
        makeXapi({
          advertised: [{ address: '192.168.1.10', port: 10809 }],
          backupNetwork: 'backup-network-uuid',
          backupNetworkIps: ['10.0.0.1'],
        })
      )
    )

    assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
    assert.strictEqual(
      error.message,
      'none of the NBD servers advertised for this VDI (192.168.1.10:10809) is on the backup network backup-network-uuid (10.0.0.1): enable the NBD purpose on the backup network, or unset the backup network of the pool. ' +
        NBD_NETWORKS_DESCRIPTION
    )
  })

  it('states when no host has an IP on the backup network', async () => {
    const error = await rejection(
      connect(
        makeXapi({
          advertised: [{ address: '192.168.1.10', port: 10809 }],
          backupNetwork: 'backup-network-uuid',
          backupNetworkIps: [''],
        })
      )
    )

    assert.match(error.message, /backup network backup-network-uuid \(no host has an IP on it\)/)
  })

  it('keeps the servers on the backup network', async t => {
    t.after(() => {
      connectError = undefined
    })

    const client = await connect(
      makeXapi({
        advertised: [
          { address: '192.168.1.10', port: 10809 },
          { address: '10.0.0.1', port: 10809 },
        ],
        backupNetwork: 'backup-network-uuid',
        backupNetworkIps: ['10.0.0.1'],
      })
    )

    assert.deepStrictEqual(client.nbdInfos, [{ address: '10.0.0.1', port: 10809 }])
  })

  it('completes an unreachable server with the state of the NBD networks, and keeps the cause', async t => {
    connectError = new Error('could not connect to any NBD server, attempted 192.168.1.10:10809 (operation timed out)')
    connectError.code = 'NO_NBD_AVAILABLE'
    t.after(() => {
      connectError = undefined
    })

    const error = await rejection(connect(makeXapi({ advertised: [{ address: '192.168.1.10', port: 10809 }] })))

    assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
    assert.strictEqual(
      error.message,
      'could not connect to any NBD server, attempted 192.168.1.10:10809 (operation timed out): these addresses are the IP of the hosts on the NBD enabled networks, they must be reachable from XO/the proxy. ' +
        NBD_NETWORKS_DESCRIPTION
    )
    assert.strictEqual(error.cause, connectError)
    assert.strictEqual(error.vdiRef, 'OpaqueRef:vdi')
  })
})
