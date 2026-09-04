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

// A pool with several NBD enabled networks: the host is only addressable on some of them, which
// is the setup making XAPI advertise addresses unreachable from a XO/proxy attached to another.
// The addresses are on the loopback so the reachability probe of the diagnostic answers at once.
const POOL_RECORDS = [
  { $type: 'host', $ref: 'host1', uuid: 'host1', name_label: 'srv-1' },
  { $type: 'PIF', $ref: 'mgmtPif', uuid: 'mgmtPif', host: 'host1', IP: '127.0.0.1', currently_attached: true },
  { $type: 'PIF', $ref: 'isolatedPif', uuid: 'isolatedPif', host: 'host1', IP: '', currently_attached: true },
  { $type: 'PIF', $ref: 'backupPif', uuid: 'backupPif', host: 'host1', IP: '127.0.0.2', currently_attached: true },
  {
    $type: 'network',
    $ref: 'mgmtNet',
    uuid: 'mgmt-network-uuid',
    name_label: 'Management',
    purpose: ['nbd'],
    PIFs: ['mgmtPif'],
  },
  {
    $type: 'network',
    $ref: 'isolatedNet',
    uuid: 'isolated-network-uuid',
    name_label: 'Proxy net',
    purpose: ['nbd'],
    PIFs: ['isolatedPif'],
  },
  {
    $type: 'network',
    $ref: 'backupNet',
    uuid: 'backup-network-uuid',
    name_label: 'Backup',
    purpose: ['nbd'],
    PIFs: ['backupPif'],
  },
  {
    $type: 'network',
    $ref: 'iplessBackupNet',
    uuid: 'ipless-backup-network-uuid',
    name_label: 'Backup (no IP)',
    purpose: ['nbd'],
    PIFs: ['isolatedPif'],
  },
]

const BY_REF = Object.fromEntries(POOL_RECORDS.map(record => [record.$ref, record]))
const BY_UUID = Object.fromEntries(POOL_RECORDS.map(record => [record.uuid, record]))

const SERVER = address => ({ address, port: 10809 })

// the exact wording of the appended setup description is covered by _nbdDiagnostic.test.mjs
const ALL_NETWORKS_REPORTED = /NBD enabled networks: "Management" \(nbd\)/
const BACKUP_NETWORK_ONLY = /the pool backup network is the only one that can be used for NBD/

function makeXapi({ advertised, backupNetwork }) {
  return {
    _pool: { other_config: backupNetwork === undefined ? {} : { 'xo:backupNetwork': backupNetwork } },
    objects: { all: BY_UUID },
    getObjectByRef: ref => BY_REF[ref],
    call: async (method, arg) => {
      if (method === 'VDI.get_nbd_info') {
        assert.strictEqual(arg, 'OpaqueRef:vdi')
        return advertised
      }
      if (method === 'network.get_by_uuid') {
        return BY_UUID[arg].$ref
      }
      throw new Error(`unexpected call to ${method}`)
    },
    getField: async (type, ref, field) => {
      const record = BY_REF[ref]
      if ((type === 'network' && field === 'PIFs') || (type === 'PIF' && field === 'IP')) {
        return record[field]
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

function assertNoNbdAvailable(error, reason, appended) {
  assert.strictEqual(error.code, 'NO_NBD_AVAILABLE')
  assert.ok(error.message.startsWith(reason), `expected message to start with:\n  ${reason}\ngot:\n  ${error.message}`)
  assert.match(error.message, appended)
}

describe('connectNbdClientIfPossible', () => {
  it('returns a connected client when a server answers', async t => {
    t.after(() => {
      connectError = undefined
    })

    const client = await connect(makeXapi({ advertised: [SERVER('127.0.0.1')] }))

    assert.deepStrictEqual(client.nbdInfos, [SERVER('127.0.0.1')])
  })

  it('states that XAPI advertised nothing, and the state of the NBD networks', async () => {
    const error = await rejection(connect(makeXapi({ advertised: [] })))

    assertNoNbdAvailable(
      error,
      'XAPI advertises no NBD server for this VDI (VDI.get_nbd_info returned an empty list): the hosts able to reach its SR must have an IP address on a network with the NBD purpose enabled.',
      ALL_NETWORKS_REPORTED
    )
  })

  it('states which servers the backup network filtered out', async () => {
    const error = await rejection(
      connect(makeXapi({ advertised: [SERVER('127.0.0.1')], backupNetwork: 'backup-network-uuid' }))
    )

    assertNoNbdAvailable(
      error,
      'none of the NBD servers advertised for this VDI (127.0.0.1:10809) is on the backup network backup-network-uuid (127.0.0.2): enable the NBD purpose on the backup network, or unset the backup network of the pool.',
      BACKUP_NETWORK_ONLY
    )
  })

  it('states when no host has an IP on the backup network', async () => {
    const error = await rejection(
      connect(makeXapi({ advertised: [SERVER('127.0.0.1')], backupNetwork: 'ipless-backup-network-uuid' }))
    )

    assert.match(error.message, /backup network ipless-backup-network-uuid \(no host has an IP on it\)/)
  })

  // a pool backup network makes the other NBD enabled networks unusable, so they must not be
  // reported: pointing at "Management" here would send the user fixing the wrong network
  it('reports only the backup network once one is set', async () => {
    const error = await rejection(
      connect(makeXapi({ advertised: [SERVER('127.0.0.1')], backupNetwork: 'backup-network-uuid' }))
    )

    assert.match(error.message, BACKUP_NETWORK_ONLY)
    assert.doesNotMatch(error.message, /Proxy net/)
    assert.doesNotMatch(error.message, ALL_NETWORKS_REPORTED)
  })

  it('keeps the servers on the backup network', async t => {
    t.after(() => {
      connectError = undefined
    })

    const client = await connect(
      makeXapi({
        advertised: [SERVER('127.0.0.1'), SERVER('127.0.0.2')],
        backupNetwork: 'backup-network-uuid',
      })
    )

    assert.deepStrictEqual(client.nbdInfos, [SERVER('127.0.0.2')])
  })

  it('completes an unreachable server with the state of the NBD networks, and keeps the cause', async t => {
    connectError = new Error('could not connect to any NBD server, attempted 127.0.0.1:10809 (operation timed out)')
    connectError.code = 'NO_NBD_AVAILABLE'
    t.after(() => {
      connectError = undefined
    })

    const error = await rejection(connect(makeXapi({ advertised: [SERVER('127.0.0.1')] })))

    assertNoNbdAvailable(
      error,
      'could not connect to any NBD server, attempted 127.0.0.1:10809 (operation timed out): these addresses are the IP of the hosts on the NBD enabled networks, they must be reachable from XO/the proxy.',
      ALL_NETWORKS_REPORTED
    )
    assert.strictEqual(error.cause, connectError)
    assert.strictEqual(error.vdiRef, 'OpaqueRef:vdi')
  })
})
