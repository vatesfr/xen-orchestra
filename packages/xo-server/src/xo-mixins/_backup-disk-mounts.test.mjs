import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'
import { noSuchObject } from 'xo-common/api-errors.js'

import BackupDiskMountsResolver from './backup-disk-mounts.mjs'

const archiveId = 'remote-1/xo-vm-backups/vm-1/20260101T000000Z.json'
const hostId = 'host-1'
const proxyId = 'proxy-1'

// stands for xen-api's record cache, whose type index reports each removed record of the pool on
// its own, per type
const makeXapi = () => {
  const emitters = { __proto__: null }
  const getEventEmitterByType = type => (emitters[type] ??= new EventEmitter())
  return {
    objects: { allIndexes: { type: { getEventEmitterByType } } },
    removeRecord: ($type, uuid) => getEventEmitterByType($type).emit('remove', undefined, { $type, uuid }),
  }
}

const makeNoSuchLiveMount = id => {
  try {
    noSuchObject(id, 'live-mount')
  } catch (error) {
    return error
  }
}

/**
 * @param {object} [opts]
 * @param {(method: string, params: object) => Promise<unknown>} [opts.callProxyMethod]
 * @param {(id: string) => Promise<void>} [opts.unmountDisk] - local `liveMount.unmountDisk`
 */
function createResolver({ callProxyMethod = async () => {}, unmountDisk = async () => {} } = {}) {
  const calls = []
  // connections handed to the mixin
  const watchedConnections = []
  const xapi = makeXapi()
  // XO emits `server:connected` for each new XAPI connection
  const app = Object.assign(new EventEmitter(), {
    async callProxyMethod(id, method, params) {
      calls.push([id, method, params])
      return callProxyMethod(method, params)
    },
    getObject: () => ({ _xapiRef: 'OpaqueRef:host', uuid: hostId }),
    getRemoteWithCredentials: async () => ({ url: 'file:///backups' }),
    getBackupsRemoteAdapter: async () => ({ value: { handler: {} }, dispose: async () => {} }),
    getXapi: () => xapi,
    listVmBackupsNg: async () => ({
      'remote-1': { 'vm-1': [{ id: archiveId, disks: [{ id: 'disk.vhd' }], vm: { name_label: 'vm' } }] },
    }),
    // the resolver listens to `unmounted` to forget the mounts that disappear on their own
    liveMount: Object.assign(new EventEmitter(), {
      mountDisk: async () => ({ id: 'local-mount', srUuid: 'sr-local' }),
      unmountDisk,
      watchConnection: xapi => watchedConnections.push(xapi),
    }),
  })
  return { app, calls, resolver: new BackupDiskMountsResolver(app), watchedConnections, xapi }
}

const isKnown = (resolver, id) => {
  try {
    resolver.getBackupArchiveDiskMountOwner(id)
    return true
  } catch (error) {
    if (noSuchObject.is(error)) {
      return false
    }
    throw error
  }
}

describe('registerProxyBackupArchiveDiskMounts', () => {
  it('records each mount with its own host and the proxy serving it', () => {
    const { resolver } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({ archiveId, mounts: [{ id: 'm1', hostId, srUuid: 'x' }], proxyId })

    assert.deepEqual(resolver.getBackupArchiveDiskMountOwner('m1'), { archiveId, hostId, proxyId })
  })
})

describe('unmountBackupArchiveDisk on a proxy', () => {
  it('asks the proxy and forgets the mount', async () => {
    const { calls, resolver } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({ archiveId, mounts: [{ id: 'm1', hostId }], proxyId })

    await resolver.unmountBackupArchiveDisk('m1')

    assert.deepEqual(calls, [[proxyId, 'backup.unmountDisk', { id: 'm1' }]])
    assert.equal(isKnown(resolver, 'm1'), false)
  })

  it('keeps the mount when the call fails, so the unmount can be retried', async () => {
    let fail = true
    const { resolver } = createResolver({
      callProxyMethod: async () => {
        if (fail) {
          throw new Error('fetch failed')
        }
      },
    })
    resolver.registerProxyBackupArchiveDiskMounts({ archiveId, mounts: [{ id: 'm1', hostId }], proxyId })

    await assert.rejects(resolver.unmountBackupArchiveDisk('m1'), /fetch failed/)
    assert.equal(isKnown(resolver, 'm1'), true)

    fail = false
    await resolver.unmountBackupArchiveDisk('m1')
    assert.equal(isKnown(resolver, 'm1'), false)
  })

  it('forgets a mount the proxy no longer knows, and still reports it', async () => {
    const { resolver } = createResolver({
      callProxyMethod: async (method, { id }) => {
        throw makeNoSuchLiveMount(id)
      },
    })
    resolver.registerProxyBackupArchiveDiskMounts({ archiveId, mounts: [{ id: 'm1', hostId }], proxyId })

    await assert.rejects(resolver.unmountBackupArchiveDisk('m1'), error => noSuchObject.is(error))
    assert.equal(isKnown(resolver, 'm1'), false)
  })
})

