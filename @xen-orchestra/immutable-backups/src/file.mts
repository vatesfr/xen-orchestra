import execa from 'execa'
import { unindexFile, indexFile } from './_fileIndex.mjs'
import { createLogger } from '@xen-orchestra/log'

// this work only on linux like systems
// this could work on windows : https://4sysops.com/archives/set-and-remove-the-read-only-file-attribute-with-powershell/

const { warn } = createLogger('xen-orchestra:immutable-backups:file')

// Set the immutable (`+i`) attribute on a single file.
// When `immutabilityCachePath` is provided the file is also recorded in the
// index so it can be located later for lifting.
export async function makeImmutable(path: string, immutabilityCachePath?: string): Promise<void> {
  await execa('chattr', ['+i', path])
  if (immutabilityCachePath) {
    await indexFile(path, immutabilityCachePath)
  }
}

// Remove the immutable (`-i`) attribute from a single file.
// When `immutabilityCachePath` is provided the file is also removed from the index.
export async function liftImmutability(filePath: string, immutabilityCachePath?: string): Promise<void> {
  await execa('chattr', ['-i', filePath])
  if (immutabilityCachePath) {
    await unindexFile(filePath, immutabilityCachePath).catch(err => warn('liftImmutability', err))
  }
}

// Index and lock multiple flat files with a single `chattr +i` invocation.
// Files that do not exist or are already indexed are silently skipped.
// This reduces process-spawn overhead from N spawns to 1 when locking a
// batch of files that all belong to the same backup.
export async function makeImmutableBatch(paths: string[], immutabilityCachePath?: string): Promise<void> {
  try {
    await execa('chattr', ['+i', ...paths]).catch(() => {})
  } catch {
    // some file may be missing bu the return code of chattr is not very usefull to detect it
  }
  if (immutabilityCachePath) {
    await Promise.all(
      paths.map(async p => {
        try {
          if (immutabilityCachePath) {
            await indexFile(p, immutabilityCachePath)
          }
          return p
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code
          if (code === 'ENOENT' || code === 'EEXIST') return null
          throw err
        }
      })
    )
  }
}

// Returns whether the immutable (`i`) attribute is set on `path`.
export async function isImmutable(path: string): Promise<boolean> {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
