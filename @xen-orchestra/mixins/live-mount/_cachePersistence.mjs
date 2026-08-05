import { createLogger } from '@xen-orchestra/log'
import { dirname } from 'node:path'
import { mkdir, open, rm, stat } from 'node:fs/promises'

const { warn } = createLogger('xo:mixins:LiveMount')

const CACHED_BYTE = Buffer.from([1])

/**
 * Persists a cached mount's "which blocks are materialized" bitmap to a file,
 * one byte per block — see `CachedDiskBlockDevice`'s class doc for why not a
 * bit-packed one: every block's write lands at a distinct, non-overlapping
 * offset, so concurrent writes for different blocks (hydrate's own
 * concurrency, or concurrent guest reads) never race on the same byte.
 *
 * A size mismatch against `blockCount` (e.g. the disk was resized since the
 * file was written) is treated as stale and discarded, not rejected: losing
 * the resume is safe, since every block would just be re-fetched from the
 * source, unlike serving wrong bytes from a wrongly-interpreted bitmap.
 *
 * @param {string} path
 * @param {number} blockCount
 * @returns {Promise<{
 *   initialBitmap: Buffer | undefined,
 *   markCached: (index: number) => void,
 *   close: () => Promise<void>,
 *   dispose: () => Promise<void>,
 * }>}
 */
export async function openCachePersistence(path, blockCount) {
  await mkdir(dirname(path), { recursive: true })

  let handle
  let initialBitmap
  try {
    const stats = await stat(path)
    if (stats.size === blockCount) {
      handle = await open(path, 'r+')
      initialBitmap = Buffer.alloc(blockCount)
      await handle.read(initialBitmap, 0, blockCount, 0)
    } else {
      warn('discarding stale cache persistence file (block count mismatch)', {
        path,
        size: stats.size,
        blockCount,
      })
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  if (handle === undefined) {
    // sparse: sized to blockCount bytes, unwritten bytes read as 0 ("not
    // cached"), matching CachedDiskBlockDevice's own fresh-bitmap semantics
    handle = await open(path, 'w')
    await handle.truncate(blockCount)
  }

  // tracked so `close()` can wait for the last few writes instead of losing
  // them to a closed fd — best-effort either way: a lost write only costs a
  // future unnecessary re-fetch, never correctness, so this is worth doing
  // when there's time for it, not worth blocking materialization on.
  const pending = new Set()

  async function close() {
    await Promise.all(pending)
    await handle.close()
  }

  return {
    initialBitmap,
    markCached(index) {
      const write = handle
        .write(CACHED_BYTE, 0, 1, index)
        .catch(error => warn('failed to persist cached block', { error, path, index }))
      pending.add(write)
      write.finally(() => pending.delete(write))
    },
    close,
    async dispose() {
      await close()
      await rm(path, { force: true })
    },
  }
}
