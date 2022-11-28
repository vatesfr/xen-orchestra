import { Backup } from '@xen-orchestra/backups/Backup.js'
import { v4 as generateUuid } from 'uuid'
import Esxi from '../../../../@xen-orchestra/vmware-explorer/esxi.mjs'
import OTHER_CONFIG_TEMPLATE from '../xapi/other-config-template.mjs'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { fromEvent } from 'promise-toolbox'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { readChunk } from '@vates/read-chunk'

async function checkEmpty(stream){
  let chunk
  let nbEmpty = 0
  let nbFull = 0
  const empty = Buffer.alloc(2*1024*1024, 0)
  while(chunk = await readChunk(stream, 2 * 1024 * 1024)){

    const isEmpty = empty.equals(chunk)
    if(isEmpty){
      nbEmpty ++
    } else {
      nbFull ++
    }
    if((nbEmpty + nbFull)%10 ===0){
      console.log('.',{nbEmpty, nbFull})
    }
  }

  console.log({nbEmpty, nbFull})
}



export default class MigrateVm {
  constructor(app) {
    this._app = app
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

  async #coldMigrationFromEsxi({ memory, numCpu, name_label, disks, networks, powerState, ...other }, srId, networkId){


    console.log('metadata', { memory, numCpu, name_label, disks, networks, other })
    if (powerState !== 'powerOff') {
      console.log('RUNNING ', powerState)
    }
    const sr = this._app.getXapiObject(srId)
    const xapi = sr.$xapi
    // find correspondig networks

    console.log('disk and network created')
    return vmChooseCoresPerSocket
  }

  async migrationfromEsxi({ host, user, password, sslVerify, sr: srId, network: networkId }) {
    const esxi = new Esxi(host, user, password, sslVerify)
    const app = this._app
    const sr = app.getXapiObject(srId)
    const xapi = sr.$xapi


    await fromEvent(esxi, 'ready')
    console.log('connected')
    const esxiVmMetadata = await esxi.getTransferableVmMetadata(
      '9'
    )
    const { memory,name_label, networks, numCpu } = esxiVmMetadata
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

    console.log('VM created', vm.uuid, vm.$ref)
    await Promise.all([
      asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'OVA import in progress...')),
      vm.set_name_label(`[Importing...] ${name_label}`),
    ])

    const vifDevices = await xapi.call('VM.get_allowed_VIF_devices', vm.$ref)
    console.log({ vifDevices })

    await Promise.all(networks.map((network, i) =>
    xapi.VIF_create({
      device: vifDevices[i],
      network: xapi.getObject(networkId).$ref,
      VM: vm.$ref,
    })
  ))
  console.log('network created')
  /*
    await Promise.all(
      disks
        .map(async disk => {
          const vdi = await xapi._getOrWaitObject(
            await xapi.VDI_create({
              name_description: disk.descriptionLabel,
              name_label: disk.nameLabel,
              SR: sr.$ref,
              virtual_size: disk.capacity,
            })
          )
          await xapi.VBD_create({
            userdevice: String(disk.position),
            VDI: vdi.$ref,
            VM: vm.$ref,
          })
          console.log('will import disk', (await disk.rawStream()).length)
          console.log('')

          let format = VDI_FORMAT_VHD
          let stream = await disk.vhd()
          if(!stream){
            format = VDI_FORMAT_RAW
            stream = await disk.rawStream()
          }
          await vdi.$importContent(stream, { format })
          console.log('disk imported')
        })
    )
*/
      // CREATE VM



    // get the snapshot to migrate
    const snapshots = esxiVmMetadata.snapshots
    const currentSnapshotId = snapshots.current

    let currentSnapshot = snapshots.snapshots.find(({uid})=> uid === currentSnapshotId)


    const chain = [currentSnapshot.disks]
    while(currentSnapshot = snapshots.snapshots.find(({uid})=> uid === currentSnapshot.parent)){
      console.log('found parent ', currentSnapshot)
      chain.push(currentSnapshot.disks)
    }
    chain.reverse()
    chain.push( esxiVmMetadata.disks)

    const chainsByNodes = {}
    chain.forEach(disks=>{
      disks.forEach(disk=>{
        chainsByNodes[disk.node] = chainsByNodes[disk.node] || []
        chainsByNodes[disk.node].push(disk)
      })
    })

    console.log(chainsByNodes)
    for(const node in chainsByNodes){
      console.log('IMPORTING chain' , node)
      let chainByNode = chainsByNodes[node]

      const vdi = await xapi._getOrWaitObject(
        await xapi.VDI_create({
          name_description: 'fromESXI'+chainByNode[0].descriptionLabel,
          name_label: '[ESXI]'+chainByNode[0].nameLabel,
          SR: sr.$ref,
          virtual_size: chainByNode[0].capacity,
        })
      )
      console.log('vdi created')

      await xapi.VBD_create({
        userdevice: String(0),
        VDI: vdi.$ref,
        VM: vm.$ref,
      })
      console.log('vbd created')
      for(const disk of chainByNode){

        // the first one  is a RAW disk ( full )

        // the live disk can only be migrated on a powerdoff vm

        console.log('will import ',{ disk})
        let format = VDI_FORMAT_VHD
        let stream = await disk.vhd()
        if(!stream){
         // format = VDI_FORMAT_RAW
          stream = await disk.rawStream()
        }
        console.log('will import in format ',{format})
        //await checkEmpty(stream)
        await vdi.$importContent(stream, { format })
        console.log('disk imported')
        break;
      }

      // and then we can import the running disk ( after shutting down the VM)
    }



    //  esxiVmMetadata.disks}


    await vm.set_name_label(esxiVmMetadata.name_label)

    // take the current snaptshot

    await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))


  }
}


// Vdis is 1874b686-0f27-45a4-a3d6-3cd2e248ac91
