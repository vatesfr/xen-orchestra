import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { VhdDirectory, VhdSynthetic } from 'vhd-lib'
import { decorateMethodsWith } from '@vates/decorate-with'
import { synchronized } from 'decorator-synchronized'
import Disposable from 'promise-toolbox/Disposable'

import { VmBackupDirectory, VmFullBackupArchive, VmIncrementalBackupArchive } from '@xen-orchestra/backup-archive'
import {
  deleteMetadataBackup as deleteMetadataBackupArchive,
  deleteOldMetadataBackups as deleteOldMetadataBackupsArchive,
} from '@xen-orchestra/backup-archive/metadata'
import { fileRestoreDecorators, fileRestoreMethods } from './_fileRestore.mjs'
import { isValidXva } from './_isValidXva.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

import { toVhdStream, writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'

export const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'

export const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'

const { warn } = createLogger('xo:backups:RemoteAdapter')

export const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const noop = Function.prototype

const createSafeReaddir = (handler, methodName) => (path, options) =>
  handler.list(path, options).catch(error => {
    if (error?.code !== 'ENOENT') {
      warn(`${methodName} ${path}`, { error })
    }
    return []
  })

export class RemoteAdapter {
  constructor(
    handler,
    { debounceResource = res => res, dirMode, vhdDirectoryCompression, useGetDiskLegacy = false } = {}
  ) {
    this._debounceResource = debounceResource
    this._dirMode = dirMode
    this._handler = handler
    this._vhdDirectoryCompression = vhdDirectoryCompression
    this._readCacheListVmBackups = synchronized.withKey()(this._readCacheListVmBackups)
    this._useGetDiskLegacy = useGetDiskLegacy
  }

  get handler() {
    return this._handler
  }

  // check if we will be allowed to merge a vhd created in this adapter
  // with the vhd at path `path`
  async isMergeableParent(packedParentUid, path) {
    return await Disposable.use(VhdSynthetic.fromVhdChain(this.handler, path), vhd => {
      // this baseUuid is not linked with this vhd
      if (!vhd.footer.uuid.equals(packedParentUid)) {
        return false
      }

      // check if all the chain is composed of vhd directory
      const isVhdDirectory = vhd.checkVhdsClass(VhdDirectory)
      return isVhdDirectory
        ? this.useVhdDirectory() && this.#getCompressionType() === vhd.compressionType
        : !this.useVhdDirectory()
    })
  }

  // inject the locked _updateCache so cache updates stay serialized per file
  #updateCacheLocked = (path, fn) => this._updateCache(path, fn)

  async deleteDeltaVmBackups(backups) {
    return VmBackupDirectory.deleteDeltaVmBackups(this._handler, backups, { updateCache: this.#updateCacheLocked })
  }

  async deleteMetadataBackup(backupId) {
    return deleteMetadataBackupArchive(this._handler, backupId)
  }

  async deleteOldMetadataBackups(dir, retention) {
    return deleteOldMetadataBackupsArchive(this._handler, dir, retention)
  }

  async deleteFullVmBackups(backups) {
    return VmBackupDirectory.deleteFullVmBackups(this._handler, backups, { updateCache: this.#updateCacheLocked })
  }

  deleteVmBackup(file) {
    return this.deleteVmBackups([file])
  }

  async deleteVmBackups(files) {
    // inject the facade's lock-owning cleanVm (not the static one, which ignores locking)
    return VmBackupDirectory.deleteVmBackups(this._handler, files, {
      updateCache: this.#updateCacheLocked,
      cleanVm: (dir, opts) => this.cleanVm(dir, opts),
    })
  }

  #getCompressionType() {
    return this._vhdDirectoryCompression
  }

  useVhdDirectory() {
    return this.handler.useVhdDirectory()
  }

  #useAlias() {
    return this.useVhdDirectory()
  }

  // if we use alias on this remote, we have to name the file alias.vhd
  getVhdFileName(baseName) {
    if (this.#useAlias()) {
      return `${baseName}.alias.vhd`
    }
    return `${baseName}.vhd`
  }

  async listAllVms() {
    return VmBackupDirectory.listAllVms(this._handler)
  }

  async listAllVmBackups() {
    return VmBackupDirectory.listAllVmBackups(this._handler, vmUuid => this.listVmBackups(vmUuid))
  }

  async listPoolMetadataBackups() {
    const handler = this._handler
    const safeReaddir = createSafeReaddir(handler, 'listPoolMetadataBackups')

    const backupsByPool = {}
    await asyncMap(await safeReaddir(DIR_XO_POOL_METADATA_BACKUPS, { prependDir: true }), async scheduleDir =>
      asyncMap(await safeReaddir(scheduleDir), async poolId => {
        const backups = backupsByPool[poolId] ?? (backupsByPool[poolId] = [])
        return asyncMap(await safeReaddir(`${scheduleDir}/${poolId}`, { prependDir: true }), async backupDir => {
          try {
            backups.push({
              id: backupDir,
              ...JSON.parse(String(await handler.readFile(`${backupDir}/metadata.json`))),
            })
          } catch (error) {
            warn(`listPoolMetadataBackups ${backupDir}`, {
              error,
            })
          }
        })
      })
    )

    // delete empty entries and sort backups
    Object.keys(backupsByPool).forEach(poolId => {
      const backups = backupsByPool[poolId]
      if (backups.length === 0) {
        delete backupsByPool[poolId]
      } else {
        backups.sort(compareTimestamp)
      }
    })

    return backupsByPool
  }

  #getVmBackupsCache(vmUuid) {
    return VmBackupDirectory.getVmBackupsCachePath(vmUuid)
  }

  async _readCache(path) {
    return VmBackupDirectory.readCache(this._handler, path)
  }

  _updateCache = synchronized.withKey()(this._updateCache)
  // eslint-disable-next-line no-dupe-class-members
  async _updateCache(path, fn) {
    return VmBackupDirectory.updateCache(this._handler, path, fn)
  }

  async _writeCache(path, data) {
    return VmBackupDirectory.writeCache(this._handler, path, data)
  }

  // use _ to mark this method as private by convention
  // since we decorate it with synchronized.withKey in the constructor
  // and # function are not writeable.
  //
  // read the list of backup of a Vm from cache
  // if cache is missing  or broken  => regenerate it and return
  async _readCacheListVmBackups(vmUuid) {
    return VmBackupDirectory.readCacheListVmBackups(this._handler, vmUuid)
  }

  async listVmBackups(vmUuid, predicate) {
    // pass the locked _readCacheListVmBackups so cache regeneration stays serialized
    return VmBackupDirectory.listVmBackups(uuid => this._readCacheListVmBackups(uuid), vmUuid, predicate)
  }

  async listXoMetadataBackups() {
    const handler = this._handler
    const safeReaddir = createSafeReaddir(handler, 'listXoMetadataBackups')

    const backups = []
    await asyncMap(await safeReaddir(DIR_XO_CONFIG_BACKUPS, { prependDir: true }), async scheduleDir =>
      asyncMap(await safeReaddir(scheduleDir, { prependDir: true }), async backupDir => {
        try {
          backups.push({
            id: backupDir,
            ...JSON.parse(String(await handler.readFile(`${backupDir}/metadata.json`))),
          })
        } catch (error) {
          warn(`listXoMetadataBackups ${backupDir}`, { error })
        }
      })
    )

    return backups.sort(compareTimestamp)
  }

  async writeVmBackupMetadata(vmUuid, metadata) {
    // pass the locked _updateCache so the cache entry is added atomically
    return VmBackupDirectory.writeVmBackupMetadata(this._handler, vmUuid, metadata, {
      dirMode: this._dirMode,
      updateCache: (path, fn) => this._updateCache(path, fn),
    })
  }

  async writeVhd(path, disk, { validator = noop, writeBlockConcurrency } = {}) {
    const handler = this._handler

    if (this.useVhdDirectory()) {
      return await writeToVhdDirectory({
        disk,
        target: {
          handler,
          path,
          concurrency: writeBlockConcurrency,
          validator,
          compression: 'brotli',
        },
      })
    } else {
      const stream = await toVhdStream(disk)
      const size = await this.outputStream(path, stream, { validator, checksum: false })
      await validator(path)
      return size
    }
  }

  async outputStream(
    path,
    input,
    { checksum = !this._handler.isEncrypted, maxStreamLength, streamLength, validator = noop } = {}
  ) {
    const container = watchStreamSize(input)
    await this._handler.outputStream(path, input, {
      checksum,
      dirMode: this._dirMode,
      maxStreamLength,
      streamLength,
      async validator() {
        await input.task
        return validator.apply(this, arguments)
      },
    })
    return container.size
  }

  async readIncrementalVmBackup(metadata, ignoredVdis, opts) {
    return VmIncrementalBackupArchive.readIncrementalVmBackup(this._handler, metadata, ignoredVdis, opts)
  }

  readFullVmBackup(metadata) {
    return VmFullBackupArchive.readFullVmBackup(this._handler, metadata)
  }

  async readVmBackupMetadata(path) {
    return VmBackupDirectory.readVmBackupMetadata(this._handler, path)
  }

  async getTotalVmBackupSize() {
    return VmBackupDirectory.getTotalVmBackupSize(this._handler, vmUuid => this.listVmBackups(vmUuid))
  }

  async getTotalBackupSize() {
    const vmBackupSize = await this.getTotalVmBackupSize()
    // @TODO: add `getTotalXoBackupSize` and `getTotalPoolBackupSize` once `size` is implemented by fs
    return vmBackupSize
  }
}

Object.assign(RemoteAdapter.prototype, {
  cleanVm(vmBackupPath, opts = {}) {
    const { lock = true, ...cleanOpts } = opts
    if (lock) {
      return Disposable.use(this._handler.lock(vmBackupPath), () => {
        return VmBackupDirectory.cleanVm(this._handler, vmBackupPath, cleanOpts)
      })
    } else {
      return VmBackupDirectory.cleanVm(this._handler, vmBackupPath, cleanOpts)
    }
  },
  isValidXva,
})

// File-level-restore methods live in ./_fileRestore.mjs; mix them onto the prototype
// before decorating so decorateMethodsWith can wrap them.
Object.assign(RemoteAdapter.prototype, fileRestoreMethods)

decorateMethodsWith(RemoteAdapter, fileRestoreDecorators)
