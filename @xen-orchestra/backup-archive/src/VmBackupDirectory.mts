import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { resolve } from 'node:path'
import { VmFullBackupArchive } from './VmFullBackupArchive.mjs'
import { VmIncrementalBackupArchive } from './VmIncrementalBackupArchive.mjs'
import { RemoteDiskLineage } from './RemoteDiskLineage.mjs'
import {
  BackupCleanOptions,
  VmBackupInterface,
  PartialBackupMetadata,
  ResolvedBackupCleanOptions,
  MergeLimiter,
} from './VmBackup.types.mjs'
import { asyncEach } from '@vates/async-each'

const FILES_TO_KEEP = ['cache.json.gz']

export class VmBackupDirectory implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  files: Array<string> = new Array()
  orphans: Set<string> = new Set()
  backupArchives: Map<string, VmBackupInterface> = new Map()
  diskLineages: Map<string, RemoteDiskLineage> = new Map()
  opts: ResolvedBackupCleanOptions

  // Disk paths still referenced by at least one surviving complete delta backup
  #activeDiskPaths: Set<string> = new Set()
  // Cached result of the last check() call; invalidated by init()
  #checkResult: { orphans: string[]; linked: string[] } | undefined = undefined

  constructor(
    handler: RemoteHandlerAbstract,
    vmBackupPath: string,
    opts: BackupCleanOptions = {
      fix: true,
      merge: false,
      remove: false,
      logInfo: console.info,
      logWarn: console.warn,
    }
  ) {
    this.handler = handler
    this.rootPath = vmBackupPath
    this.opts = {
      ...opts,
      fix: opts.fix ?? true,
      merge: opts.merge ?? false,
      remove: opts.remove ?? false,
      logInfo: opts.logInfo ?? console.info,
      logWarn: opts.logWarn ?? console.warn,
    }
  }

  async init() {
    this.files = (await this.handler.list(this.rootPath, { prependDir: true })).map(file => normalize(file))
    this.#activeDiskPaths = new Set()
    this.#checkResult = undefined

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
          this.opts.logWarn(`Issue loading ${metadata.xva ?? metadata.vhds}`, { json: fullPath, backup: metadata })
        }
      }
    }

    // Build one RemoteDiskLineage per VDI directory (vdis/<jobId>/<vdiUuid>/)
    try {
      const jobDirs = await this.handler.list(`${this.rootPath}/vdis`, {
        prependDir: true,
        ignoreMissing: true,
      })
      for (const jobDir of jobDirs) {
        const vdiDirs = await this.handler.list(jobDir, { prependDir: true })
        for (const vdiDir of vdiDirs) {
          const lineage = new RemoteDiskLineage(this.handler, vdiDir, this.opts)
          await lineage.init()
          this.diskLineages.set(vdiDir, lineage)
        }
      }
    } catch (error) {
      this.opts.logWarn('failed to scan VDI directories', { error })
    }
  }

  getAssociatedFiles({ prefix = false }) {
    const files = this.files.filter(file => FILES_TO_KEEP.some(pattern => file.endsWith(pattern)))
    return prefix ? files : files.map(file => basename(file))
  }

  async check() {
    for (const backupArchive of this.backupArchives.values()) {
      await backupArchive.check()
    }

    // Recompute active disk paths from complete delta archives only.
    // Disks from incomplete backups are not protected so they can be cleaned up in one run.
    this.#activeDiskPaths = new Set()
    for (const archive of this.backupArchives.values()) {
      if (archive instanceof VmIncrementalBackupArchive && archive.isComplete === true) {
        for (const diskPath of archive.diskPaths) {
          this.#activeDiskPaths.add(diskPath)
        }
      }
    }

    for (const lineage of this.diskLineages.values()) {
      lineage.setActiveDiskPaths(this.#activeDiskPaths)
      await lineage.check()
    }
    const allUsedFiles = Array.from(this.backupArchives.values()).flatMap(archive =>
      archive.getAssociatedFiles({ prefix: true })
    )
    allUsedFiles.push(...this.getAssociatedFiles({ prefix: true }))
    const orphans = []
    // TODO handle folders and empty folders
    for (const file of this.files.filter(file => !allUsedFiles.includes(file))) {
      orphans.push(file)
    }
    this.#checkResult = { orphans, linked: allUsedFiles }
    return this.#checkResult
  }

  async clean({ mergeLimiter }: { mergeLimiter?: MergeLimiter } = {}) {
    // Use cached check result if available, otherwise run check now
    const { orphans } = this.#checkResult ?? (await this.check())

    // Let each archive clean its own files (e.g. remove metadata for incomplete backups)
    await asyncEach(
      Array.from(this.backupArchives.values()),
      async (archive: VmBackupInterface) => {
        await archive.clean()
      },
      { concurrency: 2 }
    )

    // Merge/delete orphan disks in VDI directories
    await Promise.all(Array.from(this.diskLineages.values()).map(lineage => lineage.clean(mergeLimiter)))

    // Delete root-level orphan files (stray xva, checksum, json, etc.)
    await asyncEach(orphans, async (orphan: string) => await this.handler.unlink(orphan), { concurrency: 2 })

    return orphans
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
          this.opts
        )
      } else {
        throw new Error(`Mode ${metadata.mode} not supported`)
      }
    } catch (error) {
      this.opts.logWarn(`Error trying to create backupArchive from ${metadataPath}`, { metadata })
      throw new Error(`Error trying to create backupArchive from ${metadataPath}`)
    }
    await backupArchive.init()
    return backupArchive
  }
}
