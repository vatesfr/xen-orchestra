import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { Disposable } from 'promise-toolbox'
import { ReadAhead } from '@xen-orchestra/disk-transform'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { NbdDisk } from '@vates/nbd-client/NbdDisk.mjs'

const importDiskChain = Disposable.factory(async function* importDiskChain(
  $defer,
  { esxi, sr, vm, chainByNode, vdi, userdevice , sourceVmId}
) {
  let vhd
  if (chainByNode.length === 0) {
    return { vhd, vdi }
  }
  const openChain = chainByNode.length > 1  
  const activeDisk = chainByNode[chainByNode.length - 1]
  const { datastore: datastoreName, diskPath, descriptionLabel, nameLabel  } = activeDisk
  let vmdk
  try{
    const {nbdInfos } = await esxi.spanwNbdKitProcess(sourceVmId, `[${datastoreName}] ${diskPath}`, {openChain})
    console.log('nbdinfos', {nbdInfos})

    vmdk = new NbdDisk(nbdInfos, 2*1024*1024)

    await vmdk.init()
    vmdk = new ReadAhead(vmdk)
    if(!vdi){
      const vdiMetadata = {
          name_description: 'fromESXI' + descriptionLabel,
          name_label: '[ESXI]' + nameLabel,
          SR: sr.$ref,
          virtual_size: vmdk.getVirtualSize(),
        } 
      const vdiRef = await sr.$xapi.VDI_create(vdiMetadata)
      vdi =  sr.$xapi.getObject(vdiRef, undefined) ?? (await sr.$xapi.waitObject(vdiRef))

      await sr.$xapi.VBD_create({
        VDI: vdiRef,
        VM: vm.$ref,
        device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
        userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
      })
      console.log('VBD created ')
    }

    const stream = await toVhdStream(vmdk)
    console.log('stream ready  ')
    await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
    console.log('import done ')
    
  
  }
  finally{
    console.log(' WILL KILL SERVER ')
    await vmdk?.close().catch(err=>console.error('vmdk.close.error', err))
    console.log('vmdk closed')
    await esxi.killNbdServer(sourceVmId, `[${datastoreName}] ${diskPath}`).catch(err=>console.error('esxi.killNbdServer.error', err))
    console.log('nbd server killed')
  }

  return { vdi }
  /*
  const activeDisk = chainByNode[chainByNode.length - 1]
  const { datastore: datastoreName } = activeDisk
  const handler = dataStoreToHandlers[datastoreName]
  const vmdk = new VmdkDisk(handler ?? new EsxiDatastore(esxi, datastoreName), activeDisk.diskPath)
  await vmdk.init()

  const vdiCandidate = diskIsAlreadyImported(sr, vmdk)

  // special case : the vdi is already completly here, nothing to import
  if (vdiCandidate !== undefined) {
    const clone = await sr.$xapi.getRecord('VDI', await vdiCandidate.$clone())

    await sr.$xapi.VBD_create({
      VDI: clone.$ref,
      VM: vm.$ref,
      device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
      userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
    })
    return { vdi: clone, vmdk }
  }

  const chain = await DiskChain.openFromChild(
    vmdk,
    disk => {
      const vdiCandidate = diskIsAlreadyImported(sr, disk)
      if (vdiCandidate !== undefined) {
        // part of the chain is already here
        // we will import in this  vdi
        vdi = vdiCandidate
      }
      return vdiCandidate !== undefined
    },
    false
  )

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
  await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: vmdk.contentId })
  return { vdi, vmdk: chain }*/
})

function diskIsAlreadyImported(sr, disk) {
  // look for a vdi with the right contentId
  return sr.$VDIs.find(vdi => vdi?.other_config.esxi_uuid === disk.contentId)
}

export const importDisksFromDatastore = async function importDisksFromDatastore(
  $defer,
  { esxi, vm, chainsByNodes, sr, vhds = [] , sourceVmId}
) {
  return await Promise.all(
    Object.keys(chainsByNodes).map(async (node, userdevice) =>
      Task.run({ properties: { name: `Cold import of disks ${node}` } }, async () => {
        const chainByNode = chainsByNodes[node]
        return Disposable.use(vhds[userdevice] ?? {}, ({ vdi, vhd: parentVhd }) =>
          importDiskChain($defer, { esxi, vm, chainByNode, userdevice, sr, parentVhd, vdi, sourceVmId })
        )
      })
    )
  )
}
