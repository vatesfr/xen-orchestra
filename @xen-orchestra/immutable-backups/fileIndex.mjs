// @ts-check

import { join } from 'node:path'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { dirname } from 'path'

/**
 * An entry yielded by {@link listOlderTargets}.
 * @typedef {Object} IndexEntry
 * @property {string} index  - Absolute path to the index file inside the immutability index directory
 * @property {string} target - Absolute path to the protected file or directory recorded in the index file
 */

const MAX_INDEX_FILE_SIZE = 1024 * 1024

/**
 * @param {string} content
 * @returns {string}
 */
function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * @param {Date} date
 * @returns {string} ISO date string of the form `YYYY-MM-DD`
 */
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Derive the index file path for `path` based on its birth time and a SHA-256
 * of the path string.
 * @param {string} path                   - Absolute path to the protected target
 * @param {string} immutabilityIndexPath  - Root of the immutability index directory
 * @returns {Promise<string>}
 */
async function computeIndexFilePath(path, immutabilityIndexPath) {
  const stat = await fs.stat(path)
  const date = new Date(stat.birthtimeMs)
  const day = formatDate(date)
  const hash = sha256(path)
  return join(immutabilityIndexPath, day, hash)
}

/**
 * Record `path` in the immutability index so it can be located later for
 * immutability lifting.  Creates intermediate directories as needed.
 * @param {string} path                   - Absolute path to the file or directory to index
 * @param {string} immutabilityIndexPath  - Root of the immutability index directory
 * @returns {Promise<string>} Absolute path to the created index file
 */
export async function indexFile(path, immutabilityIndexPath) {
  const indexFilePath = await computeIndexFilePath(path, immutabilityIndexPath)
  try {
    await fs.writeFile(indexFilePath, path, { flag: 'wx' })
  } catch (err) {
    // missing dir: make it
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      await fs.mkdir(dirname(indexFilePath), { recursive: true })
      await fs.writeFile(indexFilePath, path)
    } else {
      throw err
    }
  }
  return indexFilePath
}

/**
 * Remove `path` from the immutability index.  Silently ignores a missing
 * index entry.
 * @param {string} path                   - Absolute path to the file or directory to un-index
 * @param {string} immutabilityIndexPath  - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function unindexFile(path, immutabilityIndexPath) {
  try {
    const cacheFileName = await computeIndexFilePath(path, immutabilityIndexPath)
    await fs.unlink(cacheFileName)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Yield all indexed targets whose index date is strictly older than
 * `immutabilityDuration` milliseconds ago, together with the path of their
 * index file.  Empty day-directories are removed as they are processed.
 * @param {string} immutabilityCachePath - Root of the immutability index directory
 * @param {number} immutabilityDuration  - Retention duration in milliseconds
 * @returns {AsyncGenerator<IndexEntry>}
 */
export async function* listOlderTargets(immutabilityCachePath, immutabilityDuration) {
  // walk all dir by day until  the limit day
  const limitDate = new Date(Date.now() - immutabilityDuration)

  const limitDay = formatDate(limitDate)
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
  }
}
