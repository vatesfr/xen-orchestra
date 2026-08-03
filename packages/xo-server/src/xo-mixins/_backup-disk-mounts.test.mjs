import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Task } from '@vates/task'

import BackupDiskMountsResolver from './backup-disk-mounts.mjs'

const ARCHIVE_ID = 'repo-id/xo-vm-backups/vm-uuid/archive.json'
const DISK_ID = 'disk-id'
const MOUNT_ID = 'mount-id'

const makeArchive = () => ({ id: ARCHIVE_ID, vm: { name_label: 'my-vm' }, disks: [{ id: DISK_ID }] })

/**
 * A fake `app` covering only the no-cache path (`srId` omitted): it never
 * calls `#getApplianceVm`/`#getCacheSr`, which depend on the real appliance's
 * XenStore and are out of reach in a unit test.
 */
function makeApp({ mountDisk, unmountDisk, hydrateDisk } = {}) {
  const disposed = []
  const tasks = []

  const app = {
    listVmBackupsNg: async () => ({ 'repo-id': { 'vm-uuid': [makeArchive()] } }),
    getRemoteWithCredentials: async () => ({ id: 'remote' }),
    getBackupsRemoteAdapter: async () => ({
      value: { handler: {} },
      dispose: async () => {
        disposed.push(true)
      },
    }),
    getObject: (id, type) => {
      assert.equal(type, 'host')
      return { $pool: 'pool-uuid' }
    },
    getXapi: () => ({}),
    tasks: {
      create: properties => {
        const task = new Task({ properties })
        tasks.push({ task, properties })
        return task
      },
    },
    liveMount: {
      mountDisk: mountDisk ?? (async () => ({ id: MOUNT_ID, srUuid: 'sr-uuid', vdiUuid: 'vdi-uuid' })),
      unmountDisk: unmountDisk ?? (async () => {}),
      hydrateDisk: hydrateDisk ?? (async () => ({ id: MOUNT_ID, materialized: { blocks: 1, total: 1 } })),
    },
  }

  return { app, disposed, tasks }
}

describe('mountBackupArchiveDisk', () => {
  it('creates a task carrying the archive/disk, left pending after a successful mount', async () => {
    const { app, tasks } = makeApp()
    const resolver = new BackupDiskMountsResolver(app)

    const result = await resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' })

    assert.deepEqual(result, { id: MOUNT_ID, srUuid: 'sr-uuid', vdiUuid: 'vdi-uuid' })
    assert.equal(tasks.length, 1)
    const [{ task, properties }] = tasks
    assert.equal(task.status, 'pending')
    assert.equal(properties.objectId, ARCHIVE_ID)
    assert.equal(properties.diskId, DISK_ID)
    assert.equal(properties.type, 'xo:live-mount')
  })

  it('ends the task in failure and disposes the remote adapter when the mount fails', async () => {
    const { app, disposed, tasks } = makeApp({
      mountDisk: async () => {
        throw new Error('mount failed')
      },
    })
    const resolver = new BackupDiskMountsResolver(app)

    await assert.rejects(
      resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' }),
      /mount failed/
    )

    assert.equal(tasks[0].task.status, 'failure')
    assert.deepEqual(disposed, [true])
  })
})

describe('unmountBackupArchiveDisk', () => {
  it('succeeds the stored task and forgets it', async () => {
    const { app, tasks } = makeApp()
    const resolver = new BackupDiskMountsResolver(app)
    await resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' })

    await resolver.unmountBackupArchiveDisk(MOUNT_ID)

    assert.equal(tasks[0].task.status, 'success')
    // a second call falls back to a plain, task-less unmount instead of erroring
    await resolver.unmountBackupArchiveDisk(MOUNT_ID)
  })

  it('ends the task in failure when unmounting fails', async () => {
    const { app, tasks } = makeApp({
      unmountDisk: async () => {
        throw new Error('unmount failed')
      },
    })
    const resolver = new BackupDiskMountsResolver(app)
    await resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' })

    await assert.rejects(resolver.unmountBackupArchiveDisk(MOUNT_ID), /unmount failed/)

    assert.equal(tasks[0].task.status, 'failure')
  })
})

describe('hydrateBackupArchiveDisk', () => {
  it('leaves the mount task pending and surfaces the error when hydration fails', async () => {
    const { app, tasks } = makeApp({
      hydrateDisk: async () => {
        throw new Error('hydration failed')
      },
    })
    const resolver = new BackupDiskMountsResolver(app)
    await resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' })

    await assert.rejects(resolver.hydrateBackupArchiveDisk(MOUNT_ID), /hydration failed/)

    // the disk is still mounted: its task must still be pending, not failed
    assert.equal(tasks[0].task.status, 'pending')
    // ... so a later unmount still works normally
    await resolver.unmountBackupArchiveDisk(MOUNT_ID)
    assert.equal(tasks[0].task.status, 'success')
  })

  it('returns the result and keeps the task pending on success', async () => {
    const { app, tasks } = makeApp()
    const resolver = new BackupDiskMountsResolver(app)
    await resolver.mountBackupArchiveDisk({ archiveId: ARCHIVE_ID, diskId: DISK_ID, hostId: 'host-id' })

    const result = await resolver.hydrateBackupArchiveDisk(MOUNT_ID)

    assert.deepEqual(result, { id: MOUNT_ID, materialized: { blocks: 1, total: 1 } })
    assert.equal(tasks[0].task.status, 'pending')
  })
})
