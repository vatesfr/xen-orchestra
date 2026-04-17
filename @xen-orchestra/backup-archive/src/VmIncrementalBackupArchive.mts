import {
  ArchiveCleanOptions,
  CheckResult,
  CleanResult,
  ResolvedBackupCleanOptions,
  VmBackupInterface,
  PartialBackupMetadata,
} from './VmBackup.types.mjs'
import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, dirname, normalize } from '@xen-orchestra/fs/path'
import { RemoteDiskLineage } from './RemoteDiskLineage.mjs'

export class VmIncrementalBackupArchive implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  metadataPath: string
  metadata: PartialBackupMetadata
  readonly diskPaths: Array<string>
  rootPath: string
  opts: ResolvedBackupCleanOptions
  diskLineages: Map<string, RemoteDiskLineage> = new Map()

  #isChecked = false
  #isComplete = false

  get isChecked(): boolean {
    return this.#isChecked
  }

  get isComplete(): boolean {
    return this.#isComplete
  }

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string, // xo-vm-backups/<vmUuid>/
    metadataPath: string, // xo-vm-backups/<vmUuid>/<timestamp>_<scheduleId>.json
    metadata: PartialBackupMetadata,
    diskPaths: Array<string>, // xo-vm-backups/<vmUuid>/vdis/<jobId>/<vdiUuid>/<snapshotUuid>.alias.vhd (one per VDI)
    opts: ResolvedBackupCleanOptions
  ) {
    this.handler = handler
    this.rootPath = normalize(rootPath)
    this.metadataPath = normalize(metadataPath)
    this.metadata = metadata
    this.diskPaths = diskPaths.map(path => normalize(path))
    this.opts = opts
  }

  async init(): Promise<void> {
    // Build one RemoteDiskLineage per VDI directory derived from diskPaths
    try {
      for (const diskPath of this.diskPaths) {
        const vdiDir = dirname(diskPath)
        if (!this.diskLineages.has(vdiDir)) {
          const lineage = new RemoteDiskLineage(this.handler, vdiDir, this.opts)
          await lineage.init()
          this.diskLineages.set(vdiDir, lineage)
        }
      }
    } catch (error: any) {
      if (error?.code === 'NOT_SUPPORTED') throw error
      this.opts.logWarn('failed to scan VDI directories', { error })
    }
  }

  async check(): Promise<CheckResult> {
    const missingDisks: string[] = []
    const brokenDisks: string[] = []

    if (this.diskPaths.length === 0) {
      this.opts.logWarn('incremental backup has no disk paths', { metadataPath: this.metadataPath })
      this.#isComplete = false
    } else {
      for (const diskPath of this.diskPaths) {
        const lineage = this.diskLineages.get(dirname(diskPath))
        if (lineage === undefined || !lineage.isPathAccessible(diskPath)) {
          if (lineage?.isBroken(diskPath)) {
            this.opts.logWarn('disk check error', { path: diskPath })
            brokenDisks.push(diskPath)
          } else {
            this.opts.logWarn('disk file missing', { path: diskPath })
            missingDisks.push(diskPath)
          }
        }
      }

      this.#isComplete = missingDisks.length === 0 && brokenDisks.length === 0
      if (!this.#isComplete) {
        this.opts.logWarn('incremental backup is incomplete', {
          metadataPath: this.metadataPath,
          missingDisks,
          brokenDisks,
        })
      }
    }
    if (this.#isComplete) {
      for (const lineage of this.diskLineages.values()) {
        lineage.addActiveDiskPaths(this.diskPaths)
      }
    }

    this.#isChecked = true
    return { isValid: this.#isComplete, missingDisks, brokenDisks }
  }

  /**
   * Removes the metadata file if the backup is incomplete (missing disks).
   * If mergedSizes is provided, updates metadata with the total merged size for this archive's disks.
   * Actual disk merge/deletion is handled by RemoteDiskLineage.
   */
  async clean({ remove = this.opts.remove ?? false, mergedSizes }: ArchiveCleanOptions = {}): Promise<CleanResult> {
    if (!this.#isChecked) {
      await this.check()
    }

    const removedFiles: string[] = []
    if (!this.#isComplete) {
      removedFiles.push(this.metadataPath)
    }

    if (remove) {
      for (const file of removedFiles) {
        try {
          await this.handler.unlink(file)
        } catch (error) {
          this.opts.logWarn(`Issue removing ${file}`, { error })
        }
      }
    }

    let mergedSize = 0
    if (mergedSizes !== undefined) {
      for (const diskPath of this.diskPaths) {
        mergedSize += mergedSizes.get(diskPath) ?? 0
      }
      if (mergedSize > 0) {
        await this.updateMetadata(mergedSize)
      }
    }

    return { removedFiles, merge: mergedSize > 0 }
  }

  /**
   * Updates metadata.size after a merge and writes the updated metadata file to disk.
   * Also resets isVhdDifferencing so all VDIs are marked as full (non-differencing).
   */
  async updateMetadata(mergedSize: number): Promise<void> {
    this.metadata.size = mergedSize
    if (this.metadata.vdis !== undefined) {
      this.metadata.isVhdDifferencing = {}
      for (const id of Object.keys(this.metadata.vdis)) {
        this.metadata.isVhdDifferencing[id] = false
      }
    }
    await this.handler.writeFile(this.metadataPath, JSON.stringify(this.metadata), { flags: 'w' })
  }

  /**
   * Returns the metadata file path and active disk paths if the backup is complete, empty otherwise.
   * Must be called after check().
   */
  getAssociatedFiles({ prefix = false }): Array<string> {
    if (!this.#isComplete) {
      return []
    }
    const files = [this.metadataPath, ...this.diskPaths]
    return prefix ? files : files.map(file => basename(file))
  }
}
