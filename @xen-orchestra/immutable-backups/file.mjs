// @ts-check

import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'

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
    await unindexFile(filePath, immutabilityCachePath)
  }
  await execa('chattr', ['-i', filePath])
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
