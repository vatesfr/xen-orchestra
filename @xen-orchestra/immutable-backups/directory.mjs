// @ts-check

import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'
import { createLogger } from '@xen-orchestra/log'
const { warn } = /** @type {import('./protectRemotes.mjs').XoLogger} */ (
  /** @type {unknown} */ (createLogger('xen-orchestra:immutable-backups:directory'))
)
/**
 * Recursively set the immutable (`+i`) attribute on a directory and all its
 * contents.  When `immutabilityCachePath` is provided the directory is also
 * recorded in the index so it can be located later for lifting.
 * @param {string} dirPath                   - Absolute path to the directory
 * @param {string} [immutabilityCachePath]   - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function makeImmutable(dirPath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await indexFile(dirPath, immutabilityCachePath)
  }
  await execa('chattr', ['+i', '-R', dirPath])
}

/**
 * Recursively remove the immutable (`-i`) attribute from a directory and all
 * its contents.  When `immutabilityCachePath` is provided the directory is
 * also removed from the index.
 * @param {string} dirPath                   - Absolute path to the directory
 * @param {string} [immutabilityCachePath]   - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function liftImmutability(dirPath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await unindexFile(dirPath, immutabilityCachePath).catch(err => warn('liftImmutability', err))
  }
  await execa('chattr', ['-i', '-R', dirPath])
}

/**
 * Lift immutability from multiple paths with a single `chattr -i -R` invocation.
 * Works for both flat files and directories — `chattr -i -R` on a plain file
 * behaves identically to `chattr -i` (no children to recurse into).
 * @param {string[]} paths                   - Absolute paths to files or directories
 * @param {string}   [immutabilityCachePath] - Root of the immutability index directory
 * @returns {Promise<void>}
 */
export async function liftImmutabilityBatch(paths, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await Promise.all(
      paths.map(p => unindexFile(p, immutabilityCachePath).catch(err => warn('liftImmutabilityBatch', err)))
    )
  }
  await execa('chattr', ['-i', '-R', ...paths])
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
