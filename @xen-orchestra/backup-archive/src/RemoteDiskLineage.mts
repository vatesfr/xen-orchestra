import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename, dirname, normalize, resolveFromFile } from '@xen-orchestra/fs/path'
import { MergeRemoteDisk, openDisk, openDiskChainFromPaths, RemoteDisk, isDiskFile } from '@xen-orchestra/backups/disks'
import type { MergeState } from '@xen-orchestra/backups/disks'
import { DEFAULT_MERGE_CONCURRENCY, DEFAULT_REMOVE_CONCURRENCY, ResolvedBackupCleanOptions } from './VmBackup.types.mjs'
import { asyncEach } from '@vates/async-each'

const INTERRUPTED_VHD_RE = /^\.(.+)\.merge\.json$/

/**
 * Tracks the disk chain for a single VDI across all backup snapshots.
 * Owns merge and deletion decisions for its chain given which disks are still
 * referenced by active backups (accumulated via addActiveDiskPaths).
 */
export class RemoteDiskLineage {
  #handler: RemoteHandlerAbstract
  #vdiDir: string
  #opts: ResolvedBackupCleanOptions

  // Concrete disk paths discovered in this VDI directory (normalized)
  #diskPaths: Set<string> = new Set()
  // child path: parent path (from disk header)
  #parentOf: Map<string, string> = new Map()
  // parent path: child path
  #childOf: Map<string, string> = new Map()
  // Disk paths declared active by their owning archives (accumulated across all referencing archives)
  #activeDiskPaths: Set<string> = new Set()
  // Interrupted merges: normalized parent path: parsed state file info
  #interruptedMerges: Map<string, { stateFilePath: string; chain?: string[]; childUuid?: string }> = new Map()
  // disk UUID: normalized disk path (populated during init)
  #uuidToPath: Map<string, string> = new Map()

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
          let chain: string[] | undefined
          let childUuid: string | undefined
          try {
            const state: MergeState = JSON.parse((await this.#handler.readFile(filePath)) as string)
            if (Array.isArray(state?.chain)) {
              chain = state.chain.map((relPath: string) => normalize(resolveFromFile(filePath, relPath)))
            }
            childUuid = state?.child?.uuid
          } catch {
            // mergeState unreadable
          }
          this.#interruptedMerges.set(parentPath, { stateFilePath: filePath, chain, childUuid })
        }
      }
    }

    for (const diskPath of this.#diskPaths) {
      let disk: RemoteDisk | undefined
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
        this.#uuidToPath.set(disk.getUuid(), diskPath)

        if (disk.isDifferencing()) {
          const parentPath = disk.getParentPath()
          this.#parentOf.set(diskPath, parentPath)
          if (this.#childOf.has(parentPath)) {
            const error = new Error('this script does not support multiple children', {
              cause: {
                parent: parentPath,
                child1: this.#childOf.get(parentPath),
                child2: diskPath,
              },
            })
            throw error // should we throw?
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
   * Declares disk paths as active for this lineage.
   * Called by each archive that references this lineage after it determines it is complete.
   * Accumulated across all referencing archives before clean() is called.
   */
  addActiveDiskPaths(diskPaths: string[]): void {
    for (const path of diskPaths) {
      this.#activeDiskPaths.add(normalize(path))
    }
  }

  /**
   * For each orphan disk:
   * - If it has an active descendant in the chain → build a merge chain and merge (if opts.merge).
   * - If it has no active descendant → delete it (if opts.remove).
   *
   * Also resumes interrupted merges (detected via .merge.json files) when opts.merge is true.
   * Deletes orphan merge state files (for missing disks) when opts.remove is true.
   *
   * Requires addActiveDiskPaths() to have been called by all referencing archives before this.
   * @returns Set of deleted disk paths.
   */
  async clean({
    remove = this.#opts.remove ?? false,
    merge = this.#opts.merge ?? false,
  }: { remove?: boolean; merge?: boolean } = {}): Promise<{ deleted: Set<string>; mergedSizes: Map<string, number> }> {
    const orphanDisks = new Set([...this.#diskPaths].filter(p => !this.#activeDiskPaths.has(p)))
    const toDelete = new Set<string>()
    const toMerge: { chain: string[]; isResuming: boolean }[] = []
    const visited = new Set<string>()

    // Walk from an orphan toward its descendants.
    // Returns a merge chain [orphan, ..., activeAnchor] if an active child exists,
    // or undefined if the subtree is entirely orphaned (mark for deletion).
    const getUsedChildChainOrDelete = (diskPath: string): string[] | undefined => {
      if (visited.has(diskPath)) {
        return undefined
      }
      visited.add(diskPath)

      if (!orphanDisks.has(diskPath)) {
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

    // Process interrupted merges first so their disks are protected from the orphan loop
    for (const [parentPath, { stateFilePath, chain: stateChain, childUuid }] of this.#interruptedMerges) {
      if (!this.#diskPaths.has(parentPath)) {
        // Orphan merge state: the disk no longer exists
        if (remove) {
          this.#opts.logInfo('deleting orphan merge state', { stateFilePath })
          await this.#handler.unlink(stateFilePath)
        }
        continue
      }

      // Reconstruct chain from state file (chain is always written since MergeRemoteDisk was updated
      // to include single-child merges). Fall back to uuid→path for old state files without chain.
      let chain: string[] | undefined
      if (stateChain !== undefined) {
        const existing = stateChain.filter(p => this.#diskPaths.has(p))
        if (existing.length >= 2) chain = existing
      } else {
        // old state file without chain: use child uuid to locate the child disk, or fall back to header-based map
        const childPath = childUuid !== undefined ? this.#uuidToPath.get(childUuid) : this.#childOf.get(parentPath)
        if (childPath !== undefined) chain = [parentPath, childPath]
      }

      if (chain !== undefined) {
        chain.forEach(p => visited.add(p))
        toMerge.push({ chain, isResuming: true })
      }
    }

    for (const orphan of orphanDisks) {
      if (!visited.has(orphan)) {
        const parent = this.#parentOf.get(orphan)
        if (parent === undefined || !orphanDisks.has(parent)) {
          const chain = getUsedChildChainOrDelete(orphan)
          if (chain !== undefined && chain.length > 1) {
            toMerge.push({ chain, isResuming: false })
          }
        }
      }
    }

    if (!merge && toMerge.length > 0) {
      this.#opts.logWarn('Disk chain needs merging', { count: toMerge.length })
    }

    // mergeTargetPath → final size of the disk everything was merged into
    const mergedSizes = new Map<string, number>()

    if (remove) {
      await asyncEach(
        Array.from(toDelete),
        async path => {
          this.#opts.logInfo('deleting unused disk', { path })
          try {
            const disk = await openDisk({ handler: this.#handler as any, path, ignoreBlockIndexes: true })
            await disk.unlink({ force: true })
          } catch (error) {
            this.#opts.logWarn('failed to delete unused disk', { path, error })
          }
        },
        { concurrency: DEFAULT_REMOVE_CONCURRENCY }
      )
    }

    if (merge) {
      await asyncEach(
        toMerge,
        async ({ chain, isResuming }) => {
          const { finalDiskSize, mergeTargetPath } = await this.#mergeChain(chain, isResuming)
          mergedSizes.set(mergeTargetPath, (mergedSizes.get(mergeTargetPath) ?? 0) + finalDiskSize)
        },
        { concurrency: DEFAULT_MERGE_CONCURRENCY }
      )
    }

    await this.#cleanOrphanDataFiles(remove)

    return { deleted: toDelete, mergedSizes }
  }

  /**
   * Merges ancestors into the active child at the end of the chain.
   * Returns the final size of the merge target and its path.
   */
  async #mergeChain(chain: string[], isResuming: boolean): Promise<{ finalDiskSize: number; mergeTargetPath: string }> {
    const parentPath = chain[0]
    // The last disk in the chain is the active one that everything gets merged into
    const mergeTargetPath = chain[chain.length - 1]

    this.#opts.logInfo('merging disk chain', { chain })

    const merger = new MergeRemoteDisk(this.#handler as any, {
      logInfo: this.#opts.logInfo,
      removeUnused: this.#opts.remove,
      mergeBlockConcurrency: this.#opts.mergeBlockConcurrency,
      onProgress: this.#opts.onProgress,
    })

    // isResuming is known from #interruptedMerges — no extra file read needed
    const parentDisk = await openDisk({ handler: this.#handler as any, path: parentPath, force: isResuming })
    const childDisk = await openDiskChainFromPaths({
      handler: this.#handler as any,
      paths: chain.slice(1),
      force: isResuming,
    })

    const { finalDiskSize } = await merger.merge(parentDisk, childDisk)
    return { finalDiskSize, mergeTargetPath }
  }

  /**
   * Validates each disk integrity, then scans discovered data subdirs
   * and deletes any files not associated to a known disk.
   */
  async #cleanOrphanDataFiles(remove: boolean): Promise<void> {
    const claimedFiles = new Set<string>()
    for (const diskPath of this.#diskPaths) {
      const disk = await openDisk({ handler: this.#handler as any, path: diskPath, ignoreBlockIndexes: true })
      await disk.clean({ remove, logWarn: this.#opts.logWarn, logInfo: this.#opts.logInfo })
      const claimed = await disk.listAssociatedFiles(this.#vdiDir)
      await disk.close()
      for (const f of claimed) claimedFiles.add(normalize(f))
    }

    const dataDirs = new Set([...claimedFiles].map(p => dirname(normalize(p))).filter(p => p !== this.#vdiDir))
    for (const dataDir of dataDirs) {
      const items = await this.#handler.list(dataDir, { prependDir: true }).catch(() => [] as string[])
      for (const item of items) {
        if (!claimedFiles.has(normalize(item))) {
          this.#opts.logWarn('orphaned data file', { path: item })
          if (remove) {
            await this.#handler.unlink(item).catch(async (err: any) => {
              if (err?.code === 'EISDIR') {
                await this.#handler.rmtree(item)
              } else {
                this.#opts.logWarn('failed to delete orphaned data file', { path: item, error: err })
              }
            })
          }
        }
      }
    }
  }
}
