import execa from 'execa'
import { unindexFile, indexFile } from './fileIndex.mjs'

export async function makeImmutable(dirPath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await indexFile(dirPath, immutabilityCachePath)
  }
  await execa('chattr', ['+i', '-R', dirPath])
}

export async function liftImmutability(dirPath, immutabilityCachePath) {
  if (immutabilityCachePath) {
    await unindexFile(dirPath, immutabilityCachePath)
  }
  await execa('chattr', ['-i', '-R', dirPath])
}

export async function isImmutable(path) {
  const { stdout } = await execa('lsattr', ['-d', path])
  return stdout[4] === 'i'
}
