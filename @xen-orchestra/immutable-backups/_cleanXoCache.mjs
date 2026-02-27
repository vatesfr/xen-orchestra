// @ts-check

import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import isBackupMetadata from './isBackupMetadata.mjs'

/**
 * If `path` is a VM backup metadata file, delete the adjacent `cache.json.gz`
 * so that XO re-reads the updated metadata on next access.
 * @param {string} path - Absolute path to the file that was just modified
 * @returns {Promise<void>}
 */
export default async path => {
  if (isBackupMetadata(path)) {
    // snipe vm metadata cache to force XO to update it
    await fs.unlink(join(dirname(path), 'cache.json.gz'))
  }
}
