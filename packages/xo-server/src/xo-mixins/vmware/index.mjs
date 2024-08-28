import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { fromEvent } from 'promise-toolbox'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'
import OTHER_CONFIG_TEMPLATE from '../../xapi/other-config-template.mjs'
import { importDisksFromDatastore } from './importDisksfromDatastore.mjs'
import { buildDiskChainByNode } from './buildChainByNode.mjs'
import { v4 as uuidv4 } from 'uuid'
import VhdEsxiStreamOptimized from '@xen-orchestra/vmware-explorer/VhdEsxiStreamOptimized.mjs'
import { importVdi as importVdiThroughXva } from '@xen-orchestra/xva/importVdi.mjs'

export default class MigrateVm {
  constructor(app) {
    this._app = app
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

  async #createVmAndNetworks($defer, { metadata, networkId, template, xapi }) {
    const { guestId, firmware, memory, name_label, networks, nCpus } = metadata
    return await Task.run({ properties: { name: 'creating VM on XCP side' } }, async () => {
      // got data, ready to start creating
      const vm = await xapi._getOrWaitObject(
        await xapi.VM_create({
          ...OTHER_CONFIG_TEMPLATE,
          memory_dynamic_max: memory,
          memory_dynamic_min: memory,
          // allow the user to reduce the memory of this VM to the limit set by the template
          memory_static_min: template.memory_static_min,
          name_description: `from esxi -- source guest id :${guestId} -- template used:${template.name_label}`,
          name_label,
          platform: { ...template.platform },
          VCPUs_at_startup: nCpus,
          VCPUs_max: nCpus,
        })
      )
      $defer.onFailure(() => xapi.call('VM.destroy', vm.$ref))
      await Promise.all([
        vm.update_HVM_boot_params('firmware', firmware),
        vm.update_platform('device-model', 'qemu-upstream-' + (firmware === 'uefi' ? 'uefi' : 'compat')),
        asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'Esxi migration in progress...')),
        vm.set_name_label(`[Importing...] ${name_label}`),
      ])

      const vifDevices = await xapi.call('VM.get_allowed_VIF_devices', vm.$ref)

      await Promise.all(
        networks.map(async (network, i) => {
          const ref = await xapi.VIF_create(
            {
              device: vifDevices[i],
              network: this._app.getXapiObject(networkId).$ref,
              VM: vm.$ref,
            },
            {
              MAC: network.macAddress,
            }
          )
          $defer.onFailure(() => xapi.call('VIF.destroy', ref))
        })
      )
      return vm
    })
  }

  #getTempDiskPath() {
    return `xo-vm-tmp/${uuidv4()}.vmdk`
  }

  async #importDisksExportVm($defer, { workDirRemote, vmId, vm, sr, esxi }) {
    const streams = await esxi.export(`${vmId}`)
    await Promise.all(
      Object.entries(streams).map(async ([key, stream], userdevice) => {
        const path = this.#getTempDiskPath()
        $defer(() => workDirRemote.unlink(path))
        await workDirRemote.outputStream(path, stream)
        const vhd = new VhdEsxiStreamOptimized(workDirRemote, path)
        await vhd.readHeaderAndFooter()
        await vhd.readBlockAllocationTable()
        const vdiMetadata = {
          name_description: key,
          name_label: '[ESXI][VSAN]' + key,
          SR: sr.$ref,
          virtual_size: vhd.footer.currentSize,
        }
        const vdi = await importVdiThroughXva(vdiMetadata, vhd, sr.$xapi, sr)
        $defer.onFailure(() => sr.$xapi.call('VDI.destroy', vdi.$ref))
        const vbd = await sr.$xapi.VBD_create({
          VDI: vdi.$ref,
          VM: vm.$ref,
          device: `xvd${String.fromCharCode('a'.charCodeAt(0) + userdevice)}`,
          userdevice: String(userdevice < 3 ? userdevice : userdevice + 1),
        })
        $defer.onFailure(() => sr.$xapi.call('VBD.destroy', vbd))
      })
    )
  }

  async #importDisks($defer, { esxi, dataStoreToHandlers, metadata, sr, stopSource, vm, vmId, workDirRemote }) {
    const { disks, powerState, snapshots } = metadata
    if (disks.some(({ usingVsan }) => usingVsan)) {
      Task.info('Some VM storages use VSAN, fall back to compatible API')
      return this.#importDisksExportVm($defer, { workDirRemote, vmId, vm, sr, esxi })
    }

    const isRunning = powerState !== 'poweredOff'

    if (isRunning && !stopSource) {
      Task.warning(`Data in the latest snapshot won't be migrated to XCP-ng`)
    }
    const chainsByNodes = await Task.run(
      { properties: { name: `build disks and snapshots chains for ${vmId}` } },
      async () => {
        return buildDiskChainByNode(disks, snapshots)
      }
    )

    const coldChainsByNodes = {}
    const runningChainByNodes = {}
    Object.entries(chainsByNodes).forEach(([key, chain]) => {
      const chainCopy = [...chain]
      if (isRunning) {
        const running = chainCopy.pop() // cold chain does not contain the running one anymore
        runningChainByNodes[key] = [running]
      }
      coldChainsByNodes[key] = chainCopy
    })

    const vhds = await importDisksFromDatastore($defer, {
      esxi,
      dataStoreToHandlers,
      vm,
      chainsByNodes: coldChainsByNodes,
      sr,
      vmId,
    })
    if (isRunning && stopSource) {
      await esxi.powerOff(vmId)
      await importDisksFromDatastore($defer, {
        esxi,
        dataStoreToHandlers,
        vm,
        chainsByNodes: runningChainByNodes,
        sr,
        vmId,
        vhds,
      })
    }
  }
  @decorateWith(deferrable)
  async migrationfromEsxi(
    $defer,
    {
      host,
      user,
      password,
      sslVerify,
      sr: srId,
      network: networkId,
      vm: vmId,
      stopSource,
      template: templateId,
      dataStoreToHandlers,
      workDirRemote,
    }
  ) {
    const app = this._app
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)
    const sr = app.getXapiObject(srId)
    const template = app.getXapiObject(templateId)
    const xapi = sr.$xapi

    const metadata = await Task.run({ properties: { name: `get metadata of ${vmId}` } }, async () => {
      return esxi.getTransferableVmMetadata(vmId)
    })

    const vm = await this.#createVmAndNetworks($defer, { metadata, networkId, template, xapi })

    $defer.onFailure.call(xapi, 'VM_destroy', vm.$ref)
    await this.#importDisks($defer, { esxi, dataStoreToHandlers, metadata, stopSource, vm, sr, vmId, workDirRemote })

    await Task.run({ properties: { name: 'Finishing transfer' } }, async () => {
      // remove the importing in label
      await vm.set_name_label(metadata.name_label)

      // remove lock on start
      await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))
    })

    return vm.uuid
  }
}
