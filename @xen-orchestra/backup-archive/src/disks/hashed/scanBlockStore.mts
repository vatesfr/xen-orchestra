import { asyncEach } from '@vates/async-each'
import type { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { basename, join, normalize } from '@xen-orchestra/fs/path'
import { asBlockHash, BLOCK_STORE_PATH, decodeBlock } from './hbdPaths.mjs'

// <store>/<ab>/<cd>/<hash>/<copy>: copies are always at this depth
const COPY_DEPTH = 4

export async function scanBlockStore(
  handler: RemoteHandlerAbstract,
  {
    remove = false,
    verify = false,
    logInfo = () => {},
    logWarn = () => {},
    logDebug = () => {},
  }: {
    remove?: boolean
    verify?: boolean
    logInfo?: (message: string, data?: object) => void
    logWarn?: (message: string, data?: object) => void
    logDebug?: (message: string, data?: object) => void
  } = {}
): Promise<{ removed: number }> {
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
    await asyncEach(
      names,
      async name => {
        const path = join(dir, name)
        if (depth + 1 < COPY_DEPTH) {
          await visit(path, depth + 1) // a hash level: go down
        } else if (depth + 1 === COPY_DEPTH) {
          if (await removeIfOrphan(path)) {
            removed++ // a store copy
          } else if (verify) {
            // <ab>/<cd>/<hash>/<copy>: the copy's directory is named after the full hash
            await verifyCopy(path, basename(dir))
          }
        }
      },
      {
        concurrency: 2,
      }
    )
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

  async function verifyCopy(path: string, hashCopy: string): Promise<void> {
    try {
      const hash = asBlockHash(hashCopy)
      const buffer = await handler.readFile(path)
      decodeBlock(buffer, hash)
    } catch (error) {
      logWarn('corrupted store block', { path, error })
    }
  }

  await visit(normalize(BLOCK_STORE_PATH), 0)
  return { removed }
}
