import VhdEsxiCowd from './VhdEsxiCowd.mjs'
import VhdEsxiSeSparse from "./VhdEsxiSeSparse.mjs";

export default async function openDeltaVmdkasVhd(esxi, datastore, path, parentVhd, opts) {
  let vhd
  if (path.endsWith('-sesparse.vmdk')) {
    vhd = new VhdEsxiSeSparse(esxi, datastore, path, parentVhd, opts)
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
