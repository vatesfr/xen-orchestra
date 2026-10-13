import type { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { join, normalize } from '@xen-orchestra/fs/path'

// <store>/<ab>/<cd>/<hash>/<copy>: copies are always at this depth
const COPY_DEPTH = 4

export async function scanBlockStore(
  handler: RemoteHandlerAbstract,
  blockStorePath: string,
  {
    remove = false,
    logInfo = () => {},
    logDebug = () => {},
  }: {
    remove?: boolean
    logInfo?: (message: string, data?: object) => void
    logDebug?: (message: string, data?: object) => void
  } = {}
): Promise<{ removed: number }> {
  blockStorePath = normalize(blockStorePath)
  let removed = 0

  async function visit(dir: string, depth: number): Promise<void> {
    let names: string[]
    try {
      names = await handler.list(dir, { ignoreMissing: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') {
        return // not a store directory, left alone
      }
      throw error
    }
    for (const name of names) {
      const path = join(dir, name)
      if (depth + 1 < COPY_DEPTH) {
        await visit(path, depth + 1) // a hash level: go down
      } else if (depth + 1 === COPY_DEPTH) {
        if (await removeIfOrphan(path)) {
          removed++ // a store copy
        }
      }
    }
  }

  async function removeIfOrphan(path: string): Promise<boolean> {
    try {
      if ((await handler.getLinkCount(path)) !== 1) {
        return false // still linked by a disk
      }
      logDebug('orphan store file', { path })
      if (remove) {
        await handler.unlink(path, { checksum: false })
      }
      return true
    } catch (error) {
      logDebug('failed to check a store copy', { path, error })
      return false
    }
  }

  await visit(blockStorePath, 0)
  return { removed }
}
