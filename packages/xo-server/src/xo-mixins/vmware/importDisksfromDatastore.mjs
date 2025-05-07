import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { importVdi as importVdiThroughXva } from '@xen-orchestra/xva/importVdi.mjs'
import { Disposable } from 'promise-toolbox'
import { DiskChain, toRawStream } from '@xen-orchestra/disk-transform'
import { VmdkDisk } from '@xen-orchestra/vmdk'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { EsxiDatastore } from '../../../../../@xen-orchestra/vmware-explorer/VmfsFileAccessor.mjs'

const importDiskChain = Disposable.factory(async function* importDiskChain(
  $defer,
  { esxi, dataStoreToHandlers, sr, vm, chainByNode, vdi, parentVmdk, userdevice }
) {
  let vhd
  if (chainByNode.length === 0) {
    return { vhd, vdi }
  }
  const activeDisk = chainByNode[chainByNode.length - 1]
  const { datastore: datastoreName } = activeDisk
  const handler = dataStoreToHandlers[datastoreName]
  const vmdk = new VmdkDisk(handler ?? new EsxiDatastore(esxi, datastoreName), activeDisk.diskPath)
  await vmdk.init()
  const chain = await DiskChain.openFromChild(vmdk)

  if (chain.isDifferencing()) {
    const stream = await toVhdStream({ disk: chain })
    await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
  } else {
    const { descriptionLabel, nameLabel } = chainByNode[chainByNode.length - 1]
    const vdiMetadata = {
      name_description: 'fromESXI' + descriptionLabel,
      name_label: '[ESXI]' + nameLabel,
      SR: sr.$ref,
      virtual_size: chain.getVirtualSize(),
    }
    vdi = await importVdiThroughXva(vdiMetadata, toRawStream({ disk: chain }), sr.$xapi, sr)

    // it can fail before the vdi is connected to the vm
    $defer.onFailure.call(sr.$xapi, 'VDI_destroy', vdi.$ref)

    await sr.$xapi.VBD_create({
      VDI: vdi.$ref,
      VM: vm.$ref,
      device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
      userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
    })
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
