import { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { basename, dirname, normalize } from '@xen-orchestra/fs/path'
import { resolve } from 'node:path'
import groupBy from 'lodash/groupBy.js'
import { asyncMap } from '@xen-orchestra/async-map'
import { getVmBackupDir } from './paths.mjs'
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
  DEFAULT_MERGE_CONCURRENCY,
} from './VmBackup.types.mjs'
import { cleanOrphanDiskDirs } from '@xen-orchestra/backup-archive/disks'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { promisify } from 'node:util'
import zlib from 'node:zlib'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

const { debug, info: logInfo, warn: logWarn } = createLogger('xo:backup-archive')

const FILES_TO_KEEP = ['cache.json.gz', 'vdis']

const IMMUTABILITY_METADATA_FILENAME = '/immutability.json'

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
  static async updateCache(
    handler: RemoteHandlerAbstract,
    path: string,
    fn: (cache: Record<string, unknown>) => void
  ): Promise<void> {
    const cache = await VmBackupDirectory.readCache(handler, path)
    if (cache !== undefined) {
      fn(cache)
      await VmBackupDirectory.writeCache(handler, path, cache)
    }
  }

  // Remove entries from the per-VM cache files for the given backups, grouping by
  // directory so each cache file is updated once. `updateCache` is injected so the
  // caller controls locking.
  static async removeBackupsFromCache(
    updateCache: (path: string, fn: (cache: Record<string, unknown>) => void) => Promise<void>,
    backups: Array<{ _filename: string }>
  ): Promise<void> {
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
            delete cache[filename]
          }
        })
    )
  }

  // Read one backup metadata file. On an immutable remote, the read is retried
  // without triggering the immutability check and the result is flagged as immutable.
  // Also repairs boolean values stored as integers by XenServer < 7.1 XML-RPC transports.
  static async readVmBackupMetadata(handler: RemoteHandlerAbstract, path: string): Promise<any> {
    let json: any
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
    const metadata: any = { ...JSON.parse(json), _filename: path, isImmutable }

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

      function fixBooleans(obj: any, properties: string[]) {
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

  // Write a VM backup metadata file and add its entry to the per-VM cache.
  // `updateCache` is injected so the caller controls locking.
  static async writeVmBackupMetadata(
    handler: RemoteHandlerAbstract,
    vmUuid: string,
    metadata: any,
    {
      dirMode,
      updateCache,
    }: {
      dirMode?: number
      updateCache: (path: string, fn: (cache: Record<string, unknown>) => void) => Promise<void>
    }
  ): Promise<string> {
    const path = `/${getVmBackupDir(vmUuid)}/${formatFilenameDate(metadata.timestamp)}.json`

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
  ): Promise<Record<string, any> | undefined> {
    debug('generating cache', { path: dir })

    const backups: Record<string, any> = {}

    try {
      const files = await handler.list(dir, {
        filter: isMetadataFile,
        prependDir: true,
      })
      // asyncMap's JSDoc type over-narrows the callback return to the item type; cast to call it freely
      await (asyncMap as any)(files, async (file: string): Promise<void> => {
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
  ): Promise<Record<string, any> | undefined> {
    // immutable remote can't use any caching
    // since the cache file may be non modifiable
    if (handler.isImmutable()) {
      return VmBackupDirectory.getCacheableDataListVmBackups(handler, getVmBackupDir(vmUuid))
    }
    const path = VmBackupDirectory.getVmBackupsCachePath(vmUuid)

    const cache = await VmBackupDirectory.readCache(handler, path)
    if (cache !== undefined) {
      debug('found VM backups cache, using it', { path })
      return cache
    }

    // nothing cached, or cache unreadable => regenerate it
    const backups = await VmBackupDirectory.getCacheableDataListVmBackups(handler, getVmBackupDir(vmUuid))
    if (backups === undefined) {
      return
    }

    // detached async action, will not reject
    void VmBackupDirectory.writeCache(handler, path, backups)

    return backups
  }

  // Sorted, optionally filtered list of a VM's backups. `readCacheListVmBackups` is
  // injected so the caller can supply its locked variant.
  static async listVmBackups(
    readCacheListVmBackups: (vmUuid: string) => Promise<Record<string, any> | undefined>,
    vmUuid: string,
    predicate?: (metadata: any) => boolean
  ): Promise<any[]> {
    const backups: any[] = []
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

    if (allMergedSizes.size > 0 || cacheNeedsRegen) {
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
    if (actual !== expected) {
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
   * The `lock` option is accepted but ignored (locking is the caller's responsibility).
   */
  static async cleanVm(
    handler: RemoteHandlerAbstract,
    vmBackupPath: string,
    opts: BackupCleanOptions & { lock?: boolean } = {}
  ) {
    const { lock: _lock, ...cleanOpts } = opts
    const dir = new VmBackupDirectory(handler, vmBackupPath, cleanOpts)
    await dir.init()
    await dir.check()
    const { merge, size } = await dir.clean({ remove: cleanOpts.remove, merge: cleanOpts.merge })
    return { merge, size }
  }
}
