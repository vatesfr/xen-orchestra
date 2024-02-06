import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { fromEvent } from 'promise-toolbox'
import { createRunner } from '@xen-orchestra/backups/Backup.mjs'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { v4 as generateUuid } from 'uuid'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'
import openDeltaVmdkasVhd from '@xen-orchestra/vmware-explorer/openDeltaVmdkAsVhd.mjs'
import OTHER_CONFIG_TEMPLATE from '../xapi/other-config-template.mjs'
import VhdEsxiRaw from '@xen-orchestra/vmware-explorer/VhdEsxiRaw.mjs'
import { importVdi as importVdiThroughXva } from '@xen-orchestra/xva/importVdi.mjs'

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
          // by default continuous replication add some tags
          _warmMigration: true,
        },
      },
    }
    const schedule = { id: 'one-time' }

    // for now we only support this from the main OA, no proxy
    return createRunner({
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
    // delta replication writer has set this as blocked=
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

  #buildDiskChainByNode(disks, snapshots) {
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

    chain.push(disks)

    for (const disk of chain) {
      if (disk.capacity > 2 * 1024 * 1024 * 1024 * 1024) {
        /* 2TO */
        throw new Error("Can't migrate disks larger than 2TiB")
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

  #connectToEsxi(host, user, password, sslVerify) {
    return Task.run({ properties: { name: `connecting to ${host}` } }, async () => {
      const esxi = new Esxi(host, user, password, sslVerify)
      await fromEvent(esxi, 'ready')
      return esxi
    })
  }

  async connectToEsxiAndList({ host, user, password, sslVerify }) {
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)
    return esxi.getAllVmMetadata()
  }

  @decorateWith(deferrable)
  async migrationfromEsxi(
    $defer,
    { host, user, password, sslVerify, sr: srId, network: networkId, vm: vmId, stopSource }
  ) {
    const app = this._app
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)

    const esxiVmMetadata = await Task.run({ properties: { name: `get metadata of ${vmId}` } }, async () => {
      return esxi.getTransferableVmMetadata(vmId)
    })

    const { disks, firmware, memory, name_label, networks, nCpus, powerState, snapshots } = esxiVmMetadata
    const isRunning = powerState !== 'poweredOff'

    const chainsByNodes = await Task.run(
      { properties: { name: `build disks and snapshots chains for ${vmId}` } },
      async () => {
        return this.#buildDiskChainByNode(disks, snapshots)
      }
    )

    const sr = app.getXapiObject(srId)
    const xapi = sr.$xapi

    const vm = await Task.run({ properties: { name: 'creating MV on XCP side' } }, async () => {
      // got data, ready to start creating
      const vm = await xapi._getOrWaitObject(
        await xapi.VM_create({
          ...OTHER_CONFIG_TEMPLATE,
          memory_dynamic_max: memory,
          memory_dynamic_min: memory,
          memory_static_max: memory,
          memory_static_min: memory,
          name_description: 'from esxi',
          name_label,
          VCPUs_at_startup: nCpus,
          VCPUs_max: nCpus,
        })
      )
      await Promise.all([
        vm.update_HVM_boot_params('firmware', firmware),
        vm.update_platform('device-model', 'qemu-upstream-' + (firmware === 'uefi' ? 'uefi' : 'compat')),
        asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'Esxi migration in progress...')),
        vm.set_name_label(`[Importing...] ${name_label}`),
      ])

      const vifDevices = await xapi.call('VM.get_allowed_VIF_devices', vm.$ref)

      await Promise.all(
        networks.map((network, i) =>
          xapi.VIF_create(
            {
              device: vifDevices[i],
              network: app.getXapiObject(networkId).$ref,
              VM: vm.$ref,
            },
            {
              MAC: network.macAddress,
            }
          )
        )
      )
      return vm
    })
    $defer.onFailure.call(xapi, 'VM_destroy', vm.$ref)

    const vhds = await Promise.all(
      Object.keys(chainsByNodes).map(async (node, userdevice) =>
        Task.run({ properties: { name: `Cold import of disks ${node}` } }, async () => {
          const chainByNode = chainsByNodes[node]
          let vdi
          let parentVhd, vhd
          // if the VM is running we'll transfer everything before the last , which is an active disk
          //  the esxi api does not allow us to read an active disk
          // later we'll stop the VM and transfer this snapshot
          const nbColdDisks = isRunning ? chainByNode.length - 1 : chainByNode.length
          for (let diskIndex = 0; diskIndex < nbColdDisks; diskIndex++) {
            // the first one  is a RAW disk ( full )
            const disk = chainByNode[diskIndex]
            const { capacity, descriptionLabel, fileName, nameLabel, path, datastore, isFull } = disk
            if (isFull) {
              vhd = await VhdEsxiRaw.open(esxi, datastore, path + '/' + fileName, { thin: false })
              // we don't need to read the BAT with the importVdiThroughXva process
              const vdiMetadata = {
                name_description: 'fromESXI' + descriptionLabel,
                name_label: '[ESXI]' + nameLabel,
                SR: sr.$ref,
                virtual_size: capacity,
              }
              vdi = await importVdiThroughXva(vdiMetadata, vhd, xapi, sr)

              // it can fail before the vdi is connected to the vm
              $defer.onFailure.call(xapi, 'VDI_destroy', vdi.$ref)
              await xapi.VBD_create({
                VDI: vdi.$ref,
                VM: vm.$ref,
                device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
                userdevice: userdevice < 3 ? userdevice : userdevice + 1,
              })
            } else {
              vhd = await openDeltaVmdkasVhd(esxi, datastore, path + '/' + fileName, parentVhd, {
                lookMissingBlockInParent: false,
              })
            }
            vhd.label = fileName
            parentVhd = vhd
          }
          if (nbColdDisks > 1 /* got a cold snapshot chain */) {
            // it can be empty if the VM don't have a snapshot and is running
            const stream = vhd.stream()
            await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
          }
          return vhd
        })
      )
    )

    if (isRunning && stopSource) {
      // it the vm was running, we stop it and transfer the data in the active disk
      await Task.run({ properties: { name: 'powering down source VM' } }, () => esxi.powerOff(vmId))

      await Promise.all(
        Object.keys(chainsByNodes).map(async (node, userdevice) => {
          await Task.run({ properties: { name: `Transfering deltas of ${userdevice}` } }, async () => {
            const chainByNode = chainsByNodes[node]
            const disk = chainByNode[chainByNode.length - 1]
            const { capacity, descriptionLabel, fileName, nameLabel, path, datastore, isFull } = disk
            let { vdi, vhd: parentVhd } = vhds[userdevice]
            let vhd
            if (vdi === undefined) {
              throw new Error(`Can't import delta of a running VM without its parent vdi`)
            }
            if (isFull) {
              vhd = await VhdEsxiRaw.open(esxi, datastore, path + '/' + fileName, { thin: false })
              // we don't need to read the BAT with the importVdiThroughXva process
              const vdiMetadata = {
                name_description: 'fromESXI' + descriptionLabel,
                name_label: '[ESXI]' + nameLabel,
                SR: sr.$ref,
                virtual_size: capacity,
              }
              vdi = await importVdiThroughXva(vdiMetadata, vhd, xapi, sr)
              // it can fail before the vdi is connected to the vm
              $defer.onFailure.call(xapi, 'VDI_destroy', vdi.$ref)
              await xapi.VBD_create({
                VDI: vdi.$ref,
                VM: vm.$ref,
                device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
                userdevice: userdevice < 3 ? userdevice : userdevice + 1,
              })
            } else {
              if (parentVhd === undefined) {
                throw new Error(`Can't import delta of a running VM without its parent VHD`)
              }
              // we only want to transfer blocks present in the delta vhd, not the full vhd chain
              vhd = await openDeltaVmdkasVhd(esxi, datastore, path + '/' + fileName, parentVhd, {
                lookMissingBlockInParent: false,
              })
            }
            const stream = vhd.stream()

            await vdi.$importContent(stream, { format: VDI_FORMAT_VHD })
          })
        })
      )
    }

    await Task.run({ properties: { name: 'Finishing transfer' } }, async () => {
      // remove the importing in label
      await vm.set_name_label(esxiVmMetadata.name_label)

      // remove lock on start
      await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))
    })

    return vm.uuid
  }
}
