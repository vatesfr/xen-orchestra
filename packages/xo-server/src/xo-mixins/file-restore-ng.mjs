import Disposable from 'promise-toolbox/Disposable'
import isPromise from 'promise-toolbox/isPromise'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { execa } from 'execa'
import { MultiKeyMap } from '@vates/multi-key-map'

const { warn } = createLogger('xo:mixins:file-restore-ng')

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
  #mounts = new MultiKeyMap()

  constructor(app) {
    this._app = app

    // clean any LVM volumes that might have not been properly
    // unmounted
    app.hooks.on('start', async () => {
      await Promise.all([execa('losetup', ['-D']), execa('vgchange', ['-an'])])
      await execa('pvscan', ['--cache'])
    })

    app.hooks.on('stop', () =>
      asyncEach(
        this.#mounts.values(),
        async pDisposable => {
          await (await pDisposable).dispose()
        },
        { stopOnError: false }
      )
    )
  }

  async fetchBackupNgPartitionFiles(remoteId, diskId, partitionId, paths, format) {
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

            // don't send the legacy default format to keep compatibility with old proxies
            format: format === 'zip' ? undefined : format,
          },
          {
            assertType: 'stream',

            // File restore can be slow to start, allow up to 10 mins to be safe.
            timeout: 600e3,
          }
        )
      : Disposable.use(app.getBackupsRemoteAdapter(remote), adapter =>
          adapter.fetchPartitionFiles(diskId, partitionId, paths, format)
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

  listMountedPartitions() {
    const mounts = []
    for (const [key, disposable] of this.#mounts.entries()) {
      if (!isPromise(disposable)) {
        const [remote, disk, partition] = key
        mounts.push({ remote, disk, partition, path: disposable.value })
      }
    }
    return mounts
  }

  @decorateWith(Disposable.factory)
  *_mountPartition(remoteId, diskId, partitionId) {
    const adapter = yield this._app.getBackupsRemoteAdapter(remoteId)

    // yield(2) the disposable to use it
    // yield(1) the value to make it available
    yield yield adapter.getPartition(diskId, partitionId)
  }

  async mountPartition(remoteId, diskId, partitionId) {
    const mounts = this.#mounts
    const key = [remoteId, diskId, partitionId]

    let pDisposable = mounts.get(key)
    if (pDisposable !== undefined) {
      return (await pDisposable).value
    }

    pDisposable = this._mountPartition(remoteId, diskId, partitionId)
    mounts.set(key, pDisposable)
    pDisposable.catch(() => mounts.delete(key))

    const disposable = await pDisposable

    // replace the promise by it's value so that it can be used directly in
    // listMountedPartitions without breaking other uses
    mounts.set(key, disposable)

    const delay = await this._app.config.getDuration('backups.autoUnmountPartitionDelay')
    if (delay !== 0) {
      const dispose = disposable.dispose.bind(disposable)

      const handle = setTimeout(
        () =>
          disposable.dispose().catch(error => {
            warn('unmounting partition', { error })
          }),
        delay
      )
      disposable.dispose = () => {
        clearTimeout(handle)
        return dispose()
      }
    }

    return disposable.value
  }

  async unmountPartition(remoteId, diskId, partitionId) {
    const mounts = this.#mounts
    const key = [remoteId, diskId, partitionId]

    const pDisposable = mounts.get(key)
    if (pDisposable === undefined) {
      return
    }

    mounts.delete(key)

    await (await pDisposable).dispose()
  }
}
