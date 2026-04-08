import {
  ArchiveCleanOptions,
  CheckResult,
  CleanResult,
  ResolvedBackupCleanOptions,
  VmBackupInterface,
  PartialBackupMetadata,
} from './VmBackup.types.mjs'
import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'

export class VmIncrementalBackupArchive implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  metadataPath: string
  metadata: PartialBackupMetadata
  readonly diskPaths: Array<string>
  rootPath: string
  opts: ResolvedBackupCleanOptions

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
    rootPath: string,
    metadataPath: string,
    metadata: PartialBackupMetadata,
    diskPaths: Array<string>,
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
    // Validation is deferred to check()
  }

  async check(): Promise<CheckResult> {
    const missingDisks: string[] = []

    if (this.diskPaths.length === 0) {
      this.opts.logWarn('incremental backup has no disk paths', { metadataPath: this.metadataPath })
      this.#isComplete = false
    } else {
      for (const diskPath of this.diskPaths) {
        try {
          await this.handler.getSize(diskPath)
        } catch {
          missingDisks.push(diskPath)
          this.opts.logWarn('disk file missing', { path: diskPath })
        }
      }

      this.#isComplete = missingDisks.length === 0
      if (!this.#isComplete) {
        this.opts.logWarn('incremental backup is incomplete', { metadataPath: this.metadataPath, missingDisks })
      }
    }
    this.#isChecked = true
    return { isValid: this.#isComplete, missingDisks }
  }

  /**
   * Removes the metadata file if the backup is incomplete (missing disks).
   * Actual disk merge/deletion is handled by RemoteDiskLineage.
   */
  async clean({ remove = this.opts.remove ?? false }: ArchiveCleanOptions = {}): Promise<CleanResult> {
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

    return { removedFiles, merge: false }
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
   * Returns the metadata file path if the backup is complete, empty otherwise.
   * Disk paths are not included — they live under vdis/ and are managed by RemoteDiskLineage.
   * Must be called after check().
   */
  getAssociatedFiles({ prefix = false }): Array<string> {
    if (!this.#isComplete) {
      return []
    }
    const files = [this.metadataPath]
    return prefix ? files : files.map(file => basename(file))
  }
}
