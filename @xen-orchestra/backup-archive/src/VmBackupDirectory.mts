import { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { basename, dirname, normalize, resolveFromFile } from '@xen-orchestra/fs/path'
import { resolve } from 'node:path'
import groupBy from 'lodash/groupBy.js'
import reduce from 'lodash/reduce.js'
import { BACKUP_DIR, getVmBackupDir } from './paths.mjs'
import { formatFilenameDate } from './filenameDate.mjs'
import { isMetadataFile } from './backupType.mjs'
import { VmFullBackupArchive } from './VmFullBackupArchive.mjs'
import { VmIncrementalBackupArchive } from './VmIncrementalBackupArchive.mjs'
import { RemoteDiskLineage } from './RemoteDiskLineage.mjs'
import {
  ArchiveCleanOptions,
  BackupCleanOptions,
  CheckResult,
  CleanResult,
  VmBackupInterface,
  PartialBackupMetadata,
  ResolvedBackupCleanOptions,
  SizedBackups,
  StoredBackupMetadata,
  UpdateCache,
  DEFAULT_MERGE_CONCURRENCY,
} from './VmBackup.types.mjs'
import { cleanOrphanDiskDirs } from '@xen-orchestra/backup-archive/disks'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { promisify } from 'node:util'
import zlib from 'node:zlib'
import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

const { debug, info: logInfo, warn: logWarn } = createLogger('xo:backup-archive')

const FILES_TO_KEEP = ['cache.json.gz', 'vdis']

const IMMUTABILITY_METADATA_FILENAME = '/immutability.json'

const noop = (): void => {}

const compareTimestamp = (a: { timestamp: number }, b: { timestamp: number }): number => a.timestamp - b.timestamp

export class VmBackupDirectory implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  files: Array<string> = new Array()
  orphans: Set<string> = new Set()
  backupArchives: Map<string, VmBackupInterface> = new Map()
  opts: ResolvedBackupCleanOptions

  // Cached result of the last check() call; invalidated by init()
  #checkResult: (CheckResult & { orphans: string[]; linked: string[] }) | undefined = undefined
  #uniqueLineages: Map<string, RemoteDiskLineage> | undefined = undefined

  // Set by #checkCacheCount(): the on-disk cache did not match the archives found
  // on disk, so clean() must regenerate it even when nothing was merged/removed.
  #cacheOutOfSync = false

  constructor(
    handler: RemoteHandlerAbstract,
    vmBackupPath: string,
    opts: BackupCleanOptions = {
      fix: true,
      merge: false,
      remove: false,
      logInfo,
      logWarn,
    }
  ) {
    this.handler = handler
    this.rootPath = vmBackupPath
    this.opts = {
      ...opts,
      fix: opts.fix ?? true,
      merge: opts.merge ?? false,
      remove: opts.remove ?? false,
      logInfo: opts.logInfo ?? logInfo,
      logWarn: opts.logWarn ?? logWarn,
    }
  }

  static getVmBackupsCachePath(vmUuid: string): string {
    return `${getVmBackupDir(vmUuid)}/cache.json.gz`
  }

  static async readCache(handler: RemoteHandlerAbstract, path: string): Promise<Record<string, unknown> | undefined> {
    try {
      return JSON.parse((await gunzip(await handler.readFile(path))).toString())
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        logWarn('failed to read cache', { error, path })
      }
    }
  }

  static async writeCache(handler: RemoteHandlerAbstract, path: string, data: Record<string, unknown>): Promise<void> {
    try {
      await handler.writeFile(path, await gzip(JSON.stringify(data)), { flags: 'w' })
    } catch (error) {
      logWarn('failed to write cache', { error, path })
    }
  }

  // Read-modify-write of a cache file. Lock-free: callers that need atomicity
  // (e.g. RemoteAdapter) wrap this with their own per-key mutex.
  //
  // `regenerate` is mandatory because both answers are dangerous by default: with
  // `true` a missing cache is rebuilt from the directory listing (a missing cache is
  // not an empty cache), with `false` a missing cache is left missing. The mutation
  // `fn` is only ever applied to an existing cache.
  static async updateCache(
    handler: RemoteHandlerAbstract,
    path: string,
    fn: (cache: Record<string, unknown>) => void,
    { regenerate }: { regenerate: boolean }
  ): Promise<void> {
    const cache = await VmBackupDirectory.readCache(handler, path)
    if (cache !== undefined) {
      fn(cache)
      await VmBackupDirectory.writeCache(handler, path, cache)
    } else if (regenerate) {
      const regenerated = await VmBackupDirectory.getCacheableDataListVmBackups(handler, dirname(path))
      if (regenerated !== undefined) {
        await VmBackupDirectory.writeCache(handler, path, regenerated)
      }
    }
  }

  // Remove entries from the per-VM cache files for the given backups, grouping by
  // directory so each cache file is updated once. `updateCache` is injected so the
  // caller controls locking.
  static async removeBackupsFromCache(updateCache: UpdateCache, backups: Array<{ _filename: string }>): Promise<void> {
    await asyncEach(
      Object.entries(
        groupBy(
          backups.map(backup => backup._filename),
          dirname
        )
      ),
      ([dir, filenames]) =>
        updateCache(`${dir}/cache.json.gz`, cache => {
          for (const filename of filenames) {
            debug('removing cache entry', { entry: filename })
            delete cache[filename]
          }
        })
    )
  }

  // Read one backup metadata file. On an immutable remote, the read is retried
  // without triggering the immutability check and the result is flagged as immutable.
  // Also repairs boolean values stored as integers by XenServer < 7.1 XML-RPC transports.
  static async readVmBackupMetadata(handler: RemoteHandlerAbstract, path: string): Promise<StoredBackupMetadata> {
    let json: Buffer | string
    let isImmutable = false
    let remoteIsImmutable = false
    // if the remote is immutable, check if this metadata is also immutable
    try {
      // this file is not encrypted
      // _readFile is an internal handler method not exposed on the public type
      await (handler as any)._readFile(IMMUTABILITY_METADATA_FILENAME)
      remoteIsImmutable = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    try {
      // this will trigger an EPERM error if the file is immutable
      // `flag` (not `flags`) is intentional: it is passed through to fs.readFile
      json = await handler.readFile(path, { flag: 'r+' } as any)
      // s3 handler don't respect flags
    } catch (err) {
      // retry without triggering immutability check ,only on immutable remote
      if (err.code === 'EPERM' && remoteIsImmutable) {
        isImmutable = true
        json = await handler.readFile(path, { flag: 'r' } as any)
      } else {
        throw err
      }
    }
    // _filename is a private field used to compute the backup id
    //
    // it's enumerable to make it cacheable
    const metadata: StoredBackupMetadata = { ...JSON.parse(json.toString()), _filename: path, isImmutable }

    // backups created on XenServer < 7.1 via JSON in XML-RPC transports have boolean values encoded as integers, which make them unusable with more recent XAPIs
    if (typeof metadata.vm.is_a_template === 'number') {
      const properties: Record<string, string[]> = {
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

      // `any` here is deliberate: this walks raw XAPI records of several unrelated shapes
      // (vm, vbds, vdis, vifs, vmSnapshot), indexed by arbitrary property names
      function fixBooleans(obj: any, properties: string[]) {
        properties.forEach(property => {
          if (typeof obj[property] === 'number') {
            obj[property] = obj[property] === 1
          }
        })
      }

      for (const [key, propertiesInKey] of Object.entries(properties)) {
        const value = (metadata as Record<string, any>)[key]
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

  // Write a VM backup metadata file and add its entry to the per-VM cache.
  // `updateCache` is injected so the caller controls locking.
  static async writeVmBackupMetadata(
    handler: RemoteHandlerAbstract,
    vmUuid: string,
    metadata: PartialBackupMetadata,
    {
      dirMode,
      updateCache,
    }: {
      dirMode?: number
      updateCache: UpdateCache
    }
  ): Promise<string> {
    // formatFilenameDate is typed as taking a Date; it coerces internally, so wrapping the
    // timestamp is equivalent and keeps the call typed
    const path = `/${getVmBackupDir(vmUuid)}/${formatFilenameDate(new Date(metadata.timestamp))}.json`

    await handler.outputFile(path, JSON.stringify(metadata), { dirMode })

    // will not throw
    await updateCache(VmBackupDirectory.getVmBackupsCachePath(vmUuid), backups => {
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

  // Build the list of VM backups by reading every metadata file in `dir`.
  // Returns undefined if the directory does not exist.
  static async getCacheableDataListVmBackups(
    handler: RemoteHandlerAbstract,
    dir: string
  ): Promise<Record<string, StoredBackupMetadata> | undefined> {
    debug('generating cache', { path: dir })

    const backups: Record<string, StoredBackupMetadata> = {}

    try {
      const files = await handler.list(dir, {
        filter: isMetadataFile,
        prependDir: true,
      })
      // @todo unbounded fan-out: a VM with a long retention makes this open one read per
      // retained backup at once. Moved as-is from RemoteAdapter; should become
      // `asyncEach(..., { concurrency: DEFAULT_REMOVE_CONCURRENCY })` in a dedicated change.
      await asyncMap(files, async (file: string): Promise<void> => {
        try {
          const metadata = await VmBackupDirectory.readVmBackupMetadata(handler, file)
          // inject an id usable by importVmBackupNg()
          metadata.id = metadata._filename
          backups[file] = metadata
        } catch (error) {
          logWarn(`can't read vm backup metadata`, { error, file, dir })
        }
      })
      return backups
    } catch (error) {
      let code: string | undefined
      if (error == null || ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')) {
        throw error
      }
    }
  }

  // Read the list of a VM's backups from cache, regenerating (and rewriting) it if
  // missing or unreadable. Immutable remotes bypass the cache. Lock-free: callers
  // that need to serialize regeneration wrap this with their own per-key mutex.
  static async readCacheListVmBackups(
    handler: RemoteHandlerAbstract,
    vmUuid: string
  ): Promise<Record<string, StoredBackupMetadata> | undefined> {
    // immutable remote can't use any caching
    // since the cache file may be non modifiable
    if (handler.isImmutable()) {
      return VmBackupDirectory.getCacheableDataListVmBackups(handler, getVmBackupDir(vmUuid))
    }
    const path = VmBackupDirectory.getVmBackupsCachePath(vmUuid)

    const cache = await VmBackupDirectory.readCache(handler, path)
    if (cache !== undefined) {
      debug('found VM backups cache, using it', { path })
      // the cache file is written from getCacheableDataListVmBackups(); its entries are
      // metadata, but nothing on disk guarantees it, hence the assertion
      return cache as Record<string, StoredBackupMetadata>
    }

    // nothing cached, or cache unreadable => regenerate it
    const backups = await VmBackupDirectory.getCacheableDataListVmBackups(handler, getVmBackupDir(vmUuid))
    if (backups === undefined) {
      return
    }

    await VmBackupDirectory.writeCache(handler, path, backups)

    return backups
  }

  // Sorted, optionally filtered list of a VM's backups. `readCacheListVmBackups` is
  // injected so the caller can supply its locked variant.
  static async listVmBackups(
    readCacheListVmBackups: (vmUuid: string) => Promise<Record<string, StoredBackupMetadata> | undefined>,
    vmUuid: string,
    predicate?: (metadata: StoredBackupMetadata) => boolean
  ): Promise<StoredBackupMetadata[]> {
    const backups: StoredBackupMetadata[] = []
    const cached = await readCacheListVmBackups(vmUuid)

    if (cached === undefined) {
      return []
    }

    for (const metadata of Object.values(cached)) {
      if (predicate === undefined || predicate(metadata)) {
        backups.push(metadata)
      }
    }

    return backups.sort(compareTimestamp)
  }

  // Delete incremental backups: remove the metadata files (unused VHDs are detected
  // later by cleanVm) and drop their cache entries. `updateCache` is injected (locked).
  static async deleteDeltaVmBackups(
    handler: RemoteHandlerAbstract,
    backups: Array<{ _filename: string }>,
    { updateCache }: { updateCache: UpdateCache }
  ): Promise<void> {
    // this will delete the json, unused VHDs will be detected by `cleanVm`
    await asyncMapSettled(backups, ({ _filename }) => handler.unlink(_filename))

    await VmBackupDirectory.removeBackupsFromCache(updateCache, backups)
  }

  // Delete full backups: remove the metadata, the XVA and its checksum, then drop
  // their cache entries. `updateCache` is injected (locked).
  static async deleteFullVmBackups(
    handler: RemoteHandlerAbstract,
    backups: Array<{ _filename: string; xva: string }>,
    { updateCache }: { updateCache: UpdateCache }
  ): Promise<void> {
    await asyncMapSettled(backups, ({ _filename, xva }) =>
      Promise.all([
        handler.unlink(_filename).catch((error: any) => {
          logWarn('error while removing full vm backup metadata', { error, filename: _filename })
          if (error.code !== 'ENOENT') throw error
        }),
        handler.unlink(resolveFromFile(_filename, xva)).catch((error: any) => {
          logWarn('error while removing full vm backup file', { error, filename: _filename })
          if (error.code !== 'ENOENT') throw error
        }),
        handler.unlink(resolveFromFile(_filename, `${xva}.checksum`)).catch((error: any) => {
          // checksum can be missing , it's not an issue
          if (error.code !== 'ENOENT') throw error
        }),
      ])
    )

    await VmBackupDirectory.removeBackupsFromCache(updateCache, backups)
  }

  // Delete a set of VM backups by metadata path: dispatch to the delta/full deleters,
  // clean stale cache entries for already-removed files, then run cleanVm per directory.
  // `updateCache` and `cleanVm` are injected so the facade keeps ownership of locking.
  static async deleteVmBackups(
    handler: RemoteHandlerAbstract,
    files: string[],
    {
      updateCache,
      cleanVm,
    }: {
      updateCache: UpdateCache
      cleanVm: (dir: string, opts: object) => Promise<unknown>
    }
  ): Promise<void> {
    // @todo unbounded fan-out, as above: one concurrent metadata read per file to delete
    const metadataOrNull = await asyncMap(files, async (file: string): Promise<StoredBackupMetadata | null> => {
      try {
        return await VmBackupDirectory.readVmBackupMetadata(handler, file)
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File was already removed (e.g. by coalescing); clean the stale cache entry
          logWarn('backup metadata not found, removing stale cache entry', { file })
          return null
        }
        throw error
      }
    })

    const presentMetadata: StoredBackupMetadata[] = []
    const missingFiles: Array<{ _filename: string }> = []
    for (let i = 0; i < files.length; i++) {
      const metadata = metadataOrNull[i]
      if (metadata === null) {
        missingFiles.push({ _filename: files[i] })
      } else {
        presentMetadata.push(metadata)
      }
    }

    const { delta, full, ...others } = groupBy(presentMetadata, 'mode')

    const unsupportedModes = Object.keys(others)
    if (unsupportedModes.length !== 0) {
      throw new Error('no deleter for backup modes: ' + unsupportedModes.join(', '))
    }
    const promises: Array<Promise<void>> = []
    if (delta !== undefined) {
      promises.push(VmBackupDirectory.deleteDeltaVmBackups(handler, delta, { updateCache }))
    }
    if (full !== undefined) {
      // `xva` is optional on the metadata type, but it is always set when `mode === 'full'`.
      // Expressing that needs a discriminated union (FullBackupMetadata / DeltaBackupMetadata),
      // which also means reworking this groupBy dispatch — left for a dedicated change.
      promises.push(VmBackupDirectory.deleteFullVmBackups(handler, full as any, { updateCache }))
    }
    if (missingFiles.length) {
      promises.push(VmBackupDirectory.removeBackupsFromCache(updateCache, missingFiles))
    }
    await Promise.all(promises)

    await asyncMap(new Set(files.map((file: string) => dirname(file))), (dir: string) =>
      // - don't merge in main process, unused VHDs will be merged in the next backup run
      // - don't error in case this fails:
      //   - if lock is already being held, a backup is running and cleanVm will be ran at the end
      //   - otherwise, there is nothing more we can do, orphan file will be cleaned in the future
      cleanVm(dir, { remove: true, logWarn }).catch(noop)
    )
  }

  // List the VM UUIDs that have a backup directory, ignoring hidden and lock files.
  static async listAllVms(handler: RemoteHandlerAbstract): Promise<string[]> {
    const vmsUuids: string[] = []
    try {
      await asyncEach(await handler.list(BACKUP_DIR), async (entry: string) => {
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

  // Map of vmUuid -> its backups, for every VM on the remote. `listVmBackups` is
  // injected so the caller supplies its locked, cache-backed variant.
  static async listAllVmBackups(
    handler: RemoteHandlerAbstract,
    listVmBackups: (vmUuid: string) => Promise<StoredBackupMetadata[]>
  ): Promise<Record<string, StoredBackupMetadata[]>> {
    const vmsUuids = await VmBackupDirectory.listAllVms(handler)
    const backups: Record<string, StoredBackupMetadata[]> = Object.create(null)
    await asyncEach(vmsUuids, async (vmUuid: string) => {
      const vmBackups = await listVmBackups(vmUuid)
      if (vmBackups.length !== 0) {
        backups[vmUuid] = vmBackups
      }
    })
    return backups
  }

  // Accepts either a map of vmUuid -> backups, a list of backups, or a single backup, and
  // recurses into the nested levels.
  static computeTotalBackupSizeRecursively(backups: SizedBackups | SizedBackups[] | Record<string, SizedBackups[]>): {
    onDisk: number
  } {
    return reduce(
      backups,
      (prev: { onDisk: number }, backup: SizedBackups | SizedBackups[]) => {
        const _backup: SizedBackups = Array.isArray(backup)
          ? VmBackupDirectory.computeTotalBackupSizeRecursively(backup)
          : backup
        return {
          // `?? NaN` keeps the pre-existing behaviour: a backup with neither `onDisk` nor
          // `size` poisons the whole total with NaN. Loud and wrong beats a silent 0, which
          // would under-report disk usage — but it should be handled explicitly one day.
          // @todo report such backups instead of returning NaN
          onDisk: prev.onDisk + (_backup.onDisk ?? _backup.size ?? NaN),
        }
      },
      { onDisk: 0 }
    )
  }

  static async getTotalVmBackupSize(
    handler: RemoteHandlerAbstract,
    listVmBackups: (vmUuid: string) => Promise<StoredBackupMetadata[]>
  ): Promise<{ onDisk: number }> {
    return VmBackupDirectory.computeTotalBackupSizeRecursively(
      await VmBackupDirectory.listAllVmBackups(handler, listVmBackups)
    )
  }

  async #readCache(path: string): Promise<Record<string, unknown> | undefined> {
    return VmBackupDirectory.readCache(this.handler, path)
  }

  async #writeCache(path: string, data: Record<string, unknown>): Promise<void> {
    return VmBackupDirectory.writeCache(this.handler, path, data)
  }

  async init() {
    this.files = (await this.handler.list(this.rootPath, { prependDir: true })).map(file => normalize(file))
    this.#checkResult = undefined
    this.#uniqueLineages = new Map()

    for (const fullPath of this.files.filter(path => path.endsWith('.json'))) {
      let metadata: PartialBackupMetadata | undefined = undefined
      try {
        metadata = JSON.parse(await this.handler.readFile(fullPath)) satisfies PartialBackupMetadata
      } catch (error) {
        this.opts.logWarn(`Issue loading ${basename(fullPath)}`)
      }
      if (metadata !== undefined) {
        try {
          const backupArchive = await this.instantiateBackupArchive(fullPath, metadata)
          this.backupArchives.set(fullPath, backupArchive)
        } catch (error) {
          if (error?.code === 'NOT_SUPPORTED') throw error
          this.opts.logWarn(`Issue loading ${metadata.xva ?? metadata.vhds}`, { json: fullPath, backup: metadata })
        }
      }
    }
  }

  getAssociatedFiles({ prefix = false }) {
    const files = this.files.filter(file => FILES_TO_KEEP.some(pattern => file.endsWith(pattern)))
    return prefix ? files : files.map(file => basename(file))
  }

  async check(): Promise<CheckResult & { orphans: string[]; linked: string[] }> {
    await this.#checkCacheCount()

    for (const backupArchive of this.backupArchives.values()) {
      await backupArchive.check()
    }

    // allUsedFiles is used for root-level orphan detection only.
    // Active disk paths are accumulated per-lineage by each archive during check() above.
    const allUsedFiles = new Set<string>([
      ...Array.from(this.backupArchives.values()).flatMap(archive => archive.getAssociatedFiles({ prefix: true })),
      ...this.getAssociatedFiles({ prefix: true }),
    ])

    for (const lineage of this.#uniqueLineages!.values()) {
      await lineage.check()
    }

    const orphans = this.files.filter(file => !allUsedFiles.has(file))
    const linked = Array.from(allUsedFiles)
    this.#checkResult = { isValid: orphans.length === 0, orphans, linked }
    return this.#checkResult
  }

  async clean({
    remove = this.opts.remove ?? false,
    merge = this.opts.merge ?? false,
  }: ArchiveCleanOptions = {}): Promise<CleanResult> {
    // Use cached check result if available, otherwise run check now
    const { orphans } = this.#checkResult ?? (await this.check())

    let cacheNeedsRegen = false
    let someLineageMergedOrShouldBe = false

    // Merge/delete orphan disks in VDI directories covered by archives; collect merged sizes per disk path
    const allMergedSizes = new Map<string, number>()
    await asyncEach(
      Array.from(this.#uniqueLineages!.entries()),
      async ([_vdiDir, lineage]) => {
        const { mergedSizes, removedFiles, merge: hasPendingMerge } = await lineage.clean({ remove, merge })
        if (removedFiles.length > 0) {
          cacheNeedsRegen = true
        }
        if (hasPendingMerge) {
          someLineageMergedOrShouldBe = true
        }
        for (const [diskPath, size] of mergedSizes || []) {
          allMergedSizes.set(diskPath, (allMergedSizes.get(diskPath) ?? 0) + size)
        }
      },
      { concurrency: DEFAULT_MERGE_CONCURRENCY }
    )

    // Delete VDI directories not referenced by any archive
    const coveredDirs = new Set(this.#uniqueLineages!.keys())
    await cleanOrphanDiskDirs(this.handler, this.rootPath, coveredDirs, {
      remove,
      logWarn: this.opts.logWarn,
      logInfo: this.opts.logInfo,
    })

    // Let each archive clean its own files (e.g. remove metadata for incomplete backups)
    // and update metadata with merged sizes if applicable
    await asyncEach(
      Array.from(this.backupArchives.values()),
      async (archive: VmBackupInterface) => {
        const { removedFiles } = await archive.clean({ remove, mergedSizes: allMergedSizes })
        if (removedFiles.length > 0) {
          cacheNeedsRegen = true
        }
      },
      { concurrency: 2 }
    )

    if (allMergedSizes.size > 0 || cacheNeedsRegen || this.#cacheOutOfSync) {
      await this.#regenerateCache()
    }

    // Delete root-level orphan files (stray xva, checksum, json, etc.), skip folders
    if (remove) {
      await asyncEach(
        orphans,
        async (orphan: string) => {
          try {
            await this.handler.unlink(orphan)
          } catch (error) {
            if (error?.code === 'EISDIR') {
              this.opts.logWarn('orphan is a directory, skipping deletion', { path: orphan })
            } else if (error?.code !== 'ENOENT') {
              throw error
            }
          }
        },
        { concurrency: 2 }
      )
    }
    const size = [...allMergedSizes.values()].reduce((total, merged) => total + merged, 0)
    return { removedFiles: orphans, merge: someLineageMergedOrShouldBe, size: size }
  }

  async #checkCacheCount(): Promise<void> {
    const cachePath = `${this.rootPath}/cache.json.gz`
    const existingCache = await this.#readCache(cachePath)
    const actual = existingCache === undefined ? 0 : Object.keys(existingCache).length
    const expected = this.backupArchives.size
    this.#cacheOutOfSync = actual !== expected
    if (this.#cacheOutOfSync) {
      this.opts.logWarn('unexpected number of entries in backup cache', { path: cachePath, actual, expected })
    }
  }

  async #regenerateCache(): Promise<void> {
    const cachePath = `${this.rootPath}/cache.json.gz`
    const cache: Record<string, object> = {}
    for (const [path, archive] of this.backupArchives.entries()) {
      const a = archive as VmFullBackupArchive | VmIncrementalBackupArchive
      cache[path] = { _filename: path, id: path, ...a.metadata }
    }
    await this.#writeCache(cachePath, cache)
  }

  async instantiateBackupArchive(metadataPath: string, metadata: PartialBackupMetadata) {
    let backupArchive: VmBackupInterface
    try {
      if (metadata.mode === 'full') {
        backupArchive = new VmFullBackupArchive(
          this.handler,
          this.rootPath,
          metadataPath,
          metadata,
          resolve('/', this.rootPath, metadata.xva!),
          this.opts
        )
      } else if (metadata.mode === 'delta') {
        const rawDiskPaths = metadata.vhds
        const diskPaths =
          rawDiskPaths !== undefined ? Object.values(rawDiskPaths).map(p => resolve('/', this.rootPath, p)) : []
        backupArchive = new VmIncrementalBackupArchive(
          this.handler,
          this.rootPath,
          metadataPath,
          metadata,
          diskPaths,
          this.opts,
          this.#uniqueLineages
        )
      } else {
        throw new Error(`Mode ${metadata.mode} not supported`)
      }
    } catch (error) {
      this.opts.logWarn(`Error trying to create backupArchive from ${metadataPath}`, { metadata })
      throw new Error(`Error trying to create backupArchive from ${metadataPath}`, { cause: error })
    }
    await backupArchive.init()
    return backupArchive
  }

  /**
   * Creates a fresh instance with the given handler/path/opts, then runs init/check/clean.
   *
   * Does NOT lock: locking is the caller's responsibility, `RemoteAdapter.cleanVm` is the
   * locking entry point. `lock` is still accepted so the signature stays compatible, but it
   * has never had any effect here, so passing it is reported instead of silently ignored.
   */
  static async cleanVm(
    handler: RemoteHandlerAbstract,
    vmBackupPath: string,
    opts: BackupCleanOptions & { lock?: boolean } = {}
  ) {
    const { lock, ...cleanOpts } = opts
    if (lock !== undefined) {
      ;(opts.logWarn ?? logWarn)('VmBackupDirectory.cleanVm does not lock, use RemoteAdapter.cleanVm', {
        vmBackupPath,
      })
    }
    const dir = new VmBackupDirectory(handler, vmBackupPath, cleanOpts)
    await dir.init()
    await dir.check()
    const { merge, size } = await dir.clean({ remove: cleanOpts.remove, merge: cleanOpts.merge })
    return { merge, size }
  }
}
