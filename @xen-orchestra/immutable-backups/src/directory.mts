import execa, { type ExecaError } from 'execa'

// Recursively set the immutable (`+i`) attribute on a directory and all its contents.
export async function makeImmutable(dirPath: string): Promise<void> {
  await execa('chattr', ['+i', '-R', dirPath])
}

// chattr processes all paths even when some are missing (it does not abort on the first
// error), so every existing path is correctly lifted.
//
// Per-path "while trying to stat" messages (ENOENT) are silently ignored regardless of
// locale — these are always expected for optional paths (.xva, .alias.vhd, …) that are
// absent in delta backups.  chattr localises the error description but "while trying to
// stat" is always emitted in English, so we match on that suffix only.
//
// Any other error (e.g. EAGAIN on NFS when the file is still open, permission denied) is
// retried up to 3 times with a 1 s delay before being re-thrown.
async function execChattrWithMissingFiles(args: string[]): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await execa('chattr', args)
      return
    } catch (err) {
      const stderr = (err as ExecaError).stderr ?? ''
      const lines = stderr.split('\n').filter(line => line.trim() !== '')

      // All errors are ENOENT for optional missing paths — silently accept, no retry.
      if (lines.every(line => line.includes('while trying to stat'))) {
        return
      }

      // At least one non-ENOENT error — retry up to 3 times, then re-throw.
      if (attempt < 3) {
        await new Promise<void>(resolve => setTimeout(resolve, 1000))
        continue
      }
      throw err
    }
  }
}

// Lock multiple paths (files and/or directories) with a single `chattr +i -R` invocation.
// For regular files `-R` is a no-op (chattr ignores it). Missing paths are silently
// ignored: chattr processes all remaining paths before exiting non-zero.
export async function makeImmutableBatch(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await execChattrWithMissingFiles(['+i', '-R', ...paths])
}

// Recursively remove the immutable (`-i`) attribute from a directory and all its contents.
export async function liftImmutability(dirPath: string): Promise<void> {
  await execa('chattr', ['-i', '-R', dirPath])
}

// Lift immutability from multiple paths with a single `chattr -i -R` invocation.
// Works for both flat files and directories.
export async function liftImmutabilityBatch(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await execChattrWithMissingFiles(['-i', '-R', ...paths])
}

// Returns whether the immutable (`i`) attribute is set on `path`.
export async function isImmutable(path: string): Promise<boolean> {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
