import { asyncEach } from '@vates/async-each'
import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { stringify } from 'uuid'
import { decorateMethodsWith } from '@vates/decorate-with'
import { basename, dirname, join, resolve } from 'node:path'
import { normalize } from '@xen-orchestra/fs/path'
import { synchronized } from 'decorator-synchronized'
import Disposable from 'promise-toolbox/Disposable'
import groupBy from 'lodash/groupBy.js'
import pickBy from 'lodash/pickBy.js'
import reduce from 'lodash/reduce.js'
import { Task } from '@vates/task'

import { BACKUP_DIR } from './_getVmBackupDir.mjs'
import {
  VmBackupDirectory,
  deleteFullVmBackups as deleteFullVmBackupFiles,
  deleteDeltaVmBackups as deleteDeltaVmBackupFiles,
  deleteMetadataBackup as deleteMetadataBackupFiles,
  readBackupCache,
  writeBackupCache,
} from '@xen-orchestra/backup-archive'
import { fileRestoreDecorators, fileRestoreMethods } from './_fileRestore.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'
import { isMetadataFile } from './_backupType.mjs'
import {
  isKnownJournalEvent,
  readBackupJournal,
  writeBackupJournalEntries,
  writeBackupJournalEntry,
} from './_backupJournal.mjs'
import { isValidXva } from './_isValidXva.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

