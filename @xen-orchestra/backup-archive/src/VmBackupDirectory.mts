import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { resolve } from 'node:path'
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
import { cleanOrphanDiskDirs } from '@xen-orchestra/backups/disks'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.mjs'

const { info: logInfo, warn: logWarn } = createLogger('xo:backup-archive')

const FILES_TO_KEEP = ['cache.json.gz', 'vdis']

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
  #remoteAdapter: RemoteAdapter

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
    this.#remoteAdapter = new RemoteAdapter(handler)
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
        } catch (error: any) {
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

    // Merge/delete orphan disks in VDI directories covered by archives; collect merged sizes per disk path
    const allMergedSizes = new Map<string, number>()
    await asyncEach(
      Array.from(this.#uniqueLineages!.entries()),
      async ([_vdiDir, lineage]) => {
        const { mergedSizes, deleted } = await lineage.clean({ remove, merge })
        if (deleted.size > 0) {
          cacheNeedsRegen = true
        }
        for (const [diskPath, size] of mergedSizes) {
          allMergedSizes.set(diskPath, (allMergedSizes.get(diskPath) ?? 0) + size)
        }
      },
      { concurrency: DEFAULT_MERGE_CONCURRENCY }
    )

    // Delete VDI directories not referenced by any archive
    const coveredDirs = new Set(this.#uniqueLineages!.keys())
    await cleanOrphanDiskDirs(this.handler as any, this.rootPath, coveredDirs, {
      remove,
      logWarn: this.opts.logWarn,
      logInfo: this.opts.logInfo,
    })

    // Let each archive clean its own files (e.g. remove metadata for incomplete backups)
    // and update metadata with merged sizes if applicable
    await asyncEach(
      Array.from(this.backupArchives.values()),
      async (archive: VmBackupInterface) => {
        const { removedFiles, merge: didMerge } = await archive.clean({ remove, mergedSizes: allMergedSizes })
        if (removedFiles.length > 0 || didMerge) {
          cacheNeedsRegen = true
        }
      },
      { concurrency: 2 }
    )

    if (cacheNeedsRegen) {
      await this.#regenerateCache()
    }

    // Delete root-level orphan files (stray xva, checksum, json, etc.), skip folders
    if (remove) {
      await asyncEach(
        orphans,
        async (orphan: string) => {
          try {
            await this.handler.unlink(orphan)
          } catch (error: any) {
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

    return { removedFiles: orphans, merge: allMergedSizes.size > 0 }
  }

  async #checkCacheCount(): Promise<void> {
    const cachePath = `${this.rootPath}/cache.json.gz`
    const existingCache = await this.#remoteAdapter._readCache(cachePath)
    const actual = existingCache === undefined ? undefined : Object.keys(existingCache).length
    const expected = this.backupArchives.size
    if (actual !== undefined && actual !== expected) {
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
    await this.#remoteAdapter._writeCache(cachePath, cache)
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
          metadata.xva!,
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
    const { merge } = await dir.clean({ remove: cleanOpts.remove, merge: cleanOpts.merge })
    return { merge }
  }
}
