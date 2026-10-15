import type { Disk, DiskBlock } from '@xen-orchestra/disk-transform'
import { type RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

import { HashedDiskDeduplicated } from './HashedDiskDeduplicated.mjs'

const { warn } = createLogger('xo:backup-archive:hbd')

/**
 * Writes every block of `source` to a new hbd disk at `path`, sharing its
 * blocks with the whole backup repository.
 *
 * On failure, the partial disk is removed and the blocks it already
 * referenced are released.
 *
 * @returns the number of bytes read from the source
 */
export async function writeHbd(
  handler: RemoteHandlerAbstract,
  path: string,
  source: Disk,
  {
    uuid,
    parentUuid,
    parentPath,
    concurrency = 16,
    validator = async () => {},
    signal,
  }: {
    uuid: string
    parentUuid?: string
    parentPath?: string
    concurrency?: number
    validator?: (path: string) => Promise<void>
    signal?: AbortSignal
  }
): Promise<number> {
  let disk: HashedDiskDeduplicated | undefined
  // asyncEach rejects on the first error without waiting for the other
  // iterations: the cleanup must not run while a block is still being
  // referenced, or that reference would never be released
  const pendingWrites = new Set<Promise<number>>()
  try {
    signal?.throwIfAborted()
    const blockSize = source.getBlockSize()
    disk = await HashedDiskDeduplicated.create({
      handler,
      path,
      virtualSize: source.getVirtualSize(),
      blockSize,
      uuid,
      parentUuid,
      parentPath,
      dedupType: 'PER_BACKUP_REPOSITORY',
    })

    let transferred = 0
    const target = disk
    await asyncEach(
      source.diskBlocks(),
      async ({ index, data }: DiskBlock) => {
        signal?.throwIfAborted()
        transferred += data.length
        // the last block of a disk whose size is not a multiple of the block size
        if (data.length < blockSize) {
          const padded = Buffer.alloc(blockSize)
          data.copy(padded)
          data = padded
        }
        const write = target.writeBlock({ index, data })
        pendingWrites.add(write)
        try {
          await write
        } finally {
          pendingWrites.delete(write)
        }
      },
      { concurrency }
    )

    await disk.flushMetadata()
    await validator(path)
    return transferred
  } catch (error) {
    await source.close().catch(() => {})
    await Promise.allSettled(pendingWrites)
    if (disk !== undefined) {
      await disk.unlink().catch(unlinkError => warn('failed to remove partial hbd', { path, error: unlinkError }))
    }
    throw error
  }
}
