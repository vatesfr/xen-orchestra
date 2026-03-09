import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'
import fs from 'node:fs/promises'

const { warn } = createLogger('xen-orchestra:immutable-backups:fileIndex')

export interface IndexEntry {
  /** Absolute path to the index file inside the immutability index directory */
  index: string
  /** Absolute path to the protected file or directory recorded in the index file */
  target: string
}

const MAX_INDEX_FILE_SIZE = 1024 * 1024

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Derive the index file path for `path` based on its birth time and a SHA-256 of the path string.
async function computeIndexFilePath(path: string, immutabilityIndexPath: string): Promise<string> {
  const stat = await fs.stat(path)
  const date = new Date(stat.birthtimeMs)
  const day = formatDate(date)
  const hash = sha256(path)
  return join(immutabilityIndexPath, day, hash)
}

// Record `path` in the immutability index so it can be located later for
// immutability lifting.  Creates intermediate directories as needed.
// Returns the absolute path to the created index file.
export async function indexFile(path: string, immutabilityIndexPath: string): Promise<string> {
  const indexFilePath = await computeIndexFilePath(path, immutabilityIndexPath)
  try {
    await fs.writeFile(indexFilePath, path, { flag: 'wx' })
  } catch (err) {
    // missing dir: make it
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(dirname(indexFilePath), { recursive: true })
      await fs.writeFile(indexFilePath, path, { flag: 'wx' })
    } else {
      throw err
    }
  }
  return indexFilePath
}

// Remove `path` from the immutability index.  Silently ignores a missing index entry.
export async function unindexFile(path: string, immutabilityIndexPath: string): Promise<void> {
  try {
    const cacheFileName = await computeIndexFilePath(path, immutabilityIndexPath)
    await fs.unlink(cacheFileName)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

// Yield all indexed targets whose index date is strictly older than
// `immutabilityDuration` milliseconds ago, together with the path of their
// index file.  Empty day-directories are removed as they are processed.
export async function* listOlderTargets(
  immutabilityCachePath: string,
  immutabilityDuration: number
): AsyncGenerator<IndexEntry> {
  // walk all dir by day until  the limit day
  const limitDate = new Date(Date.now() - immutabilityDuration)

  const limitDay = formatDate(limitDate)
  // auto closed on success at the end of the for loop, or on error at the end
  const dir = await fs.opendir(immutabilityCachePath)
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      continue
    }
    // ensure we have a valid date
    if (isNaN(new Date(dirent.name).getTime())) {
      continue
    }
    // recent enough to be kept
    if (dirent.name >= limitDay) {
      continue
    }
    const subDirPath = join(immutabilityCachePath, dirent.name)
    const subdir = await fs.opendir(subDirPath)
    try {
      let nb = 0
      for await (const hashFileEntry of subdir) {
        const entryFullPath = join(subDirPath, hashFileEntry.name)
        const { size } = await fs.stat(entryFullPath)
        if (size > MAX_INDEX_FILE_SIZE) {
          throw new Error(`Index file at ${entryFullPath} is too big, ${size} bytes `)
        }
        const targetPath = await fs.readFile(entryFullPath, { encoding: 'utf8' })
        yield {
          index: entryFullPath,
          target: targetPath,
        }
        nb++
      }
      // cleanup older folder
      if (nb === 0) {
        await fs.rmdir(subDirPath)
      }
    } finally {
      await subdir.close().catch(error => warn('error while closing subdir', error))
    }
  }
}
