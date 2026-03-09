import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import isBackupMetadata from './isBackupMetadata.mjs'

// If `path` is a VM backup metadata file, delete the adjacent `cache.json.gz`
// so that XO re-reads the updated metadata on next access.
export default async (path: string): Promise<void> => {
  if (isBackupMetadata(path)) {
    // snipe vm metadata cache to force XO to update it
    await fs.unlink(join(dirname(path), 'cache.json.gz')).catch(err => {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    })
  }
}
