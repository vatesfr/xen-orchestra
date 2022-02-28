import Disposable from 'promise-toolbox/Disposable'
import { execa } from 'execa'

// - [x] list partitions
// - [x] list files in a partition
// - [x] list files in a bare partition
// - [x] list LVM partitions
//
// - [ ] partitions with unmount debounce
// - [ ] handle directory restore
// - [ ] handle multiple entries restore (both dirs and files)
//       - [ ] by default use common path as root
// - [ ] handle LVM partitions on multiple disks
// - [ ] find mounted disks/partitions on start (in case of interruptions)
//
// - [ ] manual mount/unmount (of disk) for advance file restore
//       - could it stay mounted during the backup process?
//       - [ ] mountDisk (VHD)
//       - [ ] unmountDisk (only for manual mount)
//       - [ ] getMountedDisks
//       - [ ] mountPartition (optional)
//       - [ ] getMountedPartitions
//       - [ ] unmountPartition
export default class BackupNgFileRestore {
  constructor(app) {
    this._app = app
    this._mounts = { __proto__: null }

    // clean any LVM volumes that might have not been properly
    // unmounted
    app.hooks.on('start', async () => {
      await Promise.all([execa('losetup', ['-D']), execa('vgchange', ['-an'])])
      await execa('pvscan', ['--cache'])
    })
  }

  async fetchBackupNgPartitionFiles(remoteId, diskId, partitionId, paths) {
    const app = this._app
    const remote = await app.getRemoteWithCredentials(remoteId)
    return remote.proxy !== undefined
      ? app.callProxyMethod(
          remote.proxy,
          'backup.fetchPartitionFiles',
          {
            disk: diskId,
            remote: {
              url: remote.url,
              options: remote.options,
            },
            partition: partitionId,
            paths,
          },
          { assertType: 'stream' }
        )
      : Disposable.use(app.getBackupsRemoteAdapter(remote), adapter =>
          adapter.fetchPartitionFiles(diskId, partitionId, paths)
        )
  }

  async listBackupNgDiskPartitions(remoteId, diskId) {
    const app = this._app
    const remote = await app.getRemoteWithCredentials(remoteId)
    if (remote.proxy !== undefined) {
      const stream = await app.callProxyMethod(
        remote.proxy,
        'backup.listDiskPartitions',
        {
          disk: diskId,
          remote: {
            url: remote.url,
            options: remote.options,
          },
        },
        { assertType: 'iterator' }
      )

      const partitions = []
      for await (const partition of stream) {
        partitions.push(partition)
      }
      return partitions
    } else {
      return Disposable.use(app.getBackupsRemoteAdapter(remote), adapter => adapter.listPartitions(diskId))
    }
  }

  async listBackupNgPartitionFiles(remoteId, diskId, partitionId, path) {
    const app = this._app
    const remote = await app.getRemoteWithCredentials(remoteId)
    return remote.proxy !== undefined
      ? app.callProxyMethod(remote.proxy, 'backup.listPartitionFiles', {
          disk: diskId,
          remote: {
            url: remote.url,
            options: remote.options,
          },
          partition: partitionId,
          path,
        })
      : Disposable.use(app.getBackupsRemoteAdapter(remote), adapter =>
          adapter.listPartitionFiles(diskId, partitionId, path)
        )
  }
}
