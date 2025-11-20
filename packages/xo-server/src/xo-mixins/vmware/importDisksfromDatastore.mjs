import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_QCOW2, VDI_FORMAT_VHD, VHD_MAX_SIZE } from '@xen-orchestra/xapi'
import parseVmdk from '@xen-orchestra/vmware-explorer/parsers/vmdk.mjs'
import { ReadAhead } from '@xen-orchestra/disk-transform'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { NbdDisk } from '@vates/nbd-client/NbdDisk.mjs'
import { createLogger } from '@xen-orchestra/log'
import NbdClient from '@vates/nbd-client'
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
  const { datastore: datastoreName, diskPath, descriptionLabel, nameLabel, uid } = activeDisk
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
    let nbdClient
    try {
      // get the changed blocks of the next snapshot
      const existingDisk = chainByNode[previouslyImportedIndex]
      existingVdi = diskIsAlreadyImported(existingVdis, existingDisk)
      Task.info(`found a previous import`, { vdiRef: existingVdi.$ref })
      const nbdInfoSpawn = await esxi.spanwNbdKitProcess(vmId, `[${datastoreName}] ${diskPath}`, {
        singleLink: true,
      })
      Task.info(`nbd server for data map spawned`)
      nbdClient = new NbdClient(nbdInfoSpawn.nbdInfos)

      await nbdClient.connect()
      Task.info(`nbd client for data map connected`)
      dataMap = await nbdClient.getMap()
      Task.info(
        `got the data map of the single disk in ${Math.round((Date.now() - start) / 1000)} seconds ,${dataMap.length} blocks`
      )
    } catch (error) {
      const descriptorResponse = await esxi.download(datastoreName, diskPath, '0-512')
      const descriptorBlob = await new Response(descriptorResponse.body).blob()
      const descriptorArrayBuffer = await descriptorBlob.arrayBuffer()
      const descriptorBytes = new Uint8Array(descriptorArrayBuffer).slice(0, 512)
      const descriptorText = new TextDecoder('utf-8').decode(descriptorBytes)

      const parsedDescriptor = parseVmdk(descriptorText)

      const diskPathArray = diskPath.split('/')
      const extentPath = diskPathArray.slice(0, -1).join('/') + '/' + parsedDescriptor.fileName

      const extentHeaderResponse = await esxi.download(datastoreName, extentPath, `0-2048`)
      const extentHeaderBlob = await new Response(extentHeaderResponse.body).blob()
      const extentHeaderBuffer = Buffer.from(await extentHeaderBlob.arrayBuffer())

      const extentNumGdEntries = extentHeaderBuffer.readUInt32LE(24)

      const extentGDResponse = await esxi.download(datastoreName, extentPath, `2048-${2048 + extentNumGdEntries * 4}`)
      const extentGDBlob = await new Response(extentGDResponse.body).blob()
      const extentGDBuffer = Buffer.from(await extentGDBlob.arrayBuffer())

      dataMap = []
      let offset = 0
      for (let i = 0; i < extentNumGdEntries; i++) {
        const extentGDE = extentGDBuffer.readUInt32LE(i * 4)
        if (extentGDE !== 0) {
          dataMap.push({
            offset: offset,
            length: 4096 * 512,
            type: 0,
          })
        }

        offset += 4096 * 512
      }

      Task.warning('error while getting the map of a snapshot, fall back to a full import', error)
      // throw error
    } finally {
      await nbdClient.disconnect()
      await esxi
        .killNbdServer(vmId, `[${datastoreName}] ${diskPath}`, { singleLink: true })
        .catch(err => Task.warning('error while stopping nbdkit server for the snapshot', err))
    }
  } else {
    Task.info(`no reference disk found, fall back a full import`)
  }
  let vmdk
  try {
    // we read the data from the full chain to ensure we don't have partial blocks ( blocks with 0 when clusters are in parent only)
    const { nbdInfos } = await esxi.spanwNbdKitProcess(vmId, `[${datastoreName}] ${diskPath}`)
    vmdk = new NbdDisk(nbdInfos, 2 * 1024 * 1024, { dataMap })

    await vmdk.init()
    vmdk = new ReadAhead(vmdk)
    if (!existingVdi) {
      Task.info(`create a new VDI for `, diskPath)
      const vdiMetadata = {
        name_description: descriptionLabel,
        name_label: '[ESXI]' + nameLabel,
        SR: sr.$ref,
        virtual_size: vmdk.getVirtualSize(),
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
    let format
    if (vmdk.getVirtualSize() > VHD_MAX_SIZE) {
      stream = await toQcow2Stream(vmdk)
      format = VDI_FORMAT_QCOW2
    } else {
      stream = await toVhdStream(vmdk)
      format = VDI_FORMAT_VHD
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
