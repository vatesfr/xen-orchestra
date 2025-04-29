import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import openDeltaVmdkasVhd from '@xen-orchestra/vmware-explorer/openDeltaVmdkAsVhd.mjs'
import VhdEsxiRaw from '@xen-orchestra/vmware-explorer/VhdEsxiRaw.mjs'
import { importVdi as importVdiThroughXva } from '@xen-orchestra/xva/importVdi.mjs'
import { Disposable } from 'promise-toolbox'

const importDiskChain = Disposable.factory(async function* importDiskChain(
  $defer,
  { esxi, dataStoreToHandlers, sr, vm, chainByNode, vdi, parentVhd, userdevice }
) {
  let vhd
  if (chainByNode.length === 0) {
    return { vhd, vdi }
  }
  const isFullImport = chainByNode[0].isFull
  let lookMissingBlockInParent = isFullImport
  let lastDiskUid
  for (let diskIndex = 0; diskIndex < chainByNode.length; diskIndex++) {
    // the first one  is a RAW disk ( full )
    const disk = chainByNode[diskIndex]
    const { fileName, path, datastore: datastoreName, isFull } = disk
    lastDiskUid = disk.uid
    if (isFull) {
      vhd = yield VhdEsxiRaw.open(datastoreName, path + '/' + fileName, {
        thin: false,
        esxi,
        dataStoreToHandlers,
      })
    } else {
      if (parentVhd === undefined) {
        throw new Error(`Can't import delta of a running VM without its parent VHD`)
      }
      vhd = yield openDeltaVmdkasVhd(datastoreName, path + '/' + fileName, parentVhd, {
        lookMissingBlockInParent, // only look to missing block on full import
        esxi,
        dataStoreToHandlers,
      })
    }
    // is this disk already imported ?
    const previouslyImportedVdi = diskIsAlreadyImported(sr, disk)

    if (previouslyImportedVdi === undefined) {
      lookMissingBlockInParent = true // the block of this VHD must be migrated
    } else {
      vdi = previouslyImportedVdi // this vdi will be used as a base for the import
      lookMissingBlockInParent = false // the next child won't need to load the missing blocks
    }
    vhd.label = fileName
    parentVhd = vhd
  }
  if (vdi === undefined) {
    const { capacity, descriptionLabel, nameLabel } = chainByNode[chainByNode.length - 1]
    // we don't need to read the BAT with the importVdiThroughXva process
    const vdiMetadata = {
      name_description: 'fromESXI' + descriptionLabel,
      name_label: '[ESXI]' + nameLabel,
      SR: sr.$ref,
      virtual_size: capacity,
    }
    vdi = await importVdiThroughXva(vdiMetadata, vhd, sr.$xapi, sr)
    if (lastDiskUid !== undefined) {
      await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: lastDiskUid })
    }
    // it can fail before the vdi is connected to the vm
    $defer.onFailure.call(sr.$xapi, 'VDI_destroy', vdi.$ref)

    await sr.$xapi.VBD_create({
      VDI: vdi.$ref,
      VM: vm.$ref,
      device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
      userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
    })

    return { vdi, vhd }
  } else {
    // delta mode works only in vhd mode for now
    const stream = vhd.stream()
    await vhd.readBlockAllocationTable()
    await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
    if (lastDiskUid !== undefined) {
      await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: lastDiskUid })
    }
  }
  return { vdi, vhd }
})

function diskIsAlreadyImported(sr, disk) {
  // look for a vdi with the right longContentId
  return sr.$VDIs.find(vdi => vdi?.other_config.esxi_uuid === disk.uid)
}

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
