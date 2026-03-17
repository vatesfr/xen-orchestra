import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { MergeRemoteDisk, openDisk, instantiateDisk } from '@xen-orchestra/backups/disks'
import { isDiskFile, ResolvedBackupCleanOptions } from './VmBackup.types.mjs'

type MergeLimiter = (fn: (...args: any[]) => any) => (...args: any[]) => any

const INTERRUPTED_VHD_RE = /^\.(.+)\.merge\.json$/

/**
 * Tracks the disk chain for a single VDI across all backup snapshots.
 * Owns merge and deletion decisions for its chain given which disks are still
 * referenced by active backups (supplied by VmBackupDirectory).
 */
export class RemoteDiskLineage {
  #handler: RemoteHandlerAbstract
  #vdiDir: string
  #opts: ResolvedBackupCleanOptions

  // Concrete disk paths discovered in this VDI directory (normalized)
  #diskPaths: Set<string> = new Set()
  // child path → parent path (from disk header)
  #parentOf: Map<string, string> = new Map()
  // parent path → child path
  #childOf: Map<string, string> = new Map()
  // Disk paths not referenced by any active backup (set by setActiveDiskPaths)
  #orphanDisks: Set<string> = new Set()
  // Interrupted merges: normalized parent path → state file path
  #interruptedMerges: Map<string, string> = new Map()
  // Resolved data file paths for all disks (populated during init via getResolvedPath)
  #resolvedPaths: Set<string> = new Set()

  constructor(handler: RemoteHandlerAbstract, vdiDir: string, opts: ResolvedBackupCleanOptions) {
    this.#handler = handler
    this.#vdiDir = vdiDir
    this.#opts = opts
  }

