import execa from 'execa'
import { unindexFile, indexFile } from './_fileIndex.mjs'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xen-orchestra:immutable-backups:directory')

// Recursively set the immutable (`+i`) attribute on a directory and all its
// contents.  When `immutabilityCachePath` is provided the directory is also
// recorded in the index so it can be located later for lifting.
export async function makeImmutable(dirPath: string, immutabilityCachePath?: string): Promise<void> {
  await execa('chattr', ['+i', '-R', dirPath]).catch(() => {
    // the chattr error is not so useful, let the indexFile fails later
  })
  if (immutabilityCachePath) {
    await indexFile(dirPath, immutabilityCachePath)
  }
}

// Recursively remove the immutable (`-i`) attribute from a directory and all
// its contents.  When `immutabilityCachePath` is provided the directory is
// also removed from the index.
export async function liftImmutability(dirPath: string, immutabilityCachePath?: string): Promise<void> {
  await execa('chattr', ['-i', '-R', dirPath])
  if (immutabilityCachePath) {
    await unindexFile(dirPath, immutabilityCachePath).catch(err => warn('liftImmutability', err))
  }
}

// Lift immutability from multiple paths with a single `chattr -i -R` invocation.
// Works for both flat files and directories — `chattr -i -R` on a plain file
// behaves identically to `chattr -i` (no children to recurse into).
export async function liftImmutabilityBatch(paths: string[], immutabilityCachePath?: string): Promise<void> {
  await execa('chattr', ['-i', '-R', ...paths])
  if (immutabilityCachePath) {
    await Promise.all(
      paths.map(p => unindexFile(p, immutabilityCachePath).catch(err => warn('liftImmutabilityBatch', err)))
    )
  }
}

// Returns whether the immutable (`i`) attribute is set on `path`.
export async function isImmutable(path: string): Promise<boolean> {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
