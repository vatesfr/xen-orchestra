'use strict'
import { Backup } from '@xen-orchestra/backups/Backup.js'
import { v4 as generateUuid } from 'uuid'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { fromEvent } from 'promise-toolbox'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import VhdEsxiRaw from '@xen-orchestra/vmware-explorer/VhdEsxiRaw.mjs'
import VhdCowd from '@xen-orchestra/vmware-explorer/VhdEsxiCowd.mjs'
import OTHER_CONFIG_TEMPLATE from '../xapi/other-config-template.mjs'

export default class MigrateVm {
  constructor(app) {
    this._app = app
  }

  load() {
    this._removeApiMethods = this._xo.addApiMethods({
      vm: {
        warmMigrateVm: () => this.warmMigrateVm(),
        migrationfromEsxi: () => this.migrationfromEsxi(),
      },
    })
  }
  unload() {
    this._removeApiMethods()
  }

  // Backup should be reinstentiated each time
  #createWarmBackup(sourceVmId, srId, jobId) {
    const app = this._app
    const config = {
      snapshotNameLabelTpl: '[XO warm migration {job.name}] {vm.name_label}',
    }
    const job = {
      type: 'backup',
      id: jobId,
      mode: 'delta',
      vms: { id: sourceVmId },
      name: `Warm migration`,
      srs: { id: srId },
      settings: {
        '': {
          // mandatory for delta replication writer
          copyRetention: 1,
        },
      },
    }
    const schedule = { id: 'one-time' }

