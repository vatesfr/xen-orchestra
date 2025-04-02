import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { importVdi as importVdiThroughXva } from '@xen-orchestra/xva/importVdi.mjs'
import { Disposable } from 'promise-toolbox'
import { DiskChain } from '@xen-orchestra/disk-transform'

const importDiskChain = Disposable.factory(async function* importDiskChain(
  $defer,
  { esxi, dataStoreToHandlers, sr, vm, chainByNode, vdi, parentVmdk, userdevice }
) {
  let vhd
  if (chainByNode.length === 0) {
    return { vhd, vdi }
  }
  const vmdks = []
  let parent = parentVmdk
  for (let diskIndex = 0; diskIndex < chainByNode.length; diskIndex++) {
    // the first one  is a RAW disk ( full )
    const disk = chainByNode[diskIndex]
    const { fileName, path, datastore: datastoreName } = disk
    const vmdk = new VmdkDisk(esxi,path + '/' + fileName , parent)
    await vmdk.init()
    vmdks.push(vmdk)
    parent = vmdk
  }

  const chain = new DiskChain(vmdks)
  if(chain.isDifferencing){
    const stream = await toVhdStream({ disk })
    await vdi.$importContent(stream, {format: VDI_FORMAT_VHD})
  } else {
    const vdiMetadata = {
      name_description: 'fromESXI' + descriptionLabel,
      name_label: '[ESXI]' + nameLabel,
      SR: sr.$ref,
      virtual_size: chain.virtual_size,
    }
    vdi = await importVdiThroughXva(vdiMetadata, toRawStream( {disk:chain}), sr.$xapi, sr)
  } 
  return { vdi, vmdk: chain }
})

export const importDisksFromDatastore = async function importDisksFromDatastore(
  $defer,
  { esxi, dataStoreToHandlers, vm, chainsByNodes, sr, vhds = [] }
) {
  return await Promise.all(
    Object.keys(chainsByNodes).map(async (node, userdevice) =>
      Task.run({ properties: { name: `Cold import of disks ${node}` } }, async () => {
        const chainByNode = chainsByNodes[node]
        return Disposable.use(vhds[userdevice] ?? {}, ({ vdi, vhd: parentVhd }) =>
          importDiskChain($defer, { esxi, dataStoreToHandlers, vm, chainByNode, userdevice, sr, parentVhd, vdi })
        )
      })
    )
  )
}
