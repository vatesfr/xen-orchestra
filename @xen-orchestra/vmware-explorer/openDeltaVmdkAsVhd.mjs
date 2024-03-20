import VHDEsxiSeSparse from './VhdEsxiSeSparse.mjs'
import VhdEsxiCowd from './VhdEsxiCowd.mjs'
import { openDatastore } from './_openDatastore.mjs'

export default async function openDeltaVmdkasVhd(datastoreName, path, parentVhd, opts) {
  let vhd
  const datastore = openDatastore(datastoreName, opts)
  if (path.endsWith('-sesparse.vmdk')) {
    vhd = new VHDEsxiSeSparse(datastore, path, parentVhd, opts)
  } else {
    if (path.endsWith('-delta.vmdk')) {
      vhd = new VhdEsxiCowd(datastore, path, parentVhd, opts)
    } else {
      throw new Error(`Vmdk ${path} does not seems to be a delta vmdk.`)
    }
  }
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  return vhd
}
