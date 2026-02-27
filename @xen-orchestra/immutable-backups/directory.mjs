// @ts-check

import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'

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
    await unindexFile(dirPath, immutabilityCachePath)
  }
  await execa('chattr', ['-i', '-R', dirPath])
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
