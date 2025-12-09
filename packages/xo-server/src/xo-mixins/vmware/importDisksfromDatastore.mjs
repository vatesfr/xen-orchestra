import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { QCOW2_CLUSTER_SIZE, VDI_FORMAT_QCOW2, VDI_FORMAT_VHD, VHD_BLOCK_SIZE, VHD_MAX_SIZE } from '@xen-orchestra/xapi'
import { ReadAhead } from '@xen-orchestra/disk-transform'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { NbdDisk } from '@vates/nbd-client/NbdDisk.mjs'
import { createLogger } from '@xen-orchestra/log'
import { toQcow2Stream } from '@xen-orchestra/qcow2'

const { warn } = createLogger('xo:importdiskfromdatastore')

async function importDiskChain({ esxi, sr, vm, chainByNode, userdevice, vmId }) {
  if (chainByNode.length === 0) {
    Task.info('Empty chain')
    return
  }
  const xapi = vm.$xapi
  const existingVdis = await xapi.getRecords('VDI', await vm.$getDisks())

  const start = Date.now()
  const activeDisk = chainByNode[chainByNode.length - 1]
  const { capacity, datastore: datastoreName, diskPath, descriptionLabel, nameLabel, uid } = activeDisk
  let format
  let blockSize
  if (capacity > VHD_MAX_SIZE) {
    format = VDI_FORMAT_QCOW2
    blockSize = QCOW2_CLUSTER_SIZE
  } else {
    format = VDI_FORMAT_VHD
    blockSize = VHD_BLOCK_SIZE
  }

  let dataMap
  const previouslyImportedIndex = chainByNode.findLastIndex(disk => !!diskIsAlreadyImported(existingVdis, disk))
  let existingVdi
  if (previouslyImportedIndex === chainByNode.length - 1) {
    Task.info('Nothing to import in this chain')
    return
  }
  if (previouslyImportedIndex !== -1) {
    if (previouslyImportedIndex < chainByNode.length - 2) {
      throw new Error(
        'vddk import does not support importing multiple snapshots. Coalesce the non imported snapshot into one or force a full import'
      )
    }

    // get the changed blocks of the next snapshot
    const existingDisk = chainByNode[previouslyImportedIndex]
    existingVdi = diskIsAlreadyImported(existingVdis, existingDisk)
    Task.info(`found a previous import`, { vdiRef: existingVdi.$ref })

    dataMap = await esxi.getDataMap(vmId, datastoreName, diskPath)
  } else {
    Task.info(`no reference disk found, fall back a full import`)
  }
  let vmdk
  try {
    // we read the data from the full chain to ensure we don't have partial blocks ( blocks with 0 when clusters are in parent only)
    const { nbdInfos } = await esxi.spanwNbdKitProcess(vmId, `[${datastoreName}] ${diskPath}`)
    vmdk = new NbdDisk(nbdInfos, blockSize, { dataMap })

    await vmdk.init()
    vmdk = new ReadAhead(vmdk)
    if (!existingVdi) {
      Task.info(`create a new VDI for `, diskPath)
      const vdiMetadata = {
        name_description: descriptionLabel,
        name_label: '[ESXI]' + nameLabel,
        SR: sr.$ref,
        virtual_size: capacity,
      }
      const vdiRef = await sr.$xapi.VDI_create(vdiMetadata)
      existingVdi = sr.$xapi.getObject(vdiRef, undefined) ?? (await sr.$xapi.waitObject(vdiRef))

      Task.info(
        `vdi created  `,
        diskPath,
        'will create vbd',
        userdevice,
        `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`
      )
      await sr.$xapi.VBD_create({
        VDI: vdiRef,
        VM: vm.$ref,
        device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
        userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
      })
      Task.info(`vbd created `, diskPath)
    }
    let stream
    if (format === VDI_FORMAT_QCOW2) {
      stream = await toQcow2Stream(vmdk)
    } else {
      stream = await toVhdStream(vmdk)
    }
    await existingVdi.$importContent(stream, { format })
    Task.info(`import of ${diskPath} content done`, { datastoreName, diskPath, sourceVmId: vmId })
    const transfered = Math.round((vmdk.getNbGeneratedBlock() * vmdk.getBlockSize()) / 1024 / 1024)
    const duration = Math.round((Date.now() - start) / 1000)
    const speed = Math.round(transfered / duration)
    await sr.$xapi.setField(
      'VDI',
      existingVdi.$ref,
      'name_description',
      `${existingVdi.name_description} 
     ${transfered} MB in ${duration} s (${speed}MB/s) from  ${previouslyImportedIndex === -1 ? 'base' : 'snapshot'}`
    )
    await sr.$xapi.setFieldEntries('VDI', existingVdi.$ref, 'other_config', { esxi_uuid: uid })
  } catch (err) {
    Task.warning(err)
    throw err
  } finally {
    await vmdk?.close().catch(err => warn('error while closing source vmdk', err))
    await esxi
      .killNbdServer(vmId, `[${datastoreName}] ${diskPath}`)
      .catch(err => warn('error while stopping nbdkit server', err))
  }
}

function diskIsAlreadyImported(vdis, vmdkDisk) {
  // look for a vdi with the right contentId
  return vdis.find(vdi => vdi?.other_config.esxi_uuid === vmdkDisk.uid)
}

export const importDisksFromDatastore = async function importDisksFromDatastore({ esxi, vm, vmId, chainsByNodes, sr }) {
  return await Promise.all(
    Object.keys(chainsByNodes).map(async (node, userdevice) =>
      Task.run({ properties: { name: `Import of disks ${node}` } }, async () => {
        const chainByNode = chainsByNodes[node]
        return importDiskChain({
          esxi,
          vm,
          chainByNode,
          userdevice,
          sr,
          vmId,
        })
      })
    )
  )
}
