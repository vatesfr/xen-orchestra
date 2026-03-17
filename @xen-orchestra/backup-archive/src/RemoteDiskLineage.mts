import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { MergeRemoteDisk, openDisk } from '@xen-orchestra/backups/disks'
import { isDiskFile, ResolvedBackupCleanOptions } from './VmBackup.types.mjs'

type MergeLimiter = (fn: (...args: any[]) => any) => (...args: any[]) => any

/**
 * Tracks the disk chain for a single VDI across all backup snapshots.
 * Owns merge and deletion decisions for its chain given which disks are still
 * referenced by active backups (supplied by VmBackupDirectory).
 */
export class RemoteDiskLineage {
  #handler: RemoteHandlerAbstract
  #vdiDir: string
  #opts: ResolvedBackupCleanOptions

  // Concrete disk paths discovered in this VDI directory
  #diskPaths: Set<string> = new Set()
  // child path → parent path (from disk header)
  #parentOf: Map<string, string> = new Map()
  // parent path → child path
  #childOf: Map<string, string> = new Map()
  // Disk paths not referenced by any active backup (set by setActiveDiskPaths)
  #orphanDisks: Set<string> = new Set()

  constructor(handler: RemoteHandlerAbstract, vdiDir: string, opts: ResolvedBackupCleanOptions) {
    this.#handler = handler
    this.#vdiDir = vdiDir
    this.#opts = opts
  }

  /**
   * Lists disk files and reads their headers to build the parent-child chain.
   */
  async init(): Promise<void> {
    const files = await this.#handler.list(this.#vdiDir, { prependDir: true })

    for (const filePath of files) {
      if (isDiskFile(filePath)) {
        this.#diskPaths.add(filePath)
      }
    }

    for (const diskPath of this.#diskPaths) {
      const disk = await openDisk({ handler: this.#handler as any, path: diskPath })
      try {
        if (disk.isDifferencing()) {
          const parentPath = disk.instantiateParent().getPath()
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
   * - If it has an active descendant in the chain → build a merge chain and merge.
   * - If it has no active descendant → delete it.
   *
   * Requires setActiveDiskPaths() to have been called first (done by VmBackupDirectory.check()).
   * @param mergeLimiter - Wraps merge calls to limit global concurrency.
   * @returns Set of deleted disk paths.
   */
  async clean(mergeLimiter: MergeLimiter = fn => fn): Promise<Set<string>> {
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

    await Promise.all([
      ...Array.from(toDelete).map(async path => {
        this.#opts.logInfo('deleting unused disk', { path })
        try {
          const disk = await openDisk({ handler: this.#handler as any, path })
          await disk.unlink()
        } catch (error) {
          this.#opts.logWarn('failed to delete unused disk', { path, error })
        }
      }),
      ...toMerge.map(chain => mergeLimiter(this.#mergeChain.bind(this))(chain)),
    ])

    return toDelete
  }

  async #mergeChain(chain: string[]): Promise<void> {
    this.#opts.logInfo('merging disk chain', { chain })

    const [parentPath, childPath] = chain

    const merger = new MergeRemoteDisk(this.#handler as any, {
      logInfo: this.#opts.logInfo,
      removeUnused: true,
    })

    // isResuming only reads a state file keyed by the parent path — no disk needs to be open yet
    const force = await merger.isResuming({ getPath: () => parentPath } as any)

    const parentDisk = await openDisk({ handler: this.#handler as any, path: parentPath, force })
    const childDisk = await openDisk({ handler: this.#handler as any, path: childPath, force })

    await merger.merge(parentDisk, childDisk)
  }
}
