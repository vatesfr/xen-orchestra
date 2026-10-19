import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { fromEvent } from 'promise-toolbox'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { createLogger } from '@xen-orchestra/log'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'
import { checkDependencies } from '@xen-orchestra/vmware-explorer/checks.mjs'
import { VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import OTHER_CONFIG_TEMPLATE from '../../xapi/other-config-template.mjs'
import { importDisksFromDatastore, importStream } from './importDisksfromDatastore.mjs'
import { buildDiskChainByNode } from './buildChainByNode.mjs'
import { assertKnownDevices } from './_deviceMapping.mjs'
import { repairImportedVm } from './_repair.mjs'
import { describeRepair, REPAIR_ISO_VERSION, replaceRepairDescription } from './_repairInputs.mjs'
import { firstBootOfRepairedVm } from './_firstBoot.mjs'
import { finished, PassThrough } from 'node:stream'
import { Ref } from 'xen-api'

const { warn } = createLogger('xo:mixins:vmware')

// written with `sourceVmId` on the imported VM: the id of a VM is only meaningful on its platform.
// The imports made before this key existed are all from VMware
const SOURCE_PLATFORM = 'vmware'
const isFromThisPlatform = otherConfig => (otherConfig.sourcePlatform ?? SOURCE_PLATFORM) === SOURCE_PLATFORM

// VMware guest ids of Windows: `windows2019srv_64Guest`, `winNetStandardGuest`…
const isWindowsGuest = guestId => /^win/i.test(guestId ?? '')

export default class MigrateVm {
  constructor(app) {
    this._app = app
  }

  #connectToEsxi(host, user, password, sslVerify) {
    return Task.run({ properties: { name: `connecting to ${host}` } }, async () => {
      const esxi = new Esxi(host, user, password, sslVerify)
      try {
        await fromEvent(esxi, 'ready')
      } catch (error) {
        // the login may have succeeded even though connecting did not, e.g. when it is listing the
        // datacenters which failed: that session would linger on the host until it expires
        await this.#closeEsxi(esxi, host)
        throw error
      }
      return esxi
    })
  }

  // a session is not released when this process ends, it lingers on the host until it expires, and
  // a host only accepts a limited number of them. Failing to close is not worth failing a job
  #closeEsxi(esxi, host) {
    return esxi.close().catch(error => warn('failed to close the ESXi session', { error, host }))
  }

  async connectToEsxiAndList({ host, user, password, sslVerify }) {
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)
    try {
      return await esxi.getAllVmMetadata()
    } finally {
      await this.#closeEsxi(esxi, host)
    }
  }

  async getEsxiInventory({ host, user, password, sslVerify }) {
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)
    try {
      return await esxi.getInventory()
    } finally {
      await this.#closeEsxi(esxi, host)
    }
  }

  async #findBaseVM(xapi, metadata) {
    const { vmId, snapshots } = metadata
    const candidates = Object.values(xapi.objects.indexes.type.VM).filter(
      object =>
        object.is_a_snapshot === false &&
        isFromThisPlatform(object.other_config) &&
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

    const props = { cpus: metadata.nCpus }
    if (metadata.memory >= xapiVm.memory_static_min) {
      props.memory = metadata.memory
    } else {
      warn(
        `cannot lower ${xapiVm.uuid}'s memory below its current minimum (${xapiVm.memory_static_min}), keeping it unchanged`
      )
    }

    await xapiVm.$xapi.editVm(xapiVm.$ref, props)
    return xapiVm
  }

  async #createVmAndNetworks($defer, { metadata, networkId, networkIdsByNic, template, xapi }) {
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
          // but it shouldn't be less than the actual memory
          memory_static_min: Math.min(template.memory_static_min, memory),
          name_description: `from esxi -- source guest id :${guestId} -- template used:${template.name_label}`,
          name_label,
          // Windows needs the Hyper-V enlightenments to run the XCP-ng PV drivers
          platform: isWindowsGuest(guestId) ? { ...template.platform, viridian: 'true' } : { ...template.platform },
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
              network: this._app.getXapiObject(networkIdsByNic?.[network.key] ?? networkId).$ref,
              VM: vm.$ref,
            },
            {
              MAC: network.macAddress,
            }
          )
          $defer.onFailure(() => xapi.call('VIF.destroy', ref))
        })
      )

      // even when the source has none: the repair ISO, and later the guest tools ISO, are inserted there
      const cdDriveRef = await xapi.VBD_create({ type: 'CD', VM: vm.$ref, VDI: Ref.EMPTY })
      $defer.onFailure(() => xapi.call('VBD.destroy', cdDriveRef))

      return vm
    })
  }

  async #importDisks($defer, { esxi, metadata, sr, srsByNode, stopSource, vm, vmId }) {
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
      () => {
        // a failure here is not fatal: the client logs in again when a call finds the session gone
        esxi.keepAlive().catch(error => warn('failed to keep the ESXi session alive', { error, vmId }))
      },
      15 * 60 * 1000
    )
    $defer(() => clearInterval(interval))
    await importDisksFromDatastore({
      chainsByNodes: coldChainsByNodes,
      esxi,
      sr,
      srsByNode,
      vm,
      vmId,
    })
    await sr.$xapi.setFieldEntries('VM', vm.$ref, 'other_config', {
      sourcePlatform: SOURCE_PLATFORM,
      sourceVmId: vmId,
      sourceSnapshotId: snapshots?.current,
    })
    await vm.$snapshot({ name_label: `after ${isRunning ? 'partial' : 'complete'} import from V2V` })
    if (isRunning) {
      if (stopSource) {
        await Task.run({ properties: { name: 'stopping source VM' } }, async () => {
          // a clean shut down when the guest allows it: a power off leaves the file systems dirty
          const stoppedBy = await esxi.shutdown(vmId, { signal: Task.abortSignal })
          if (stoppedBy === 'powerOff') {
            Task.warning('the guest could not be shut down cleanly, it was powered off')
          }
        })
        await importDisksFromDatastore({
          chainsByNodes,
          esxi,
          sr,
          srsByNode,
          vm,
          vmId,
        })
        await sr.$xapi.setFieldEntries('VM', vm.$ref, 'other_config', {
          sourcePlatform: SOURCE_PLATFORM,
          sourceVmId: vmId,
          sourceSnapshotId: null,
        })
        await vm.$snapshot({ name_label: 'complete import from V2V' })
      } else {
        await Task.info(`VM was running, no stop source. We'll keep the partial import.`)
      }
    }
  }

  // before the lock on start is removed: the VM cannot be started by somebody else between two runs of the ISO.
  // A failed repair does not fail the import: the data is there, the snapshot of the import is the rollback.
  // Returns the reports of the ISO, undefined when the guest has not been repaired
  async #repairVm({ isComplete, isoVersion, metadata, options, vm }) {
    if (!isComplete) {
      Task.info('the import is partial, the guest will be repaired once it is complete')
      return
    }
    const xapi = vm.$xapi
    try {
      const reports = await Task.run({ properties: { name: 'repairing the guest for XCP-ng' } }, () =>
        repairImportedVm({ xapi, vmRef: vm.$ref, metadata, options, isoVersion })
      )
      await xapi.setFieldEntries('VM', vm.$ref, 'other_config', { 'xo:v2v:repair': JSON.stringify(reports) })
      await this.#writeRepairDescription(vm, describeRepair({ reports, isoVersion }))
      return reports
    } catch (error) {
      warn('the guest could not be repaired', { error, vmId: vm.uuid, sourceVmId: metadata.vmId })
      Task.warning(`the guest could not be repaired: ${error.message}`)
      // the outputs of the ISO are gone from `xenstore_data`: the reports are all that is left to understand
      await xapi
        .setFieldEntries('VM', vm.$ref, 'other_config', {
          'xo:v2v:repair': JSON.stringify({ error: { code: error.code, message: error.message }, ...error.reports }),
        })
        .catch(storeError => warn('failed to store the repair report', { error: storeError, vmId: vm.uuid }))
      await this.#writeRepairDescription(vm, describeRepair({ reports: error.reports, error, isoVersion }))
    }
  }

  // what the repair did, where a user looks first. It is only a summary: a failure to write it fails nothing
  async #writeRepairDescription(vm, summary) {
    const xapi = vm.$xapi
    try {
      const description = await xapi.getField('VM', vm.$ref, 'name_description')
      await xapi.setField('VM', vm.$ref, 'name_description', replaceRepairDescription(description, summary))
    } catch (error) {
      warn('failed to write the repair summary in the description', { error, vmId: vm.uuid })
    }
  }

  // once the import is complete and the lock on start removed. A repaired guest is followed through its first
  // boot, which does not fail the import either
  async #startVm({ isoVersion, metadata, reports, vm }) {
    const xapi = vm.$xapi
    if (reports === undefined) {
      await Task.run({ properties: { name: 'starting the VM' } }, () => xapi.call('VM.start', vm.$ref, false, false))
      return
    }
    try {
      await Task.run({ properties: { name: 'first boot on XCP-ng' } }, () =>
        firstBootOfRepairedVm({ xapi, vmRef: vm.$ref, metadata, reports, isoVersion })
      )
    } catch (error) {
      warn('the first boot of the repaired guest failed', { error, vmId: vm.uuid, sourceVmId: metadata.vmId })
      Task.warning(`the first boot on XCP-ng failed: ${error.message}`)
      await xapi
        .setFieldEntries('VM', vm.$ref, 'other_config', {
          'xo:v2v:first-boot': JSON.stringify({
            error: { code: error.code, message: error.message },
            report: error.report,
          }),
        })
        .catch(storeError => warn('failed to store the first boot report', { error: storeError, vmId: vm.uuid }))
      await this.#writeRepairDescription(vm, describeRepair({ reports, firstBootError: error, isoVersion }))
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
      // optional overrides of `sr` by disk node (e.g. `scsi0:0`) and of `network` by NIC device key
      disks: srIdsByNode = {},
      nics: networkIdsByNic = {},
      vm: vmId,
      stopSource,
      template: templateId,
      // prepare the guest to boot on XCP-ng with the repair ISO, once the import is complete. Off by default
      repair = false,
      // start the VM once the import is complete, and follow the first boot of a repaired guest. Off by default
      startVm = false,
    }
  ) {
    const app = this._app
    const esxi = await this.#connectToEsxi(host, user, password, sslVerify)
    // every transfer is awaited below, nothing is left reading from the host when this returns
    $defer(() => this.#closeEsxi(esxi, host))
    const sr = app.getXapiObject(srId)
    const template = app.getXapiObject(templateId)
    const xapi = sr.$xapi

    let metadata = await Task.run({ properties: { name: `get metadata of ${vmId}` } }, async () => {
      return esxi.getTransferableVmMetadata(vmId)
    })
    // before anything is done on either side: a mapping which cannot be applied would import the
    // device to the default destination
    assertKnownDevices(metadata, { srIdsByNode, networkIdsByNic, vmId })
    const srsByNode = {}
    for (const [node, diskSrId] of Object.entries(srIdsByNode)) {
      srsByNode[node] = app.getXapiObject(diskSrId, 'SR')
    }

    if (!metadata.snapshots || !metadata.snapshots.current) {
      if (metadata.powerState !== 'poweredOff') {
        await Task.run({ properties: { name: `taking a snapshot of ${vmId}` } }, () => {
          return esxi.snapshot(vmId, '[V2V] migration to XCP-ng', 'created automatically during migration')
        })

        metadata = await Task.run(
          { properties: { name: `updating metadata of ${vmId} after taking a snapshot` } },
          () => esxi.getTransferableVmMetadata(vmId)
        )
      }
    }
    Task.abortSignal?.throwIfAborted()
    const vm = await this.#createVmAndNetworks($defer, { metadata, networkId, networkIdsByNic, template, xapi })
    Task.abortSignal?.throwIfAborted()
    await xapi.barrier()
    await this.#importDisks($defer, { esxi, metadata, stopSource, vm, sr, srsByNode, vmId })
    Task.abortSignal?.throwIfAborted()
    const isComplete = stopSource || metadata.powerState === 'poweredOff'
    const repairOptions = typeof repair === 'object' ? repair : {}
    // the build XO is tested with, unless another one is asked for, e.g. by a test of a specific build
    const isoVersion = repairOptions.isoVersion ?? REPAIR_ISO_VERSION
    let reports
    if (repair) {
      reports = await this.#repairVm({ isComplete, isoVersion, metadata, options: repairOptions, vm })
    }
    Task.abortSignal?.throwIfAborted()
    await Task.run({ properties: { name: 'Finishing transfer' } }, async () => {
      // remove the importing in label
      await vm.set_name_label(metadata.name_label)

      // remove lock on start if the VM has been completly imported
      if (isComplete) {
        await asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, null))
      }
    })

    if (startVm) {
      if (!isComplete) {
        Task.info('the import is partial, the VM is not started')
      } else if (repair && reports === undefined) {
        Task.warning('the VM is not started: its guest could not be repaired')
      } else {
        await this.#startVm({ isoVersion, metadata, reports, vm })
      }
    } else if (reports !== undefined && metadata.firmware === 'uefi' && metadata.secureBoot) {
      // the repair disabled it, the first boot would have enabled it again
      Task.warning('Secure Boot was enabled on the source: enable it again once the VM has booted')
    }

    return vm.uuid
  }

  async checkEsxiDependencies() {
    return checkDependencies()
  }

  async exportEsxiDisk({ disk: diskId, format, host, user, password, vm: vmId }) {
    const esxi = await this.#connectToEsxi(host, user, password, false)
    const metadata = await Task.run({ properties: { name: `get metadata of ${vmId}` } }, () => {
      return esxi.getTransferableVmMetadata(vmId)
    })

    const { disks, powerState, snapshots } = metadata

    const isRunning = powerState !== 'poweredOff'

    const chainsByNodes = await Task.run(
      { properties: { name: `build disks and snapshots chains for ${vmId}` } },
      () => {
        return buildDiskChainByNode(disks, snapshots)
      }
    )

    if (!diskId) {
      throw new Error(`No diskId provided, detected : ${Object.keys(chainsByNodes).join(',')}`)
    }
    if (!chainsByNodes[diskId]) {
      throw new Error(`disk ${diskId} is not in the migrable disks : ${Object.keys(chainsByNodes).join(',')}`)
    }
    const chain = chainsByNodes[diskId]
    if (isRunning) {
      if (chain.length < 2) {
        throw new Error(`Can't migrate any data from a running VM without a snapshot`)
      }
      chain.pop() // remove the active disk
    }
    const disk = chain.pop()
    const stream = new PassThrough()
    // the transfer outlives this call, so the session cannot be released before the stream is done
    importStream({ esxi, disk, vmId, format }, source => {
      stream.length = source.length
      source.pipe(stream)
      return new Promise((resolve, reject) => {
        finished(source, { writable: false }, error => {
          error ? reject(error) : resolve()
        })
        finished(stream, { readable: false }, error => {
          error ? reject(error) : resolve()
        })
      })
    })
      .catch(error => {
        // rethrowing was an unhandled rejection: nothing awaits this promise. Whoever reads the
        // stream is the one which has to learn about the failure
        warn('error while reading the disk from esxi', { diskId, error, vmId })
        stream.destroy(error)
      })
      .finally(() => this.#closeEsxi(esxi, host))
    return stream
  }

  async importEsxiDiskToSr({
    disk,
    format = VDI_FORMAT_VHD,
    host,
    user,
    password,
    sslVerify = true,
    sr: srId,
    vm: vmId,
  }) {
    const sr = this._app.getXapiObject(srId)
    const stream = await this.exportEsxiDisk({ disk, format, host, user, password, vm: vmId })
    const vdiRef = await sr.$importVdi(stream, { format, name_label: `[ESXI] ${vmId} / ${disk}` })
    return sr.$xapi.getObject(vdiRef).uuid
  }
}
