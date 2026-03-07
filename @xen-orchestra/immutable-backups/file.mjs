// @ts-check

import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'
import { createLogger } from '@xen-orchestra/log'
const { warn } = /** @type {import('./protectRemotes.mjs').XoLogger} */ (
  /** @type {unknown} */ (createLogger('xen-orchestra:immutable-backups:file'))
)

// this work only on linux like systems
// this could work on windows : https://4sysops.com/archives/set-and-remove-the-read-only-file-attribute-with-powershell/

/**
 * Set the immutable (`+i`) attribute on a single file.
 * When `immutabilityCachePath` is provided the file is also recorded in the
 * index so it can be located later for lifting.
 * @param {string} path                      - Absolute path to the file
 * @param {string} [immutabilityCachePath]   - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function makeImmutable(path, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await indexFile(path, immutabilityCachePath)
  }
  await execa('chattr', ['+i', path])
}

/**
 * Remove the immutable (`-i`) attribute from a single file.
 * When `immutabilityCachePath` is provided the file is also removed from the
 * index.
 * @param {string} filePath                  - Absolute path to the file
 * @param {string} [immutabilityCachePath]   - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function liftImmutability(filePath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await unindexFile(filePath, immutabilityCachePath).catch(err => warn('liftImmutability', err))
  }
  await execa('chattr', ['-i', filePath])
}

/**
 * Index and lock multiple flat files with a single `chattr +i` invocation.
 * Files that do not exist or are already indexed are silently skipped.
 * This reduces process-spawn overhead from N spawns to 1 when locking a
 * batch of files that all belong to the same backup.
 * @param {string[]} paths                   - Candidate file paths to lock
 * @param {string}   [immutabilityCachePath] - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function makeImmutableBatch(paths, immutabilityCachePath) {
  const toChattr = (
    await Promise.all(
      paths.map(async p => {
        try {
          if (immutabilityCachePath) {
            await indexFile(p, immutabilityCachePath)
          }
          return p
        } catch (err) {
          const code = /** @type {NodeJS.ErrnoException} */ (err).code
          if (code === 'ENOENT' || code === 'EEXIST') return null
          throw err
        }
      })
    )
  ).filter(/** @param {string | null} p */ p => p !== null)

  if (toChattr.length > 0) {
    await execa('chattr', ['+i', ...toChattr])
  }
}

/**
 * Returns whether the immutable (`i`) attribute is set on `path`.
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export async function isImmutable(path) {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
