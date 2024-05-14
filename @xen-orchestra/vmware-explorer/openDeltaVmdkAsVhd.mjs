import VHDEsxiSeSparse from './VhdEsxiSeSparse.mjs'
import VhdEsxiCowd from './VhdEsxiCowd.mjs'

export default async function openDeltaVmdkasVhd(datastoreName, path, parentVhd, opts) {
  let disposableVhd
  if (path.endsWith('-sesparse.vmdk')) {
    disposableVhd = await VHDEsxiSeSparse.open(datastoreName, path, parentVhd, opts)
  } else if (path.endsWith('-delta.vmdk')) {
    disposableVhd = await VhdEsxiCowd.open(datastoreName, path, parentVhd, opts)
  } else {
    throw new Error(`Vmdk ${path} does not seems to be a delta vmdk.`)
  }
  await disposableVhd.value.readBlockAllocationTable()
  return disposableVhd
}
