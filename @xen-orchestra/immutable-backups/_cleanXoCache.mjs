import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import isBackupMetadata from './isBackupMetadata.mjs'

export default async path => {
  if (isBackupMetadata(path)) {
    // snipe vm metadata cache to force XO to update it
    await fs.unlink(join(dirname(path), 'cache.json.gz'))
  }
}
