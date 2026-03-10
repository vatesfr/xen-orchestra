import execa from 'execa'

// this work only on linux like systems
// this could work on windows : https://4sysops.com/archives/set-and-remove-the-read-only-file-attribute-with-powershell/

// Set the immutable (`+i`) attribute on a single file.
export async function makeImmutable(path: string): Promise<void> {
  await execa('chattr', ['+i', path])
}

// Remove the immutable (`-i`) attribute from a single file.
export async function liftImmutability(filePath: string): Promise<void> {
  await execa('chattr', ['-i', filePath])
}

// Returns whether the immutable (`i`) attribute is set on `path`.
export async function isImmutable(path: string): Promise<boolean> {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
