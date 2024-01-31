import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'

// this work only on linux like systems
// this could work on windows : https://4sysops.com/archives/set-and-remove-the-read-only-file-attribute-with-powershell/

export async function makeImmutable(path, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await indexFile(path, immutabilityCachePath)
  }
  await execa('chattr', ['+i', path])
}

export async function liftImmutability(filePath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await unindexFile(filePath, immutabilityCachePath)
  }
  await execa('chattr', ['-i', filePath])
}

export async function isImmutable(path) {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