    // for now we only support this from the main OA, no proxy
    return new Backup({
      config,
      job,
      schedule,
      getAdapter: async remoteId => app.getBackupsRemoteAdapter(await app.getRemoteWithCredentials(remoteId)),

      // `@xen-orchestra/backups/Backup` expect that `getConnectedRecord` returns a promise
      getConnectedRecord: async (xapiType, uuid) => app.getXapiObject(uuid),
    })
  }

  async warmMigrateVm(sourceVmId, srId, startDestVm = true, deleteSource = false) {
    // we'll use a one time use continuous replication job with the VM to migrate
    const jobId = generateUuid()
    const app = this._app
    const sourceVm = app.getXapiObject(sourceVmId)
    let backup = this.#createWarmBackup(sourceVmId, srId, jobId)
    await backup.run()
    const xapi = sourceVm.$xapi
    const ref = sourceVm.$ref

    // stop the source VM before
    try {
      await xapi.callAsync('VM.clean_shutdown', ref)
    } catch (error) {
      await xapi.callAsync('VM.hard_shutdown', ref)
    }
    // make it so it can't be restarted by error
    const message =
      'This VM has been migrated somewhere else and might not be up to date, check twice before starting it.'
    await sourceVm.update_blocked_operations({
      start: message,
      start_on: message,
    })

    // run the transfer again to transfer the changed parts
    // since the source is stopped, there won't be any new change after
    backup = this.#createWarmBackup(sourceVmId, srId, jobId)
    await backup.run()
    // find the destination Vm
    const targets = Object.keys(
      app.getObjects({
        filter: obj => {
          return (
            'other' in obj &&
            obj.other['xo:backup:job'] === jobId &&
            obj.other['xo:backup:sr'] === srId &&
            obj.other['xo:backup:vm'] === sourceVm.uuid &&
            'start' in obj.blockedOperations
          )
        },
      })
    )
    if (targets.length === 0) {
      throw new Error(`Vm target of warm migration not found for ${sourceVmId} on SR ${srId} `)
    }
    if (targets.length > 1) {
      throw new Error(`Multiple target of warm migration found for ${sourceVmId} on SR ${srId} `)
    }

    const targetVm = app.getXapiObject(targets[0])

    // new vm is ready to start
    // delta replication writer as set this as blocked
    await targetVm.update_blocked_operations({ start: null, start_on: null })

    if (startDestVm) {
      // boot it
      await targetVm.$xapi.startVm(targetVm.$ref)
      // wait for really started
      // delete source
      if (deleteSource) {
        sourceVm.$xapi.VM_destroy(sourceVm.$ref)
      } else {
        // @todo should we delete the snapshot if we keep the source vm ?
      }
    }
  }

  #buildDiskChainByNode(disks, snapshots){
    let chain = []
    if (snapshots && snapshots.current) {
      const currentSnapshotId = snapshots.current

      let currentSnapshot = snapshots.snapshots.find(({ uid }) => uid === currentSnapshotId)

      chain = [currentSnapshot.disks]
      while ((currentSnapshot = snapshots.snapshots.find(({ uid }) => uid === currentSnapshot.parent))) {
        chain.push(currentSnapshot.disks)
      }
      chain.reverse()
    }

    chain.push (disks)

    for( const disk of chain){
      if (disk.capacity > 2 * 1024 * 1024 * 1024 * 1024) {
        /* 2TO */
        throw new Error("Can't migrate disks larger than 2To")
      }
    }

    const chainsByNodes = {}
    chain.forEach(disks => {
      disks.forEach(disk => {
        chainsByNodes[disk.node] = chainsByNodes[disk.node] || []
        chainsByNodes[disk.node].push(disk)
      })
    })

    return chainsByNodes
  }

  async migrationfromEsxi({ host, user, password, sslVerify, sr: srId, network: networkId, vm: vmId, thin }) {
    const esxi = new Esxi(host, user, password, sslVerify)
    const app = this._app

    await fromEvent(esxi, 'ready')
    const esxiVmMetadata = await esxi.getTransferableVmMetadata(vmId)
    const { disks, memory, name_label, networks, numCpu, powerState, snapshots } = esxiVmMetadata
    const isRunning = powerState !== 'poweredOff'

    const chainsByNodes =  this.#buildDiskChainByNode(disks, snapshots)


    // got data, ready to start creating
    const sr = app.getXapiObject(srId)
    const xapi = sr.$xapi
    const vm = await xapi._getOrWaitObject(
      await xapi.VM_create({
        ...OTHER_CONFIG_TEMPLATE,
        memory_dynamic_max: memory,
        memory_dynamic_min: memory,
        memory_static_max: memory,
        memory_static_min: memory,
        name_description: 'from esxi',
        name_label,
        VCPUs_at_startup: numCpu,
        VCPUs_max: numCpu,
      })
    )
    await Promise.all([
      asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'Esxi migration in progress...')),
      vm.set_name_label(`[Importing...] ${name_label}`),
    ])

    const vifDevices = await xapi.call('VM.get_allowed_VIF_devices', vm.$ref)

    await Promise.all(
      networks.map((network, i) =>
        xapi.VIF_create({
          device: vifDevices[i],
          network: xapi.getObject(networkId).$ref,
          VM: vm.$ref,
        })
      )
    )

    const vhds = await Promise.all(
      Object.keys(chainsByNodes).map(async (node,userdevice) =>{
        const chainByNode = chainsByNodes[node]
        const vdi = await xapi._getOrWaitObject(
          await xapi.VDI_create({
            name_description: 'fromESXI' + chainByNode[0].descriptionLabel,
            name_label: '[ESXI]' + chainByNode[0].nameLabel,
            SR: sr.$ref,
            virtual_size: chainByNode[0].capacity,
          })
        )
        console.log('vdi created')

        await xapi.VBD_create({
          VDI: vdi.$ref,
          VM: vm.$ref,
        })
        console.log('vbd created')
        let parentVhd, vhd
        // if the VM is running we'll transfer everything before the last , which is an active disk
        //  the esxi api does not allow us to read an active disk
        // later we'll stop the VM and transfer this snapshot
        const nbColdDisks  = 1// isRunning ? chainByNode.length -1 : chainByNode.length
        console.log('will transfer', nbColdDisks, isRunning)
        for (let diskIndex = 0; diskIndex < nbColdDisks; diskIndex ++ ) {
          // the first one  is a RAW disk ( full )
          const disk= chainByNode[diskIndex]
          console.log('will import ', { disk })
          const {fileName, path, datastore,isFull} = disk

          if(isFull){
            console.log('full disk ')
            vhd = await VhdEsxiRaw.open(esxi, datastore, path + '/' + fileName, {thin})
            await vhd.readBlockAllocationTable()
          } else {
            console.log('delta disk ')
            vhd = await VhdCowd.open(esxi, datastore, path + '/' + fileName, parentVhd)
            await vhd.readBlockAllocationTable()
          }
          parentVhd = vhd
        }
        console.log('will import synthetic ')

        const stream =vhd.stream()
        console.log('will import active disk ', stream.length)
        await vdi.$importContent( stream, { format:VDI_FORMAT_VHD })
        return {vdi ,vhd}
      }
      )
    )
    console.log('cold transfer done')
    if(isRunning){
      // it the vm was running, we stop it and transfer the data in the active disk
      await esxi.powerOff(vmId)

      console.log('vm stopped')
      await Promise.all(
        Object.keys(chainsByNodes).map(async (node, userdevice)=>{
          const chainByNode = chainsByNodes[node]
          const disk = chainByNode[chainByNode.length -1]
          const {fileName, path, datastore } = disk
          const {vdi, vhd:parentVhd} = vhds[userdevice]
          let vhd
          if(isFull){
            console.log('full disk ')
            vhd = await VhdEsxiRaw.open(esxi, datastore, path + '/' + fileName, {thin})
            await vhd.readBlockAllocationTable()
          } else {
            console.log('delta disk ')
            vhd = await VhdCowd.open(esxi, datastore, path + '/' + fileName, parentVhd, {lookMissingBlockInParent:false})
            await vhd.readBlockAllocationTable()
          }
          await vhd.readBlockAllocationTable()
          const stream =vhd.stream()
          console.log('will import active disk ', stream.length)

          await vdi.$importContent( stream, { format:VDI_FORMAT_VHD })
          console.log('done one disk ')
        })
      )

      console.log('hot  transfer done')
    }
    console.log('disks created')
    // remove the importing in label
    await vm.set_name_label(esxiVmMetadata.name_label)

    // remove lock on start
    await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))

    return vm.uuid
  }
}
