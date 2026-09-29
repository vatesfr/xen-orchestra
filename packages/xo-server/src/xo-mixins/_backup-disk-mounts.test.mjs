import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { noSuchObject } from 'xo-common/api-errors.js'

import BackupDiskMountsResolver from './backup-disk-mounts.mjs'

const archiveId = 'remote-1/xo-vm-backups/vm-1/20260101T000000Z.json'
const hostId = 'host-1'
const proxyId = 'proxy-1'

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
  const app = {
    async callProxyMethod(id, method, params) {
      calls.push([id, method, params])
      return callProxyMethod(method, params)
    },
    getObject: () => ({ _xapiRef: 'OpaqueRef:host', uuid: hostId }),
    getRemoteWithCredentials: async () => ({ url: 'file:///backups' }),
    getBackupsRemoteAdapter: async () => ({ value: { handler: {} }, dispose: async () => {} }),
    getXapi: () => ({}),
    listVmBackupsNg: async () => ({
      'remote-1': { 'vm-1': [{ id: archiveId, disks: [{ id: 'disk.vhd' }], vm: { name_label: 'vm' } }] },
    }),
    liveMount: {
      mountDisk: async () => ({ id: 'local-mount' }),
      unmountDisk,
    },
  }
  return { calls, resolver: new BackupDiskMountsResolver(app) }
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
