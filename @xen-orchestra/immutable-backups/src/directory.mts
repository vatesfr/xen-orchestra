import execa from 'execa'

// Recursively set the immutable (`+i`) attribute on a directory and all its contents.
export async function makeImmutable(dirPath: string): Promise<void> {
  await execa('chattr', ['+i', '-R', dirPath])
}

// chattr processes all paths even when some are missing (it does not abort on the first
// error), so every existing path is correctly lifted.  Per-path "No such file or
// directory while trying to stat" messages are silently ignored; any other error
// (e.g. permission denied) causes the error to be re-thrown.
async function execChattrWithMissingFiles(args: string[]) {
  try {
    await execa('chattr', args)
  } catch (err) {
    const stderr = (err as { stderr?: string })?.stderr ?? ''
    const hasUnexpected = stderr
      .split('\n')
      .some(line => line.trim() !== '' && !line.includes('No such file or directory while trying to stat'))
    if (hasUnexpected) {
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
