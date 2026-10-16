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
import { finished, PassThrough } from 'node:stream'
import { Ref } from 'xen-api'

const { warn } = createLogger('xo:mixins:vmware')

// written with `sourceVmId` on the imported VM: the id of a VM is only meaningful on its platform.
// The imports made before this key existed are all from VMware
const SOURCE_PLATFORM = 'vmware'
const isFromThisPlatform = otherConfig => (otherConfig.sourcePlatform ?? SOURCE_PLATFORM) === SOURCE_PLATFORM

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

  async #createVmAndNetworks($defer, { metadata, networkId, template, xapi }) {
    const { cdrom, guestId, firmware, memory, name_label, networks, nCpus } = metadata

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

      if (cdrom) {
        const ref = await xapi.VBD_create({ type: 'CD', VM: vm.$ref, VDI: Ref.EMPTY })
        $defer.onFailure(() => xapi.call('VBD.destroy', ref))
      }

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
  @decorateWith(deferrable)
  async migrationfromEsxi(
    $defer,
    { host, user, password, sslVerify, sr: srId, network: networkId, vm: vmId, stopSource, template: templateId }
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

    // the change tracking of the host gives the blocks to read: every block the disk uses for the
    // full pass, powered off or not, and what changed since the snapshot for the delta pass. Without
    // it, a full pass reads the unallocated blocks too
    let isChangeTrackingEnabled = false
    let isChangeTrackingNew = false
    try {
      isChangeTrackingNew = await Task.run({ properties: { name: `enabling change tracking on ${vmId}` } }, () =>
        esxi.enableChangeTracking(vmId)
      )
      isChangeTrackingEnabled = true
    } catch (error) {
      // not fatal: the disks are read to find their blocks
      warn('failed to enable the change tracking on the source', { error, vmId })
      Task.warning(`the change tracking could not be enabled on the source: ${error.message}`)
    }

    const isRunning = metadata.powerState !== 'poweredOff'
    // a running VM is only read up to a snapshot
    const isSnapshotRequired = isRunning && !metadata.snapshots?.current
    // tracking only starts with the next snapshot: before it the host has no tracking file to answer
    // from, and an existing snapshot carries no changeId. This is checked on the source rather than
    // deduced from this run turning the tracking on: a previous run may have turned it on, then failed
    // before its snapshot. A partial import made from a snapshot without changeId is not resumed on
    // purpose: its delta can only be read from a COWD extent, which ESXi 7 and later no longer write,
    // the transfer starts over
    let isSnapshotUseful = isChangeTrackingNew
    if (isChangeTrackingEnabled && !isChangeTrackingNew && !isSnapshotRequired) {
      isSnapshotUseful = await esxi.isChangeTrackingReady(vmId, { signal: Task.abortSignal }).then(
        isReady => !isReady,
        error => {
          Task.abortSignal?.throwIfAborted()
          // not fatal: a snapshot which turns out useless costs less than a transfer without tracking
          warn('failed to check the change tracking of the source', { error, vmId })
          return true
        }
      )
    }

    if (isSnapshotRequired || isSnapshotUseful) {
      let snapshotTaskInfo
      try {
        snapshotTaskInfo = await Task.run({ properties: { name: `taking a snapshot of ${vmId}` } }, () => {
          return esxi.snapshot(vmId, '[V2V] migration to XCP-ng', 'created automatically during migration')
        })
      } catch (error) {
        if (isSnapshotRequired) {
          throw error
        }
        Task.abortSignal?.throwIfAborted()
        // not fatal, like the change tracking it would have started
        warn('failed to snapshot the source to start its change tracking', { error, vmId })
        Task.warning(`the source could not be snapshotted to start its change tracking: ${error.message}`)
      }

      const snapshotId = snapshotTaskInfo?.result?.$value
      if (!isRunning && snapshotId !== undefined) {
        // only taken to start the tracking, which outlives it: a powered off VM is read as it is,
        // nothing would ever remove this snapshot from the source
        await Task.run({ properties: { name: `removing the snapshot of ${vmId}` } }, () =>
          esxi.removeSnapshot(snapshotId)
        ).catch(error => {
          Task.abortSignal?.throwIfAborted()
          // not fatal: the import reads the chain of the disks, this snapshot included
          warn('failed to remove the snapshot which started the change tracking', { error, snapshotId, vmId })
          Task.warning(`the snapshot ${snapshotId} could not be removed from the source: ${error.message}`)
        })
      }

      if (snapshotTaskInfo !== undefined) {
        metadata = await Task.run(
          { properties: { name: `updating metadata of ${vmId} after taking a snapshot` } },
          () => esxi.getTransferableVmMetadata(vmId)
        )
      }
    }
    Task.abortSignal?.throwIfAborted()
    const vm = await this.#createVmAndNetworks($defer, { metadata, networkId, template, xapi })
    Task.abortSignal?.throwIfAborted()
    await xapi.barrier()
    await this.#importDisks($defer, { esxi, metadata, stopSource, vm, sr, vmId })
    Task.abortSignal?.throwIfAborted()
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