describe('unmountBackupArchiveDisk on this appliance', () => {
  it('forgets the mount even when the teardown fails', async () => {
    const { resolver } = createResolver({
      unmountDisk: async () => {
        throw new Error('SR_HAS_NO_PBDS')
      },
    })
    const mount = await resolver.mountBackupArchiveDisk({ archiveId, diskId: 'disk.vhd', hostId })
    assert.deepEqual(resolver.getBackupArchiveDiskMountOwner(mount.id), { archiveId, hostId, proxyId: undefined })

    await assert.rejects(resolver.unmountBackupArchiveDisk(mount.id), /SR_HAS_NO_PBDS/)
    assert.equal(isKnown(resolver, mount.id), false)
  })
})

describe('liveMount unmounted event', () => {
  it('forgets a mount that disappeared on its own', () => {
    const { app, resolver } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({ archiveId, mounts: [{ id: 'm1', hostId }], proxyId })

    app.liveMount.emit('unmounted', 'm1')

    assert.equal(isKnown(resolver, 'm1'), false)
  })
})

describe('removal of the SR of a mount served by a proxy', () => {
  // the unmount it triggers is not awaited by anything
  const flush = () => new Promise(resolve => setImmediate(resolve))

  it('asks the proxy to unmount and forgets the mount', async () => {
    const { calls, resolver, xapi } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({
      archiveId,
      mounts: [{ id: 'm1', hostId, srUuid: 'sr-1' }],
      proxyId,
    })

    xapi.removeRecord('SR', 'sr-1')
    await flush()

    assert.deepEqual(calls, [[proxyId, 'backup.unmountDisk', { id: 'm1' }]])
    assert.equal(isKnown(resolver, 'm1'), false)
  })

  it('ignores the removal an explicit unmount causes', async () => {
    const { calls, resolver, xapi } = createResolver({
      // the proxy forgetting the SR is reported while the call is still running
      callProxyMethod: async () => xapi.removeRecord('SR', 'sr-1'),
    })
    resolver.registerProxyBackupArchiveDiskMounts({
      archiveId,
      mounts: [{ id: 'm1', hostId, srUuid: 'sr-1' }],
      proxyId,
    })

    await resolver.unmountBackupArchiveDisk('m1')
    await flush()

    assert.equal(calls.length, 1)
  })

  it('keeps watching after a failed unmount', async () => {
    let fail = true
    const { calls, resolver, xapi } = createResolver({
      callProxyMethod: async () => {
        if (fail) {
          throw new Error('ECONNREFUSED')
        }
      },
    })
    resolver.registerProxyBackupArchiveDiskMounts({
      archiveId,
      mounts: [{ id: 'm1', hostId, srUuid: 'sr-1' }],
      proxyId,
    })
    await assert.rejects(resolver.unmountBackupArchiveDisk('m1'))

    fail = false
    xapi.removeRecord('SR', 'sr-1')
    await flush()

    assert.equal(calls.length, 2)
    assert.equal(isKnown(resolver, 'm1'), false)
  })

  it('watches the connections established afterwards, e.g. a reconnection', async () => {
    const { app, calls, resolver } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({
      archiveId,
      mounts: [{ id: 'm1', hostId, srUuid: 'sr-1' }],
      proxyId,
    })

    const reconnected = makeXapi()
    app.emit('server:connected', { server: {}, xapi: reconnected })
    reconnected.removeRecord('SR', 'sr-1')
    await flush()

    assert.deepEqual(calls, [[proxyId, 'backup.unmountDisk', { id: 'm1' }]])
  })

  it('hands the new connections to the mixin, for the mounts served here', () => {
    const { app, watchedConnections } = createResolver()

    const reconnected = makeXapi()
    app.emit('server:connected', { server: {}, xapi: reconnected })

    assert.deepEqual(watchedConnections, [reconnected])
  })

  it('ignores the removal of anything but an SR', async () => {
    const { calls, resolver, xapi } = createResolver()
    resolver.registerProxyBackupArchiveDiskMounts({
      archiveId,
      mounts: [{ id: 'm1', hostId, srUuid: 'sr-1' }],
      proxyId,
    })

    xapi.removeRecord('VDI', 'sr-1')
    await flush()

    assert.deepEqual(calls, [])
    assert.equal(isKnown(resolver, 'm1'), true)
  })

  it('leaves the mounts served here to the mixin, which watches their VDI', async () => {
    const unmounted = []
    const { resolver, xapi } = createResolver({ unmountDisk: async id => unmounted.push(id) })
    await resolver.mountBackupArchiveDisk({ archiveId, diskId: 'disk.vhd', hostId })

    xapi.removeRecord('SR', 'sr-local')
    await flush()

    assert.deepEqual(unmounted, [])
  })
})
