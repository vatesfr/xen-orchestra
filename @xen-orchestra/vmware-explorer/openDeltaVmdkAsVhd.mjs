import VhdEsxiCowd from './VhdEsxiCowd.mjs'
// import VhdEsxiSeSparse from "./VhdEsxiSeSparse.mjs";

export default async function openDeltaVmdkasVhd(esxi, datastore, path, parentVhd, opts) {
  let vhd
  if (path.endsWith('-sesparse.vmdk')) {
    throw new Error(
      `sesparse VMDK reading is not functional yet ${path}. For now, this VM can only be migrated if it doesn't have any snapshots and if it is halted.`
    )
    // vhd = new VhdEsxiSeSparse(esxi, datastore, path, parentVhd, opts)
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
