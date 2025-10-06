import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { fromEvent } from 'promise-toolbox'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'
import { checkVddkDependencies } from '@xen-orchestra/vmware-explorer/checks.mjs'
import OTHER_CONFIG_TEMPLATE from '../../xapi/other-config-template.mjs'
import { importDisksFromDatastore } from './importDisksfromDatastore.mjs'
import { buildDiskChainByNode } from './buildChainByNode.mjs'

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

  async #findBaseVM(xapi, metadata) {
    const { vmId, snapshots } = metadata
    const candidates = Object.values(xapi.objects.indexes.type.VM).filter(
      object =>
        object.is_a_snapshot === false &&
        object.other_config.sourceVmId === vmId &&
        object.other_config.sourceSnapshotId === snapshots?.current &&
        object.blocked_operations?.start === 'Esxi migration in progress...' &&
        object.blocked_operations?.start_on === 'Esxi migration in progress...'
    )
    if (candidates.length === 0) {
      Task.info(`No previously transfered VM found, do a full transfer`)
      return
    }
    if (candidates.length > 1) {
      Task.warning(`More than one candidate found, fall back to full import to ensure data security`)
      return
    }
    // exactly one VM found
    Task.info(`Found VM, resuming transfer.`)
    return candidates[0]
  }

  async #updateVmMetadata(xapiVm, metadata) {
    // update memory, nb cpu, name, description

    await xapiVm.$xapi.editVm(xapiVm.$ref, {
      cpus: metadata.nCpus,
      memory: metadata.memory,
    })
    return xapiVm
  }

  async #createVmAndNetworks($defer, { metadata, networkId, template, xapi }) {
    const { guestId, firmware, memory, name_label, networks, nCpus } = metadata

    const existingVm = await this.#findBaseVM(xapi, metadata)
    if (existingVm !== undefined) {
      return this.#updateVmMetadata(existingVm, metadata)
    }
    // no reliable candidate : create a new VM
    return await Task.run({ properties: { name: 'creating VM on XCP side' } }, async () => {
      // got data, ready to start creating
      const vm = await xapi._getOrWaitObject(
        await xapi.VM_create({
          ...OTHER_CONFIG_TEMPLATE,
          memory_dynamic_max: memory,
          memory_dynamic_min: memory,
          memory_static_max: memory,
          // allow the user to reduce the memory of this VM to the limit set by the template
          memory_static_min: template.memory_static_min,
          name_description: `from esxi -- source guest id :${guestId} -- template used:${template.name_label}`,
          name_label,
          platform: { ...template.platform },
          VCPUs_at_startup: nCpus,
          VCPUs_max: nCpus,
        })
      )
      $defer.onFailure(async () => {
        await xapi.call('VM.destroy', vm.$ref)
      })
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

  async #importDisks($defer, { esxi, metadata, sr, stopSource, vm, vmId }) {
    const { disks, powerState, snapshots } = metadata

    const isRunning = powerState !== 'poweredOff'

    if (isRunning && !stopSource) {
      Task.warning(`Data after the last snapshot on vmware won't be migrated to XCP-ng`)
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
    // ensure the vmware session stays alive
    const interval = setInterval(
      async () => {
        try {
          await esxi.fetchProperty('VirtualMachine', vmId, 'config')
        } catch (_) {}
      },
      15 * 60 * 1000
    )
    $defer(() => clearInterval(interval))
    await importDisksFromDatastore({
      chainsByNodes: coldChainsByNodes,
      esxi,
      sr,
      vm,
      vmId,
    })
    await sr.$xapi.setFieldEntries('VM', vm.$ref, 'other_config', {
      sourceVmId: vmId,
      sourceSnapshotId: snapshots?.current,
    })
    await vm.$snapshot({ name_label: `after ${isRunning ? 'partial' : 'complete'} import from V2V` })
    if (isRunning) {
      if (stopSource) {
        await esxi.powerOff(vmId)
        await importDisksFromDatastore({
          chainsByNodes,
          esxi,
          sr,
          vm,
          vmId,
        })
        await sr.$xapi.setFieldEntries('VM', vm.$ref, 'other_config', { sourceVmId: vmId, sourceSnapshotId: undefined })
        await vm.$snapshot({ name_label: 'complete import from V2V' })
      }
    }
  }
  @decorateWith(deferrable)
  async migrationfromEsxi(
    $defer,
    { host, user, password, sslVerify, sr: srId, network: networkId, vm: vmId, stopSource, template: templateId }
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
    await xapi.barrier()
    await this.#importDisks($defer, { esxi, metadata, stopSource, vm, sr, vmId })
    await Task.run({ properties: { name: 'Finishing transfer' } }, async () => {
      // remove the importing in label
      await vm.set_name_label(metadata.name_label)
      const wasStopped = metadata.powerState === 'poweredOff'

      // remove lock on start if the VM has been completly imported
      if (stopSource || wasStopped) {
        await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))
      }
    })

    return vm.uuid
  }

  async checkVddkDependencies() {
    return checkVddkDependencies()
  }
}
