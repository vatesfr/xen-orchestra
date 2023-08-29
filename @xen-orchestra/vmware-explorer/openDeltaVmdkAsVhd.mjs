import VHDEsxiSeSparse from './VhdEsxiSeSparse.mjs'
import VhdEsxiCowd from './VhdEsxiCowd.mjs'

export default async function openDeltaVmdkasVhd(esxi, datastore, path, parentVhd, opts) {
  let vhd
  if (path.endsWith('-sesparse.vmdk')) {
    vhd = new VHDEsxiSeSparse(esxi, datastore, path, parentVhd, opts)
  } else {
    if (path.endsWith('-delta.vmdk')) {
      vhd = new VhdEsxiCowd(esxi, datastore, path, parentVhd, opts)
    } else {
      throw new Error(`Vmdk ${path} does not seems to be a delta vmdk.`)
    }
  }
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  return vhd
}
