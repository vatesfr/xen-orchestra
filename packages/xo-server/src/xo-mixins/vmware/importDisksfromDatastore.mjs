import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { Disposable } from 'promise-toolbox'
import { ReadAhead } from '@xen-orchestra/disk-transform'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { NbdDisk } from '@vates/nbd-client/NbdDisk.mjs'
import { createLogger } from '@xen-orchestra/log'
import NbdClient from '@vates/nbd-client'

const { info, warn } = createLogger('xo:importdiskfromdatastore')

const importDiskChain = Disposable.factory(async function* importDiskChain(
  $defer,
  { esxi, sr, vm, chainByNode, readMapFromSingleDisk = false, vdi, userdevice, sourceVmId }
) {
  let vhd
  if (chainByNode.length === 0) {
    return { vhd, vdi }
  }
  const start = Date.now()
  const activeDisk = chainByNode[chainByNode.length - 1]
  const { datastore: datastoreName, diskPath, descriptionLabel, nameLabel } = activeDisk
  let vmdk
  try {
    let dataMap
    if (readMapFromSingleDisk) {
      try {
        const nbdInfoSpawn = await esxi.spanwNbdKitProcess(sourceVmId, `[${datastoreName}] ${diskPath}`, {
          singleLink: true,
        })
        const nbdClient = new NbdClient(nbdInfoSpawn.nbdInfos)
        await nbdClient.connect()
        dataMap = await nbdClient.getMap()
      } catch (error) {
        warn('while getting the map of a snapshot', error)
      } finally {
        await esxi
          .killNbdServer(sourceVmId, `[${datastoreName}] ${diskPath}`, { openChain: false })
          .catch(err => warn('error whilestopping nbdkit server for the snapshot', err))
      }
    }

    const { nbdInfos } = await esxi.spanwNbdKitProcess(sourceVmId, `[${datastoreName}] ${diskPath}`)
    vmdk = new NbdDisk(nbdInfos, 2 * 1024 * 1024, { dataMap })

    await vmdk.init()
    vmdk = new ReadAhead(vmdk)
    if (!vdi) {
      const vdiMetadata = {
        name_description: descriptionLabel,
        name_label: '[ESXI]' + nameLabel,
        SR: sr.$ref,
        virtual_size: vmdk.getVirtualSize(),
      }
      const vdiRef = await sr.$xapi.VDI_create(vdiMetadata)
      vdi = sr.$xapi.getObject(vdiRef, undefined) ?? (await sr.$xapi.waitObject(vdiRef))

      await sr.$xapi.VBD_create({
        VDI: vdiRef,
        VM: vm.$ref,
        device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
        userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
      })
    }
    const stream = await toVhdStream(vmdk)
    await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
    info(`import of ${diskPath} content done`, { datastoreName, diskPath, sourceVmId })
    const transfered = Math.round((vmdk.getNbGeneratedBlock() * vmdk.getBlockSize()) / 1024 / 1024)
    const duration = Math.round((Date.now() - start) / 1000)
    const speed = Math.round(transfered / duration)

    await sr.$xapi.setField(
      'VDI',
      vdi.$ref,
      'name_description',
      `${await sr.$xapi.getField('VDI', vdi.$ref, 'name_description')} 
     ${transfered} MB in ${duration} s (${speed}MB/s) from  ${readMapFromSingleDisk ? 'snapshot' : 'base'}`
    )
    // @todo ; add data for import resuming
    //   await sr.$xapi.setFieldEntries('VDI', vdi.$ref, 'other_config', { esxi_uuid: vmdk.contentId })
  } finally {
    await vmdk?.close().catch(err => warn('error while closing source vmdk', err))
    await esxi
      .killNbdServer(sourceVmId, `[${datastoreName}] ${diskPath}`)
      .catch(err => warn('error whilestopping nbdkit server', err))
  }

  return { vdi }
})
/*
function diskIsAlreadyImported(sr, disk) {
  // look for a vdi with the right contentId
  return sr.$VDIs.find(vdi => vdi?.other_config.esxi_uuid === disk.contentId)
} */

export const importDisksFromDatastore = async function importDisksFromDatastore(
  $defer,
  { esxi, vm, chainsByNodes, readMapFromSingleDisk, sr, vhds = [], sourceVmId }
) {
  return await Promise.all(
    Object.keys(chainsByNodes).map(async (node, userdevice) =>
      Task.run({ properties: { name: `Cold import of disks ${node}` } }, async () => {
        const chainByNode = chainsByNodes[node]
        return Disposable.use(vhds[userdevice] ?? {}, ({ vdi, vhd: parentVhd }) =>
          importDiskChain($defer, {
            esxi,
            vm,
            chainByNode,
            readMapFromSingleDisk,
            userdevice,
            sr,
            parentVhd,
            vdi,
            sourceVmId,
          })
        )
      })
    )
  )
}