import { RemoteVhdDisk, openDiskChain, openDisposableDisk } from '@xen-orchestra/backup-archive/disks'
import { toVhdStream, writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'
import { ReadAhead } from '@xen-orchestra/disk-transform'

export const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'

export const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'

const IMMUTABILITY_METADATA_FILENAME = '/immutability.json'

const { debug, warn } = createLogger('xo:backups:RemoteAdapter')

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
  constructor(handler, { debounceResource = res => res, dirMode, useGetDiskLegacy = false } = {}) {
    this._debounceResource = debounceResource
    this._dirMode = dirMode
    this._handler = handler
    this._readCacheListVmBackups = synchronized.withKey()(this._readCacheListVmBackups)
    this._useGetDiskLegacy = useGetDiskLegacy
  }

  get handler() {
    return this._handler
  }

  // check if we will be allowed to merge a vhd created in this adapter
  // with the vhd at path `path`
  //
  // only the candidate disk itself is checked (no ancestor walk): mergeBlock() already
  // degrades gracefully when parent/child formats differ, so chain-wide uniformity isn't
  // a requirement here.
  async isMergeableParent(packedParentUid, path) {
    return await Disposable.use(openDisposableDisk({ handler: this.handler, path, ignoreBlockIndexes: true }), disk =>
      disk.isMergeableParent(stringify(packedParentUid))
    )
  }

  // Single funnel for all the backup deletions triggered by a user or by retention: forgets them
  // from `cache.json.gz` and records them in the journal.
  /**
   * @param {{ _filename: string, jobId?: string, scheduleId?: string }[]} backups the metadata of
   * the deleted backups, or `{ _filename }` alone when it could not be read
   * @param {import('./_backupJournal.mjs').BackupJournalReason} reason
   * @returns {Promise<void>}
   */
  async #forgetVmBackups(backups, reason) {
    await asyncEach(
      Object.entries(
        groupBy(
          backups.map(_ => _._filename),
          dirname
        )
      ),
      ([dir, filenames]) =>
        // will not reject
        this._updateCache(dir + '/cache.json.gz', backups => {
          for (const filename of filenames) {
            debug('removing cache entry', { entry: filename })
            delete backups[filename]
          }
        })
    )

    // will not reject
    await writeBackupJournalEntries(
      this._handler,
      backups.map(({ _filename, jobId, scheduleId }) => ({
        event: 'del',
        vmUuid: basename(dirname(_filename)),
        filename: _filename,
        who: jobId === undefined ? undefined : { jobId, scheduleId },
        reason,
      })),
      { dirMode: this._dirMode }
    )
  }

  /**
   * @param {object[]} backups metadata of the backups to delete
   * @param {object} [opts]
   * @param {import('./_backupJournal.mjs').BackupJournalReason} [opts.reason] what triggered the
   * deletion, as recorded in the journal
   */
  async deleteDeltaVmBackups(backups, { reason = 'retention', immediate = false } = {}) {
    // this will delete the json, unused VHDs will be detected by `cleanVm`
    await deleteDeltaVmBackupFiles(
      this._handler,
      backups.map(({ _filename }) => ({ metadataPath: _filename }))
    )

    await this.#forgetVmBackups(backups, reason)

    if (immediate) {
      return this.#mergeVmDirsAfterDelete(backups)
    }

    return new Set()
  }

  // group by VM backup dir so multiple disks/backups deleted for the same
  // VM in one call trigger a single merge, not one per backup
  async #mergeVmDirsAfterDelete(backups) {
    const dirs = new Set(backups.map(({ _filename }) => dirname(_filename)))
    const mergedDirs = new Set()
    await Task.run(
      {
        properties: {
          name: 'clean VM',
          total: dirs.size,
        },
      },
      async () => {
        let done = 0

        await asyncEach(
          dirs,
          async dir => {
            await Task.run(
              {
                properties: {
                  name: `clean VM dir: ${dir}`,
                },
              },
              async () => {
                try {
                  await this.cleanVm(dir, {
                    remove: true,
                    merge: true,
                    logInfo: Task.info,
                    logWarn: Task.warning,
                  })
                  mergedDirs.add(dir)
                } catch (error) {
                  Task.warning('failed to merge VM backup chain after immediate delete', { error, path: dir })
                  throw error
                }
              }
            )
            done++
            Task.set('progress', Math.round((done / dirs.size) * 100))
          },
          { concurrency: 2, stopOnError: false }
        )
      }
    )

    return mergedDirs
  }

  async deleteMetadataBackup(backupId) {
    await deleteMetadataBackupFiles(this._handler, backupId)
  }

  async deleteOldMetadataBackups(dir, retention) {
    const handler = this.handler
    let list = await handler.list(dir)
    list.sort()
    list = list.filter(timestamp => /^\d{8}T\d{6}Z$/.test(timestamp)).slice(0, -retention)
    await asyncMapSettled(list, timestamp => handler.rmtree(`${dir}/${timestamp}`))
  }

  /**
   * @param {object[]} backups metadata of the backups to delete
   * @param {object} [opts]
   * @param {import('./_backupJournal.mjs').BackupJournalReason} [opts.reason] what triggered the
   * deletion, as recorded in the journal
   */
  async deleteFullVmBackups(backups, { reason = 'retention' } = {}) {
    await asyncMapSettled(backups, async ({ _filename, xva }) => {
      try {
        await deleteFullVmBackupFiles(this._handler, [{ metadataPath: _filename, xva }])
      } catch (error) {
        warn('error while removing full vm backup', { error, filename: _filename, failedPath: error.path })
        throw error
      }
    })

    await this.#forgetVmBackups(backups, reason)
  }

  deleteVmBackup(file) {
    return this.deleteVmBackups([file])
  }

  async deleteVmBackups(files, { immediate = false } = {}) {
    const metadataOrNull = await asyncMap(files, async file => {
      try {
        return await this.readVmBackupMetadata(file)
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File was already removed (e.g. by coalescing); clean the stale cache entry
          warn('backup metadata not found, removing stale cache entry', { file })
          return null
        }
        throw error
      }
    })

    const presentMetadata = []
    const missingFiles = []
    for (let i = 0; i < files.length; i++) {
      if (metadataOrNull[i] === null) {
        missingFiles.push({ _filename: files[i] })
      } else {
        presentMetadata.push(metadataOrNull[i])
      }
    }

    const { delta, full, ...others } = groupBy(presentMetadata, 'mode')

    const unsupportedModes = Object.keys(others)
    if (unsupportedModes.length !== 0) {
      throw new Error('no deleter for backup modes: ' + unsupportedModes.join(', '))
    }
    const promises = []
    let deltaBackupDirsPromise = Promise.resolve(new Set())
    if (delta !== undefined) {
      deltaBackupDirsPromise = this.deleteDeltaVmBackups(delta, { reason: 'user', immediate })
      promises.push(deltaBackupDirsPromise)
    }
    if (full !== undefined) {
      promises.push(this.deleteFullVmBackups(full, { reason: 'user' }))
    }
    if (missingFiles.length) {
      promises.push(this.#forgetVmBackups(missingFiles, 'user'))
    }
    await Promise.all(promises)

    const deltaBackupDirs = await deltaBackupDirsPromise
    const otherBackupDirs = new Set(files.map(file => dirname(file)).filter(dir => !deltaBackupDirs.has(dir)))

    await Task.run(
      {
        properties: {
          name: 'clean VM of non-delta backups(full backups, ...) dirs',
          total: otherBackupDirs.size,
        },
      },
      async () => {
        let processed = 0
        await asyncEach(
          otherBackupDirs,
          async dir => {
            await Task.run(
              {
                properties: {
                  name: `clean VM dir: ${dir}`,
                },
              },
              async () => {
                // - don't merge in main process, unused VHDs will be merged in the next backup run
                try {
                  await this.cleanVm(dir, { remove: true, logWarn: warn })
                } catch (error) {
                  Task.warning('failed to remove VM backup', { error, path: dir })
                  throw error
                }
              }
            )
            processed++
            Task.set('progress', Math.round((processed / otherBackupDirs.size) * 100))
          },
          { concurrency: 2, stopOnError: false }
        )
      }
    )
  }

  useVhdDirectory() {
    return this.handler.getConfig('useVhdDirectory')
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
    const handler = this._handler
    const vmsUuids = []
    try {
      await asyncEach(await handler.list(BACKUP_DIR), async entry => {
        // ignore hidden and lock files
        if (entry[0] !== '.' && !entry.endsWith('.lock')) {
          vmsUuids.push(entry)
        }
      })
    } catch (error) {
      // remote without any VM backup are ok
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    return vmsUuids
  }

  async listAllVmBackups() {
    const vmsUuids = await this.listAllVms()
    const backups = { __proto__: null }
    await asyncEach(vmsUuids, async vmUuid => {
      const vmBackups = await this.listVmBackups(vmUuid)
      if (vmBackups.length !== 0) {
        backups[vmUuid] = vmBackups
      }
    })
    return backups
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
    return `${BACKUP_DIR}/${vmUuid}/cache.json.gz`
  }

  async _readCache(path) {
    return readBackupCache(this.handler, path, warn)
  }

  _updateCache = synchronized.withKey()(this._updateCache)
  // eslint-disable-next-line no-dupe-class-members
  async _updateCache(path, fn) {
    // immutable remote can't use any caching
    // since the cache file may be non modifiable, and would then stay billed forever
    if (this._handler.isImmutable()) {
      return
    }

    const cache = await this._readCache(path)
    if (cache !== undefined) {
      fn(cache)

      await this._writeCache(path, cache)
    } else {
      const regenerated = await this.#getCacheableDataListVmBackups(dirname(path))
      if (regenerated !== undefined) {
        await this._writeCache(path, regenerated)
      }
    }
  }

  async _writeCache(path, data) {
    return writeBackupCache(this.handler, path, data, warn)
  }

  async #getCacheableDataListVmBackups(dir) {
    debug('generating cache', { path: dir })

    const handler = this._handler
    const backups = {}

    try {
      const files = await handler.list(dir, {
        filter: isMetadataFile,
        prependDir: true,
      })
      await asyncMap(files, async file => {
        try {
          const metadata = await this.readVmBackupMetadata(file)
          // inject an id usable by importVmBackupNg()
          metadata.id = metadata._filename
          backups[file] = metadata
        } catch (error) {
          warn(`can't read vm backup metadata`, { error, file, dir })
        }
      })
      return backups
    } catch (error) {
      let code
      if (error == null || ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')) {
        throw error
      }
    }
  }

  // use _ to mark this method as private by convention
  // since we decorate it with synchronized.withKey in the constructor
  // and # function are not writeable.
  //
  // read the list of backup of a Vm from cache
  // if cache is missing  or broken  => regenerate it and return

  async _readCacheListVmBackups(vmUuid) {
    // immutable remote can't use any caching
    // since the cache file may be non modifiable
    if (this._handler.isImmutable()) {
      return this.#getCacheableDataListVmBackups(`${BACKUP_DIR}/${vmUuid}`)
    }
    const path = this.#getVmBackupsCache(vmUuid)

    const cache = await this._readCache(path)
    if (cache !== undefined) {
      debug('found VM backups cache, using it', { path })
      return cache
    }

    // nothing cached, or cache unreadable => regenerate it
    const backups = await this.#getCacheableDataListVmBackups(`${BACKUP_DIR}/${vmUuid}`)
    if (backups === undefined) {
      return
    }

    await this._writeCache(path, backups)

    return backups
  }

  async listVmBackups(vmUuid, predicate) {
    const backups = []
    const cached = await this._readCacheListVmBackups(vmUuid)

    if (cached === undefined) {
      return []
    }

    Object.values(cached).forEach(metadata => {
      if (predicate === undefined || predicate(metadata)) {
        backups.push(metadata)
      }
    })

    return backups.sort(compareTimestamp)
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

  // read the backup events which happened on this remote after `cursor`, oldest first
  /**
   * @param {string} [cursor] path of the last entry already read, exclusive
   * @param {object} [opts]
   * @param {boolean} [opts.mustExist] whether a missing journal directory should throw
   * @returns {Promise<import('./_backupJournal.mjs').BackupJournalEntry[]>}
   */
  async readBackupJournal(cursor, opts) {
    return readBackupJournal(this._handler, cursor, opts)
  }

  // Same as `readBackupJournal()`, with the current metadata of the added and changed backups
  // attached, so that a listing can be brought up to date from the result alone, in a single
  // round-trip for a caller which is not on this host.
  //
  // The metadata is read back from the repository instead of being carried by the journal, so that
  // the result always reflects the current content of the file, e.g. the size a merge updated.
  /**
   * @param {string} [cursor] path of the last entry already read, exclusive
   * @param {object} [opts]
   * @param {boolean} [opts.mustExist] whether a missing journal directory should throw
   * @returns {Promise<{
   *   events: import('./formatVmBackups.mjs').ResolvedJournalEvent[]
   *   cursor: string | undefined
   * }>} the cursor to pass on the next call: unchanged when nothing new was read
   */
  async readBackupJournalEvents(cursor, opts) {
    const entries = await this.readBackupJournal(cursor, opts)

    // the entries are oldest first, therefore the last event of a backup is its current state: a
    // backup which was written then deleted costs no metadata read at all, and one which was
    // rewritten several times costs a single one
    const lastEventByFilename = new Map()
    entries.forEach(({ event, filename, vmUuid }, index) => {
      if (!isKnownJournalEvent(event)) {
        warn('ignoring unsupported journal event', { event, filename })
        return
      }

      // the entries are written by several code paths which don't agree on the leading slash
      lastEventByFilename.set(normalize(filename), { event, index, vmUuid })
    })

    // the index, in `entries`, of the earliest one whose metadata could not be read: the cursor is
    // clamped to just before it, so that the next call retries it instead of skipping it
    let minFailedIndex = entries.length

    // there is at most one event per backup left, therefore they can be resolved concurrently and
    // the order `asyncEach` returns them in does not matter
    const events = []
    await asyncEach(lastEventByFilename, async ([filename, { event, index, vmUuid }]) => {
      if (event === 'del') {
        events.push({ event, vmUuid, filename })
        return
      }

      let metadata
      try {
        metadata = await this.readVmBackupMetadata(filename)
      } catch (error) {
        if (error.code === 'ENOENT') {
          // the metadata is gone while its last event says it should be there: it was deleted
          // without being journaled, e.g. by a user or a third party tool directly on the
          // repository. Report it as a deletion instead of waiting for the next full rebuild.
          debug('reporting a backup whose metadata is missing as deleted', { event, filename })
          events.push({ event: 'del', vmUuid, filename })
          return
        }

        // One unreadable metadata must not fail the whole read: the caller would forget the
        // repository and list it in full on every call for as long as the file stays unreadable,
        // which is much more expensive than what this read costs.
        //
        // Its event is kept behind the cursor instead of being dropped, so that the next read
        // tries it again: a transient failure costs nothing, and a permanent one only widens the
        // window of a journal read, until the caller rebuilds from scratch anyway.
        warn(`can't read the metadata of a backup an event is about`, { error, event, filename })
        if (index < minFailedIndex) {
          minFailedIndex = index
        }
        return
      }

      events.push({ event, vmUuid, filename, metadata })
    })

    // advance the cursor up to the last successfully read entry, oldest first: unchanged when
    // nothing was read at all, or when the very first entry already failed
    if (minFailedIndex > 0) {
      cursor = entries[minFailedIndex - 1]._filename
    }

    return { events, cursor }
  }

  async writeVmBackupMetadata(vmUuid, metadata) {
    const path = `/${BACKUP_DIR}/${vmUuid}/${formatFilenameDate(metadata.timestamp)}.json`

    await this.handler.outputFile(path, JSON.stringify(metadata), {
      dirMode: this._dirMode,
    })

    // will not throw
    await writeBackupJournalEntry(
      this._handler,
      {
        event: 'add',
        vmUuid,
        filename: path,
        who: { jobId: metadata.jobId, scheduleId: metadata.scheduleId },
        reason: 'backup',
      },
      { dirMode: this._dirMode }
    )

    // will not throw
    await this._updateCache(this.#getVmBackupsCache(vmUuid), backups => {
      debug('adding cache entry', { entry: path })
      backups[path] = {
        ...metadata,

        // these values are required in the cache
        _filename: path,
        id: path,
      }
    })

    return path
  }

  async writeVhd(path, disk, { validator = noop, writeBlockConcurrency, uuid, parentUuid, parentPath } = {}) {
    const handler = this._handler

    if (this.useVhdDirectory()) {
      return await writeToVhdDirectory({
        disk,
        target: {
          handler,
          path,
          concurrency: writeBlockConcurrency,
          validator,
          compression: handler.getConfig('compressionType') ?? 'brotli', // compatibility layer
          uuid,
          parentUuid,
          parentPath,
        },
      })
    } else {
      const stream = await toVhdStream(disk, { uuid, parentUuid, parentPath })
      const size = await this.outputStream(path, stream, {
        validator,
        // no checksum for VHDs, because they will be invalidated by
        // merges and chains
        checksum: false,
      })
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

  // open the  hierarchy of ancestors until we find a full one
  async _createVhdDisk(handler, path, { useChain }) {
    let disk
    if (useChain) {
      disk = await openDiskChain({ handler, path })
    } else {
      disk = new RemoteVhdDisk({ handler, path })
      await disk.init()
    }
    disk = new ReadAhead(disk)
    return disk
  }

  async readIncrementalVmBackup(metadata, ignoredVdis, { useChain = true } = {}) {
    const handler = this._handler
    const { vbds, vhds, vifs, vm, vmSnapshot, vtpms } = metadata
    const dir = dirname(metadata._filename)
    const vdis = ignoredVdis === undefined ? metadata.vdis : pickBy(metadata.vdis, vdi => !ignoredVdis.has(vdi.uuid))
    const disks = {}
    await asyncMapSettled(Object.keys(vdis), async ref => {
      delete vdis[ref].baseVdi
      disks[ref] = await this._createVhdDisk(handler, join(dir, vhds[ref]), { useChain })
    })

    return {
      disks,
      vbds,
      vdis,
      version: '1.0.0',
      vifs,
      vm: { ...vm, suspend_VDI: vmSnapshot.suspend_VDI },
      vtpms,
    }
  }

  readFullVmBackup(metadata) {
    return this._handler.createReadStream(resolve('/', dirname(metadata._filename), metadata.xva))
  }

  async readVmBackupMetadata(path) {
    let json
    let isImmutable = false
    let remoteIsImmutable = false
    // if the remote is immutable, check if this metadata is also immutable
    try {
      // this file is not encrypted
      await this._handler._readFile(IMMUTABILITY_METADATA_FILENAME)
      remoteIsImmutable = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    try {
      // this will trigger an EPERM error if the file is immutable
      json = await this.handler.readFile(path, { flag: 'r+' })
      // s3 handler don't respect flags
    } catch (err) {
      // retry without triggering immutability check ,only on immutable remote
      if (err.code === 'EPERM' && remoteIsImmutable) {
        isImmutable = true
        json = await this._handler.readFile(path, { flag: 'r' })
      } else {
        throw err
      }
    }
    // _filename is a private field used to compute the backup id
    //
    // it's enumerable to make it cacheable
    const metadata = { ...JSON.parse(json), _filename: path, isImmutable }

    // backups created on XenServer < 7.1 via JSON in XML-RPC transports have boolean values encoded as integers, which make them unusable with more recent XAPIs
    if (typeof metadata.vm.is_a_template === 'number') {
      const properties = {
        vbds: ['bootable', 'unpluggable', 'storage_lock', 'empty', 'currently_attached'],
        vdis: [
          'sharable',
          'read_only',
          'storage_lock',
          'managed',
          'missing',
          'is_a_snapshot',
          'allow_caching',
          'metadata_latest',
        ],
        vifs: ['currently_attached', 'MAC_autogenerated'],
        vm: ['is_a_template', 'is_control_domain', 'ha_always_run', 'is_a_snapshot', 'is_snapshot_from_vmpp'],
        vmSnapshot: ['is_a_template', 'is_control_domain', 'ha_always_run', 'is_snapshot_from_vmpp'],
      }

      function fixBooleans(obj, properties) {
        properties.forEach(property => {
          if (typeof obj[property] === 'number') {
            obj[property] = obj[property] === 1
          }
        })
      }

      for (const [key, propertiesInKey] of Object.entries(properties)) {
        const value = metadata[key]
        if (value !== undefined) {
          // some properties of the metadata are collections indexed by the opaqueRef
          const isCollection = Object.keys(value).some(subKey => subKey.startsWith('OpaqueRef:'))
          if (isCollection) {
            Object.values(value).forEach(subValue => fixBooleans(subValue, propertiesInKey))
          } else {
            fixBooleans(value, propertiesInKey)
          }
        }
      }
    }
    return metadata
  }

  #computeTotalBackupSizeRecursively(backups) {
    return reduce(
      backups,
      (prev, backup) => {
        const _backup = Array.isArray(backup) ? this.#computeTotalBackupSizeRecursively(backup) : backup
        return {
          onDisk: prev.onDisk + (_backup.onDisk ?? _backup.size),
        }
      },
      { onDisk: 0 }
    )
  }

  async getTotalVmBackupSize() {
    return this.#computeTotalBackupSizeRecursively(await this.listAllVmBackups())
  }

  async getTotalBackupSize() {
    const vmBackupSize = await this.getTotalVmBackupSize()
    // @TODO: add `getTotalXoBackupSize` and `getTotalPoolBackupSize` once `size` is implemented by fs
    return vmBackupSize
  }
}

// journal the metadata files `cleanVm` removed and rewrote
//
// `removedFiles` also lists the files which would have been removed if `remove` were set, and files
// which are not backup metadata (stray xva, checksums, …), hence the filtering.
/**
 * @param {RemoteAdapter} adapter
 * @param {string} vmBackupPath directory of the cleaned VM, e.g. `xo-vm-backups/<vmUuid>`
 * @param {object} cleanOpts the options `cleanVm()` ran with
 * @param {boolean} [cleanOpts.remove] whether the removals were actually applied
 * @param {object} result the result of `cleanVm()`
 * @param {string[]} [result.removedFiles]
 * @param {string[]} [result.changedFiles]
 * @returns {Promise<void>}
 */
async function journalCleanVm(adapter, vmBackupPath, { remove }, { removedFiles = [], changedFiles = [] }) {
  const dir = resolve('/', vmBackupPath)
  const vmUuid = basename(dir)
  const isVmMetadata = file => isMetadataFile(file) && dirname(resolve('/', file)) === dir

  const entries = []
  if (remove) {
    for (const filename of new Set(removedFiles.filter(isVmMetadata))) {
      entries.push({ event: 'del', vmUuid, filename, reason: 'clean-vm' })
    }
  }
  for (const filename of new Set(changedFiles.filter(isVmMetadata))) {
    entries.push({ event: 'change', vmUuid, filename, reason: 'merge' })
  }

  // will not reject
  await writeBackupJournalEntries(adapter._handler, entries, { dirMode: adapter._dirMode })
}

Object.assign(RemoteAdapter.prototype, {
  cleanVm(vmBackupPath, opts = {}) {
    const { lock = true, ...cleanOpts } = opts
    const run = async () => {
      const result = await VmBackupDirectory.cleanVm(this._handler, vmBackupPath, cleanOpts)
      await journalCleanVm(this, vmBackupPath, cleanOpts, result)
      return result
    }
    if (lock) {
      return Disposable.use(this._handler.lock(vmBackupPath), run)
    } else {
      return run()
    }
  },
  isValidXva,
})

// File-level-restore methods live in ./_fileRestore.mjs; mix them onto the prototype
// before decorating so decorateMethodsWith can wrap them.
Object.assign(RemoteAdapter.prototype, fileRestoreMethods)

decorateMethodsWith(RemoteAdapter, fileRestoreDecorators)