  /**
   * Lists disk files and reads their headers to build the parent-child chain.
   * Also detects interrupted merge state files.
   */
  async init(): Promise<void> {
    const files = await this.#handler.list(this.#vdiDir, { prependDir: true })

    for (const filePath of files) {
      if (isDiskFile(filePath)) {
        this.#diskPaths.add(normalize(filePath))
      } else {
        const match = INTERRUPTED_VHD_RE.exec(basename(filePath))
        if (match !== null) {
          const parentFilename = match[1]
          const parentPath = normalize(this.#vdiDir + '/' + parentFilename)
          this.#interruptedMerges.set(parentPath, filePath)
        }
      }
    }

    for (const diskPath of this.#diskPaths) {
      let disk: any
      try {
        disk = await openDisk({ handler: this.#handler as any, path: diskPath })
      } catch (error: any) {
        if (error?.code === 'NOT_SUPPORTED' && this.#opts.merge) {
          throw error
        }
        this.#opts.logWarn('failed to open disk', { path: diskPath, error })
        continue
      }
      try {
        const resolvedPath = normalize(await disk.getResolvedPath())
        this.#resolvedPaths.add(resolvedPath)

        if (disk.isDifferencing()) {
          const parentPath = normalize(disk.instantiateParent().getPath())
          this.#parentOf.set(diskPath, parentPath)
          if (this.#childOf.has(parentPath)) {
            this.#opts.logWarn('multiple children for same parent disk', {
              parent: parentPath,
              child: diskPath,
            })
          }
          this.#childOf.set(parentPath, diskPath)
        }
      } catch (error) {
        this.#opts.logWarn('failed to read disk parent info', { path: diskPath, error })
      } finally {
        await disk.close()
      }
    }
  }

  /** Verifies that every parent referenced in disk headers exists in the directory. */
  async check(): Promise<void> {
    for (const [child, parent] of this.#parentOf) {
      if (!this.#diskPaths.has(parent)) {
        this.#opts.logWarn('parent disk is missing', { child, parent })
      }
    }
  }

  /**
   * Computes the set of orphan disks given the paths still referenced by active backups.
   * Must be called before getOrphanDisks() and clean().
   */
  setActiveDiskPaths(activeDiskPaths: Set<string>): void {
    this.#orphanDisks = new Set()
    for (const diskPath of this.#diskPaths) {
      if (!activeDiskPaths.has(diskPath)) {
        this.#orphanDisks.add(diskPath)
      }
    }
  }

  getOrphanDisks(): Set<string> {
    return new Set(this.#orphanDisks)
  }

  /**
   * For each orphan disk:
   * - If it has an active descendant in the chain → build a merge chain and merge (if opts.merge).
   * - If it has no active descendant → delete it (if opts.remove).
   *
   * Also resumes interrupted merges (detected via .merge.json files) when opts.merge is true.
   * Deletes orphan merge state files (for missing disks) when opts.remove is true.
   *
   * Requires setActiveDiskPaths() to have been called first (done by VmBackupDirectory.check()).
   * @param mergeLimiter - Wraps merge calls to limit global concurrency.
   * @returns Set of deleted disk paths.
   */
  async clean(
    mergeLimiter: MergeLimiter = fn => fn
  ): Promise<{ deleted: Set<string>; mergedSizes: Map<string, number> }> {
    const toDelete = new Set<string>()
    const toMerge: string[][] = []
    const visited = new Set<string>()

    // Walk from an orphan toward its descendants.
    // Returns a merge chain [orphan, ..., activeAnchor] if an active child exists,
    // or undefined if the subtree is entirely orphaned (mark for deletion).
    const getUsedChildChainOrDelete = (diskPath: string): string[] | undefined => {
      if (visited.has(diskPath)) {
        return undefined
      }
      visited.add(diskPath)

      if (!this.#orphanDisks.has(diskPath)) {
        // Active disk — anchor of the merge chain
        return [diskPath]
      }

      const child = this.#childOf.get(diskPath)
      if (child !== undefined) {
        const chain = getUsedChildChainOrDelete(child)
        if (chain !== undefined) {
          chain.unshift(diskPath)
          return chain
        }
      }

      toDelete.add(diskPath)
      return undefined
    }

    for (const orphan of this.#orphanDisks) {
      if (!visited.has(orphan)) {
        const chain = getUsedChildChainOrDelete(orphan)
        if (chain !== undefined && chain.length > 1) {
          toMerge.push(chain)
        }
      }
    }

    // Add interrupted merges that still have a valid child
    for (const [parentPath, stateFilePath] of this.#interruptedMerges) {
      if (!this.#diskPaths.has(parentPath)) {
        // Orphan merge state: the disk no longer exists
        if (this.#opts.remove) {
          this.#opts.logInfo('deleting orphan merge state', { stateFilePath })
          await this.#handler.unlink(stateFilePath)
        }
        continue
      }
      if (!visited.has(parentPath)) {
        const childPath = this.#childOf.get(parentPath)
        if (childPath !== undefined) {
          toMerge.push([parentPath, childPath])
        }
      }
    }

    if (!this.#opts.merge && toMerge.length > 0) {
      this.#opts.logWarn('VHD chain needs merging', { count: toMerge.length })
    }

    // mergeTargetPath → final size of the disk everything was merged into
    const mergedSizes = new Map<string, number>()

    await Promise.all([
      ...Array.from(toDelete).map(async path => {
        if (this.#opts.remove) {
          this.#opts.logInfo('deleting unused disk', { path })
          try {
            await instantiateDisk({ handler: this.#handler as any, path }).unlink({ force: true })
          } catch (error) {
            this.#opts.logWarn('failed to delete unused disk', { path, error })
          }
        }
      }),
      ...(this.#opts.merge
        ? toMerge.map(async chain => {
            const { finalDiskSize, mergeTargetPath } = await mergeLimiter(this.#mergeChain.bind(this))(chain)
            mergedSizes.set(mergeTargetPath, (mergedSizes.get(mergeTargetPath) ?? 0) + finalDiskSize)
          })
        : []),
    ])

    await this.#cleanDataDirectory()

    return { deleted: toDelete, mergedSizes }
  }

  /**
   * Deletes data files in the vdiDir/data/ subdirectory that are not referenced by any alias disk.
   */
  async #cleanDataDirectory(): Promise<void> {
    const dataDir = `${this.#vdiDir}/data`
    let dataFiles: string[]
    try {
      dataFiles = await this.#handler.list(dataDir, { prependDir: true })
    } catch {
      return
    }
    for (const dataFile of dataFiles) {
      if (!this.#resolvedPaths.has(normalize(dataFile))) {
        this.#opts.logWarn('no alias references data file', { path: dataFile })
        if (this.#opts.remove) {
          try {
            await instantiateDisk({ handler: this.#handler as any, path: dataFile }).unlink({ force: true })
          } catch (error) {
            this.#opts.logWarn('failed to delete unreferenced data file', { path: dataFile, error })
          }
        }
      }
    }
  }

  /**
   * Merges ancestors into the active child at the end of the chain.
   * Returns the final size of the merge target and its path.
   * Throws NOT_SUPPORTED if the parent is a VHD directory (alias required for directory merges).
   */
  async #mergeChain(chain: string[]): Promise<{ finalDiskSize: number; mergeTargetPath: string }> {
    const [parentPath, childPath] = chain
    // The last disk in the chain is the active one that everything gets merged into
    const mergeTargetPath = chain[chain.length - 1]

    // Merging a VHD directory without alias is not supported
    const parentIsDirectory = await this.#handler.list(parentPath).then(
      () => true,
      () => false
    )
    if (parentIsDirectory) {
      const err: any = new Error('Cannot merge VHD directory without alias')
      err.code = 'NOT_SUPPORTED'
      throw err
    }

    this.#opts.logInfo('merging disk chain', { chain })

    const merger = new MergeRemoteDisk(this.#handler as any, {
      logInfo: this.#opts.logInfo,
      removeUnused: true,
    })

    // isResuming only reads a state file keyed by the parent path — no disk needs to be open yet
    const force = await merger.isResuming({ getPath: () => parentPath } as any)

    const parentDisk = await openDisk({ handler: this.#handler as any, path: parentPath, force })
    const childDisk = await openDisk({ handler: this.#handler as any, path: childPath, force })

    const { finalDiskSize } = await merger.merge(parentDisk, childDisk)
    return { finalDiskSize, mergeTargetPath }
  }
}
