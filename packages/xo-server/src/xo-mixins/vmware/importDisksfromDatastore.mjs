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
  const isFullImport = chainByNode[0].isFull
  // we want all the blocks if we start with a full import
  let lookMissingBlockInParent = isFullImport
  let lastDiskUuid
  let chainLength = 0
  for (let diskIndex = 0; diskIndex < chainByNode.length; diskIndex++) {
    const disk = chainByNode[diskIndex]
    const { fileName, path, datastore: datastoreName, isFull } = disk
    lastDiskUuid = disk.uid
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
      chainLength++
      lookMissingBlockInParent = true // the block of this VHD must be migrated
    } else {
      chainLength = 0
      vdi = previouslyImportedVdi // this vdi will be used as a base for the import
      lookMissingBlockInParent = false // the next child won't need to load the missing blocks
    }
    vhd.label = fileName
    parentVhd = vhd
  }
  // if the vdi is already used ( like on of a previous import)
  if (vdi !== undefined) {
    // attach a clone to the current VM
    vdi = await sr.$xapi.getRecord('VDI', await vdi.$clone())
    await sr.$xapi.VBD_create({
      VDI: vdi.$ref,
      VM: vm.$ref,
      device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
      userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
    })
  }

  if (chainLength > 0) {
    // got something to migrate
    if (vdi === undefined) {
      // in a new disk
      const { capacity, descriptionLabel, nameLabel } = chainByNode[chainByNode.length - 1]
      // we don't need to read the BAT with the importVdiThroughXva process
      const vdiMetadata = {
        name_description: 'fromESXI' + descriptionLabel,
        name_label: '[ESXI]' + nameLabel,
        SR: sr.$ref,
        virtual_size: capacity,
      }
      vdi = await importVdiThroughXva(vdiMetadata, vhd, sr.$xapi, sr)
      if (lastDiskUuid !== undefined) {
        await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: lastDiskUuid })
      }
      // it can fail before the vdi is connected to the vm
      $defer.onFailure.call(sr.$xapi, 'VDI_destroy', vdi.$ref)
      await sr.$xapi.VBD_create({
        VDI: vdi.$ref,
        VM: vm.$ref,
        device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
        userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
      })
    } else {
      // delta mode works only in vhd mode for now
      const stream = vhd.stream()
      await vhd.readBlockAllocationTable()
      await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
      if (lastDiskUuid !== undefined) {
        await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: lastDiskUuid })
      }
    }
  }

  return { vdi, vhd }
})

function diskIsAlreadyImported(sr, disk) {
  // look for a vdi with the right longContentId
  return disk.uid && sr.$VDIs.find(vdi => vdi?.other_config.esxi_uuid === disk.uid)
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
