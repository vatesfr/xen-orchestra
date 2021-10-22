/* eslint eslint-comments/disable-enable-pair: [error, {allowWholeFile: true}] */
/* eslint-disable camelcase */
import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import fatfs from 'fatfs'
import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import flatMap from 'lodash/flatMap.js'
import flatten from 'lodash/flatten.js'
import groupBy from 'lodash/groupBy.js'
import identity from 'lodash/identity.js'
import includes from 'lodash/includes.js'
import isEmpty from 'lodash/isEmpty.js'
import mapToArray from 'lodash/map.js'
import mixin from '@xen-orchestra/mixin/legacy.js'
import ms from 'ms'
import noop from 'lodash/noop.js'
import omit from 'lodash/omit.js'
import once from 'lodash/once.js'
import semver from 'semver'
import tarStream from 'tar-stream'
import uniq from 'lodash/uniq.js'
import { asyncMap } from '@xen-orchestra/async-map'
import { vmdkToVhd } from 'xo-vmdk-to-vhd'
import { cancelable, fromEvents, ignoreErrors, pCatch, pRetry } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { parseDuration } from '@vates/parse-duration'
import { PassThrough } from 'stream'
import { forbiddenOperation, operationFailed } from 'xo-common/api-errors.js'
import { Xapi as XapiBase } from '@xen-orchestra/xapi'
import { Ref } from 'xen-api'
import { synchronized } from 'decorator-synchronized'

import ensureArray from '../_ensureArray.mjs'
import fatfsBuffer, { init as fatfsBufferInit } from '../fatfs-buffer.mjs'
import { asyncMapValues } from '../_asyncMapValues.mjs'
import { camelToSnakeCase, forEach, map, parseSize, pDelay, promisifyAll } from '../utils.mjs'

import mixins from './mixins/index.mjs'
import OTHER_CONFIG_TEMPLATE from './other-config-template.mjs'
import {
  asBoolean,
  asInteger,
  extractOpaqueRef,
  filterUndefineds,
  canSrHaveNewVdiOfSize,
  isVmHvm,
  isVmRunning,
  optional,
  parseDateTime,
  prepareXapiParam,
} from './utils.mjs'
import { createVhdStreamWithLength } from 'vhd-lib'

const log = createLogger('xo:xapi')

// ===================================================================

const TAG_BASE_DELTA = 'xo:base_delta'
export const TAG_COPY_SRC = 'xo:copy_of'

// ===================================================================

export * from './utils.mjs'

// VDI formats. (Raw is not available for delta vdi.)
export const VDI_FORMAT_VHD = 'vhd'
export const VDI_FORMAT_RAW = 'raw'

export const IPV4_CONFIG_MODES = ['None', 'DHCP', 'Static']
export const IPV6_CONFIG_MODES = ['None', 'DHCP', 'Static', 'Autoconf']

// ===================================================================

@mixin(Object.values(mixins))
export default class Xapi extends XapiBase {
  constructor({
    guessVhdSizeOnImport,
    maxUncoalescedVdis,
    restartHostTimeout,
    vdiExportConcurrency,
    vmExportConcurrency,
    vmSnapshotConcurrency,
    ...opts
  }) {
    super(opts)

    this._guessVhdSizeOnImport = guessVhdSizeOnImport
    this._maxUncoalescedVdis = maxUncoalescedVdis
    this._restartHostTimeout = parseDuration(restartHostTimeout)

    //  close event is emitted when the export is canceled via browser. See https://github.com/vatesfr/xen-orchestra/issues/5535
    const waitStreamEnd = async stream => fromEvents(await stream, ['end', 'close'])
    this._exportVdi = limitConcurrency(vdiExportConcurrency, waitStreamEnd)(this._exportVdi)
    this.exportVm = limitConcurrency(vmExportConcurrency, waitStreamEnd)(this.exportVm)

    this._snapshotVm = limitConcurrency(vmSnapshotConcurrency)(this._snapshotVm)

    // Patch getObject to resolve _xapiId property.
    this.getObject = (
      getObject =>
      (...args) => {
        let tmp
        if ((tmp = args[0]) != null && (tmp = tmp._xapiId) != null) {
          args[0] = tmp
        }
        return getObject.apply(this, args)
      }
    )(this.getObject)
  }

  // Wait for an object to be in a given state.
  //
  // Faster than waitObject() with a function.
  async _waitObjectState(idOrUuidOrRef, predicate) {
    const object = this.getObject(idOrUuidOrRef, null)
    if (object && predicate(object)) {
      return object
    }

    const loop = () => this.waitObject(idOrUuidOrRef).then(object => (predicate(object) ? object : loop()))

    return loop()
  }

  // Returns the objects if already presents or waits for it.
  async _getOrWaitObject(idOrUuidOrRef) {
    return this.getObject(idOrUuidOrRef, null) || this.waitObject(idOrUuidOrRef)
  }

  // =================================================================

  _setObjectProperties(object, props) {
    const { $ref: ref, $type: type } = object

    // TODO: the thrown error should contain the name of the
    // properties that failed to be set.
    return Promise.all(
      mapToArray(props, (value, name) => {
        if (value != null) {
          return this.call(`${type}.set_${camelToSnakeCase(name)}`, ref, prepareXapiParam(value))
        }
      })
    )::ignoreErrors()
  }

  // =================================================================

  setDefaultSr(srId) {
    return this.pool.set_default_SR(this.getObject(srId).$ref)
  }

  // =================================================================

  async setPoolMaster(hostId) {
    await this.call('pool.designate_new_master', this.getObject(hostId).$ref)
  }

  // =================================================================

  async joinPool(masterAddress, masterUsername, masterPassword, force = false) {
    await this.call(force ? 'pool.join_force' : 'pool.join', masterAddress, masterUsername, masterPassword)
  }

  // =================================================================

  async emergencyShutdownHost(hostId) {
    const host = this.getObject(hostId)
    const vms = host.$resident_VMs
    log.debug(`Emergency shutdown: ${host.name_label}`)
    await asyncMap(vms, vm => {
      if (!vm.is_control_domain) {
        return ignoreErrors.call(this.callAsync('VM.suspend', vm.$ref))
      }
    })
    await this.call('host.disable', host.$ref)
    await this.callAsync('host.shutdown', host.$ref)
  }

  // =================================================================

  // Disable the host and evacuate all its VMs.
  //
  // If `force` is false and the evacuation failed, the host is re-
  // enabled and the error is thrown.
  async clearHost({ $ref: hostRef, $pool: pool }, force) {
    await this.call('host.disable', hostRef)

    const migrationNetworkId = pool.other_config['xo:migrationNetwork']
    const migrationNetworkRef = migrationNetworkId && this.getObject(migrationNetworkId).$ref
    try {
      try {
        await (migrationNetworkRef === undefined
          ? this.callAsync('host.evacuate', hostRef)
          : this.callAsync('host.evacuate', hostRef, migrationNetworkRef))
      } catch (error) {
        if (error.code === 'MESSAGE_PARAMETER_COUNT_MISMATCH') {
          await this.callAsync('host.evacuate', hostRef)
        } else {
          throw error
        }
      }
    } catch (error) {
      if (!force) {
        await this.call('host.enable', hostRef)

        throw error
      }
    }
  }

  async disableHost(hostId) {
    await this.call('host.disable', this.getObject(hostId).$ref)
  }

  async forgetHost(hostId) {
    await this.callAsync('host.destroy', this.getObject(hostId).$ref)
  }

  async ejectHostFromPool(hostId) {
    await this.call('pool.eject', this.getObject(hostId).$ref)
  }

  async enableHost(hostId) {
    await this.call('host.enable', this.getObject(hostId).$ref)
  }

  async installCertificateOnHost(hostId, { certificate, chain = '', privateKey }) {
    try {
      await this.call('host.install_server_certificate', this.getObject(hostId).$ref, certificate, privateKey, chain)
    } catch (error) {
      // CH/XCP-ng reset the connection on the certificate install
      if (error.code !== 'ECONNRESET') {
        throw error
      }
    }
  }

  // Resources:
  // - Citrix XenServer ® 7.0 Administrator's Guide ch. 5.4
  // - https://github.com/xcp-ng/xenadmin/blob/60dd70fc36faa0ec91654ec97e24b7af36acff9f/XenModel/Actions/Host/EditMultipathAction.cs
  // - https://github.com/serencorbett1/xenadmin/blob/1c3fb0c1112e4e316423afc6a028066001d3dea1/XenModel/XenAPI-Extensions/SR.cs
  @decorateWith(deferrable.onError(log.warn))
  async setHostMultipathing($defer, hostId, multipathing) {
    const host = this.getObject(hostId)

    if (host.enabled) {
      await this.disableHost(hostId)
      $defer(() => this.enableHost(hostId))
    }

    // Xen center evacuate running VMs before unplugging the PBDs.
    // The evacuate method uses the live migration to migrate running VMs
    // from host to another. It only works when a shared SR is present
    // in the host. For this reason we chose to show a warning instead.
    const pluggedPbds = host.$PBDs.filter(pbd => pbd.currently_attached)
    await asyncMapSettled(pluggedPbds, async pbd => {
      const ref = pbd.$ref
      await this.unplugPbd(ref)
      $defer(() => this.plugPbd(ref))
    })

    return host.update_other_config(
      multipathing
        ? {
            multipathing: 'true',
            multipathhandle: 'dmp',
          }
        : {
            multipathing: 'false',
          }
    )
  }

  async powerOnHost(hostId) {
    await this.callAsync('host.power_on', this.getObject(hostId).$ref)
  }

  async rebootHost(hostId, force = false) {
    const host = this.getObject(hostId)

    await this.clearHost(host, force)
    await this.callAsync('host.reboot', host.$ref)
  }

  async restartHostAgent(hostId) {
    await this.callAsync('host.restart_agent', this.getObject(hostId).$ref)
  }

  async setRemoteSyslogHost(hostId, syslogDestination) {
    const host = this.getObject(hostId)
    await host.set_logging({
      syslog_destination: syslogDestination,
    })
    await this.call('host.syslog_reconfigure', host.$ref)
  }

  async shutdownHost(hostId, force = false) {
    const host = this.getObject(hostId)

    await this.clearHost(host, force)
    await this.callAsync('host.shutdown', host.$ref)
  }

  // =================================================================

  // Clone a VM: make a fast copy by fast copying each of its VDIs
  // (using snapshots where possible) on the same SRs.
  _cloneVm(vm, nameLabel = vm.name_label) {
    log.debug(`Cloning VM ${vm.name_label}${nameLabel !== vm.name_label ? ` as ${nameLabel}` : ''}`)

    return this.callAsync('VM.clone', vm.$ref, nameLabel).then(extractOpaqueRef)
  }

  // Copy a VM: make a normal copy of a VM and all its VDIs.
  //
  // If a SR is specified, it will contains the copies of the VDIs,
  // otherwise they will use the SRs they are on.
  async _copyVm(vm, nameLabel = vm.name_label, sr = undefined) {
    let snapshot
    if (isVmRunning(vm)) {
      snapshot = await this._snapshotVm(vm)
    }

    log.debug(
      `Copying VM ${vm.name_label}${nameLabel !== vm.name_label ? ` as ${nameLabel}` : ''}${
        sr ? ` on ${sr.name_label}` : ''
      }`
    )

    try {
      return await this.call('VM.copy', snapshot ? snapshot.$ref : vm.$ref, nameLabel, sr ? sr.$ref : '')
    } finally {
      if (snapshot) {
        await this.VM_destroy(snapshot.$ref)
      }
    }
  }

  async cloneVm(vmId, { nameLabel = undefined, fast = true } = {}) {
    const vm = this.getObject(vmId)

    const cloneRef = await (fast ? this._cloneVm(vm, nameLabel) : this._copyVm(vm, nameLabel))

    return /* await */ this._getOrWaitObject(cloneRef)
  }

  async copyVm(vmId, { nameLabel = undefined, srOrSrId = undefined } = {}) {
    return /* await */ this._getOrWaitObject(
      await this._copyVm(this.getObject(vmId), nameLabel, srOrSrId !== undefined ? this.getObject(srOrSrId) : undefined)
    )
  }

  async remoteCopyVm(vmId, targetXapi, targetSrId, { compress, nameLabel = undefined } = {}) {
    // Fall back on local copy if possible.
    if (targetXapi === this) {
      return {
        vm: await this.copyVm(vmId, { nameLabel, srOrSrId: targetSrId }),
      }
    }

    const sr = targetXapi.getObject(targetSrId)
    const stream = await this.exportVm(vmId, {
      compress,
    })

    const onVmCreation = nameLabel !== undefined ? vm => vm.set_name_label(nameLabel) : null

    const vm = await targetXapi._getOrWaitObject(await targetXapi._importVm(stream, sr, onVmCreation))

    return {
      vm,
    }
  }

  // Low level create VM.
  _createVmRecord(
    {
      actions_after_crash,
      actions_after_reboot,
      actions_after_shutdown,
      affinity,
      // appliance,
      blocked_operations,
      domain_type, // Used when the VM is created Suspended
      generation_id,
      ha_always_run,
      ha_restart_priority,
      has_vendor_device = false, // Avoid issue with some Dundee builds.
      hardware_platform_version,
      HVM_boot_params,
      HVM_boot_policy,
      HVM_shadow_multiplier,
      is_a_template,
      last_boot_CPU_flags, // Used when the VM is created Suspended
      last_booted_record, // Used when the VM is created Suspended
      memory_dynamic_max,
      memory_dynamic_min,
      memory_static_max,
      memory_static_min,
      name_description,
      name_label,
      order,
      other_config,
      PCI_bus,
      platform,
      protection_policy,
      PV_args,
      PV_bootloader,
      PV_bootloader_args,
      PV_kernel,
      PV_legacy_args,
      PV_ramdisk,
      recommendations,
      shutdown_delay,
      start_delay,
      // suspend_SR,
      tags,
      user_version,
      VCPUs_at_startup,
      VCPUs_max,
      VCPUs_params,
      version,
      xenstore_data,
    },
    {
      // if set, will create the VM in Suspended power_state with this VDI
      //
      // it's a separate param because it's not supported for all versions of
      // XCP-ng/XenServer and should be passed explicitly
      suspend_VDI,
    } = {}
  ) {
    log.debug(`Creating VM ${name_label}`)

    return this.call(
      'VM.create',
      filterUndefineds({
        actions_after_crash,
        actions_after_reboot,
        actions_after_shutdown,
        affinity: affinity == null ? Ref.EMPTY : affinity,
        HVM_boot_params,
        HVM_boot_policy,
        is_a_template: asBoolean(is_a_template),
        memory_dynamic_max: asInteger(memory_dynamic_max),
        memory_dynamic_min: asInteger(memory_dynamic_min),
        memory_static_max: asInteger(memory_static_max),
        memory_static_min: asInteger(memory_static_min),
        other_config,
        PCI_bus,
        platform,
        PV_args,
        PV_bootloader,
        PV_bootloader_args,
        PV_kernel,
        PV_legacy_args,
        PV_ramdisk,
        recommendations,
        user_version: asInteger(user_version),
        VCPUs_at_startup: asInteger(VCPUs_at_startup),
        VCPUs_max: asInteger(VCPUs_max),
        VCPUs_params,

        // Optional fields.
        blocked_operations,
        generation_id,
        ha_always_run: asBoolean(ha_always_run),
        ha_restart_priority,
        has_vendor_device,
        hardware_platform_version: optional(hardware_platform_version, asInteger),
        // HVM_shadow_multiplier: asFloat(HVM_shadow_multiplier), // FIXME: does not work FIELD_TYPE_ERROR(hVM_shadow_multiplier)
        name_description,
        name_label,
        order: optional(order, asInteger),
        protection_policy,
        shutdown_delay: asInteger(shutdown_delay),
        start_delay: asInteger(start_delay),
        tags,
        version: asInteger(version),
        xenstore_data,

        // VM created Suspended
        power_state: suspend_VDI !== undefined ? 'Suspended' : undefined,
        suspend_VDI,
        domain_type,
        last_boot_CPU_flags,
        last_booted_record,
      })
    )
  }

  getVmConsole(vmId) {
    const vm = this.getObject(vmId)

    const console = find(vm.$consoles, { protocol: 'rfb' })
    if (!console) {
      throw new Error('no RFB console found')
    }

    return console
  }

  // Returns a stream to the exported VM.
  @cancelable
  async exportVm($cancelToken, vmId, { compress = false } = {}) {
    const vm = this.getObject(vmId)
    const useSnapshot = isVmRunning(vm)
    const exportedVm = useSnapshot ? await this._snapshotVm($cancelToken, vm, `[XO Export] ${vm.name_label}`) : vm

    const promise = this.getResource($cancelToken, '/export/', {
      query: {
        ref: exportedVm.$ref,
        use_compression: compress === 'zstd' ? 'zstd' : compress === true || compress === 'gzip' ? 'true' : 'false',
      },
      task: this.task_create('VM export', vm.name_label),
    }).catch(error => {
      // augment the error with as much relevant info as possible
      error.pool_master = this.pool.$master
      error.VM = exportedVm

      throw error
    })

    if (useSnapshot) {
      const destroySnapshot = () => this.VM_destroy(exportedVm.$ref)::ignoreErrors()
      promise.then(_ => _.task.finally(destroySnapshot), destroySnapshot)
    }

    return promise
  }

  // Create a snapshot (if necessary) of the VM and returns a delta export
  // object.
  @cancelable
  @decorateWith(deferrable)
  async exportDeltaVm(
    $defer,
    $cancelToken,
    vmId,
    baseVmId,
    {
      bypassVdiChainsCheck = false,

      // Contains a vdi.$id set of vmId.
      fullVdisRequired = [],

      disableBaseTags = false,
      snapshotNameLabel = undefined,
    } = {}
  ) {
    let vm = this.getObject(vmId)

    // do not use the snapshot name in the delta export
    const exportedNameLabel = vm.name_label
    if (!vm.is_a_snapshot) {
      if (!bypassVdiChainsCheck) {
        await this.VM_assertHealthyVdiChains(vm.$ref)
      }

      vm = await this._snapshotVm($cancelToken, vm, snapshotNameLabel)
      $defer.onFailure(() => this.VM_destroy(vm.$ref))
    }

    const baseVm = baseVmId && this.getObject(baseVmId)

    // refs of VM's VDIs → base's VDIs.
    const baseVdis = {}
    baseVm &&
      forEach(baseVm.$VBDs, vbd => {
        let vdi, snapshotOf
        if (
          (vdi = vbd.$VDI) &&
          (snapshotOf = vdi.$snapshot_of) &&
          !find(fullVdisRequired, id => snapshotOf.$id === id)
        ) {
          baseVdis[vdi.snapshot_of] = vdi
        }
      })

    const streams = {}
    const vdis = {}
    const vbds = {}
    forEach(vm.$VBDs, vbd => {
      let vdi
      if (vbd.type !== 'Disk' || !(vdi = vbd.$VDI)) {
        // Ignore this VBD.
        return
      }

      // If the VDI name start with `[NOBAK]`, do not export it.
      if (vdi.name_label.startsWith('[NOBAK]')) {
        // FIXME: find a way to not create the VDI snapshot in the
        // first time.
        //
        // The snapshot must not exist otherwise it could break the
        // next export.
        vdi.$destroy()::ignoreErrors()
        return
      }

      vbds[vbd.$ref] = vbd

      const vdiRef = vdi.$ref
      if (vdiRef in vdis) {
        // This VDI has already been managed.
        return
      }

      // Look for a snapshot of this vdi in the base VM.
      const baseVdi = baseVdis[vdi.snapshot_of]

      vdis[vdiRef] = {
        ...vdi,
        other_config: {
          ...vdi.other_config,
          [TAG_BASE_DELTA]: baseVdi && !disableBaseTags ? baseVdi.uuid : undefined,
        },
        $SR$uuid: vdi.$SR.uuid,
      }

      streams[`${vdiRef}.vhd`] = () => this._exportVdi($cancelToken, vdi, baseVdi, VDI_FORMAT_VHD)
    })

    const suspendVdi = vm.$suspend_VDI
    if (suspendVdi !== undefined) {
      const vdiRef = suspendVdi.$ref
      vdis[vdiRef] = {
        ...suspendVdi,
        $SR$uuid: suspendVdi.$SR.uuid,
      }
      streams[`${vdiRef}.vhd`] = () => this._exportVdi($cancelToken, suspendVdi, undefined, VDI_FORMAT_VHD)
    }

    const vifs = {}
    forEach(vm.$VIFs, vif => {
      const network = vif.$network
      vifs[vif.$ref] = {
        ...vif,
        $network$uuid: network.uuid,
        $network$name_label: network.name_label,
        // https://github.com/babel/babel-eslint/issues/595
        // eslint-disable-next-line no-undef
        $network$VLAN: network.$PIFs[0]?.VLAN,
      }
    })

    return Object.defineProperty(
      {
        version: '1.1.0',
        vbds,
        vdis,
        vifs,
        vm: {
          ...vm,
          name_label: exportedNameLabel,
          other_config:
            baseVm && !disableBaseTags
              ? {
                  ...vm.other_config,
                  [TAG_BASE_DELTA]: baseVm.uuid,
                }
              : omit(vm.other_config, TAG_BASE_DELTA),
        },
      },
      'streams',
      {
        configurable: true,
        value: streams,
        writable: true,
      }
    )
  }

  @decorateWith(deferrable)
  async importDeltaVm(
    $defer,
    delta,
    {
      deleteBase = false,
      detectBase = true,
      disableStartAfterImport = true,
      mapVdisSrs = {},
      name_label = delta.vm.name_label,
      srId = this.pool.default_SR,
    } = {}
  ) {
    const { version } = delta

    if (!semver.satisfies(version, '^1')) {
      throw new Error(`Unsupported delta backup version: ${version}`)
    }

    let baseVm
    if (detectBase) {
      const remoteBaseVmUuid = delta.vm.other_config[TAG_BASE_DELTA]
      if (remoteBaseVmUuid) {
        baseVm = find(this.objects.all, obj => (obj = obj.other_config) && obj[TAG_COPY_SRC] === remoteBaseVmUuid)

        if (!baseVm) {
          throw new Error(`could not find the base VM (copy of ${remoteBaseVmUuid})`)
        }
      }
    }

    const baseVdis = {}
    baseVm &&
      forEach(baseVm.$VBDs, vbd => {
        const vdi = vbd.$VDI
        if (vdi !== undefined) {
          baseVdis[vbd.VDI] = vbd.$VDI
        }
      })

    // 0. Create suspend_VDI
    let suspendVdi
    if (delta.vm.power_state === 'Suspended') {
      const vdi = delta.vdis[delta.vm.suspend_VDI]
      suspendVdi = await this.createVdi({
        ...vdi,
        other_config: {
          ...vdi.other_config,
          [TAG_BASE_DELTA]: undefined,
          [TAG_COPY_SRC]: vdi.uuid,
        },
        sr: mapVdisSrs[vdi.uuid] || srId,
      })
      $defer.onFailure.call(this, 'VDI_destroy', suspendVdi.$ref)
    }

    // 1. Create the VMs.
    const vm = await this._getOrWaitObject(
      await this._createVmRecord(
        {
          ...delta.vm,
          affinity: null,
          blocked_operations: {
            ...delta.vm.blocked_operations,
            start: 'Importing…',
            start_on: 'Importing…',
          },
          ha_always_run: false,
          is_a_template: false,
          name_label: `[Importing…] ${name_label}`,
          other_config: {
            ...delta.vm.other_config,
            [TAG_COPY_SRC]: delta.vm.uuid,
          },
        },
        { suspend_VDI: suspendVdi?.$ref }
      )
    )
    $defer.onFailure(() => this.VM_destroy(vm.$ref))

    // 2. Delete all VBDs which may have been created by the import.
    await asyncMapSettled(vm.$VBDs, vbd => this._deleteVbd(vbd))::ignoreErrors()

    // 3. Create VDIs & VBDs.
    //
    // TODO: move all VDIs creation before the VM and simplify the code
    const vbds = groupBy(delta.vbds, 'VDI')
    const newVdis = await asyncMapValues(delta.vdis, async (vdi, vdiRef) => {
      let newVdi

      const remoteBaseVdiUuid = detectBase && vdi.other_config[TAG_BASE_DELTA]
      if (remoteBaseVdiUuid) {
        const baseVdi = find(baseVdis, vdi => vdi.other_config[TAG_COPY_SRC] === remoteBaseVdiUuid)
        if (!baseVdi) {
          throw new Error(`missing base VDI (copy of ${remoteBaseVdiUuid})`)
        }

        newVdi = await this._getOrWaitObject(await this._cloneVdi(baseVdi))
        $defer.onFailure(() => newVdi.$destroy())

        await newVdi.update_other_config(TAG_COPY_SRC, vdi.uuid)
      } else if (vdiRef === delta.vm.suspend_VDI) {
        // suspend VDI has been already created
        newVdi = suspendVdi
      } else {
        newVdi = await this.createVdi({
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: undefined,
            [TAG_COPY_SRC]: vdi.uuid,
          },
          sr: mapVdisSrs[vdi.uuid] || srId,
        })
        $defer.onFailure(() => newVdi.$destroy())
      }

      await asyncMapSettled(vbds[vdiRef], vbd =>
        this.createVbd({
          ...vbd,
          vdi: newVdi,
          vm,
        })
      )

      return newVdi
    })

    const networksByNameLabelByVlan = {}
    let defaultNetwork
    forEach(this.objects.all, object => {
      if (object.$type === 'network') {
        const pif = object.$PIFs[0]
        if (pif === undefined) {
          // ignore network
          return
        }
        const vlan = pif.VLAN
        const networksByNameLabel = networksByNameLabelByVlan[vlan] || (networksByNameLabelByVlan[vlan] = {})
        defaultNetwork = networksByNameLabel[object.name_label] = object
      }
    })

    const { streams } = delta

    await Promise.all([
      // Import VDI contents.
      asyncMapSettled(newVdis, async (vdi, id) => {
        for (let stream of ensureArray(streams[`${id}.vhd`])) {
          if (typeof stream === 'function') {
            stream = await stream()
          }
          await this._importVdiContent(vdi, stream, VDI_FORMAT_VHD)
        }
      }),

      // Wait for VDI export tasks (if any) termination.
      asyncMapSettled(streams, stream => stream.task),

      // Create VIFs.
      asyncMapSettled(delta.vifs, vif => {
        let network = vif.$network$uuid && this.getObject(vif.$network$uuid, undefined)

        if (network === undefined) {
          const { $network$VLAN: vlan = -1 } = vif
          const networksByNameLabel = networksByNameLabelByVlan[vlan]
          if (networksByNameLabel !== undefined) {
            network = networksByNameLabel[vif.$network$name_label]
            if (network === undefined) {
              network = networksByNameLabel[Object.keys(networksByNameLabel)[0]]
            }
          } else {
            network = defaultNetwork
          }
        }

        if (network) {
          return this._createVif(vm, network, vif)
        }
      }),
    ])

    if (deleteBase && baseVm) {
      this.VM_destroy(baseVm.$ref)::ignoreErrors()
    }

    await Promise.all([
      delta.vm.ha_always_run && vm.set_ha_always_run(true),
      vm.set_name_label(name_label),
      // FIXME: move
      asyncMap(['start', 'start_on'], op =>
        vm.update_blocked_operations(
          op,
          disableStartAfterImport ? 'Do not start this VM, clone it if you want to use it.' : null
        )
      ),
    ])

    return { vm }
  }

  async _migrateVmWithStorageMotion(
    vm,
    hostXapi,
    host,
    {
      migrationNetwork = find(host.$PIFs, pif => pif.management).$network, // TODO: handle not found
      sr,
      mapVdisSrs = {},
      mapVifsNetworks,
      force = false,
    }
  ) {
    const getDefaultSrRef = once(() => {
      if (sr !== undefined) {
        return hostXapi.getObject(sr).$ref
      }
      const defaultSr = host.$pool.$default_SR
      if (defaultSr === undefined) {
        throw new Error(`This operation requires a default SR to be set on the pool ${host.$pool.name_label}`)
      }
      return defaultSr.$ref
    })

    const hostPbds = new Set(host.PBDs)
    const connectedSrs = new Map()
    const isSrConnected = sr => {
      let isConnected = connectedSrs.get(sr.$ref)
      if (isConnected === undefined) {
        isConnected = sr.PBDs.some(ref => hostPbds.has(ref))
        connectedSrs.set(sr.$ref, isConnected)
      }
      return isConnected
    }

    // VDIs/SRs mapping
    // For VDI:
    // - If SR was explicitly passed: use it
    // - Else if VDI SR is reachable from the destination host: use it
    // - Else: use the migration main SR or the pool's default SR (error if none of them is defined)
    // For VDI-snapshot:
    // - If VDI-snapshot is an orphan snapshot: same logic as a VDI
    // - Else: don't add it to the map (VDI -> SR). It will be managed by the XAPI (snapshot will be migrated to the same SR as its parent active VDI)
    const vdis = {}
    const vbds = flatMap(vm.$snapshots, '$VBDs').concat(vm.$VBDs)
    for (const vbd of vbds) {
      if (vbd.type === 'Disk') {
        const vdi = vbd.$VDI
        // Ignore VDI snapshots which have a parent
        if (vdi.$snapshot_of !== undefined) {
          continue
        }
        vdis[vdi.$ref] =
          mapVdisSrs[vdi.$id] !== undefined
            ? hostXapi.getObject(mapVdisSrs[vdi.$id]).$ref
            : isSrConnected(vdi.$SR)
            ? vdi.$SR.$ref
            : getDefaultSrRef()
      }
    }

    // VIFs/Networks mapping
    const vifsMap = {}
    if (vm.$pool !== host.$pool) {
      const defaultNetworkRef = find(host.$PIFs, pif => pif.management).$network.$ref
      // Add snapshots' VIFs which VM has no VIFs on these devices
      const vmVifs = vm.$VIFs
      const vifDevices = new Set(vmVifs.map(_ => _.device))
      const vifs = flatMap(vm.$snapshots, '$VIFs')
        .filter(vif => !vifDevices.has(vif.device))
        .concat(vmVifs)
      for (const vif of vifs) {
        vifsMap[vif.$ref] =
          mapVifsNetworks && mapVifsNetworks[vif.$id]
            ? hostXapi.getObject(mapVifsNetworks[vif.$id]).$ref
            : defaultNetworkRef
      }
    }

    const token = await hostXapi.call('host.migrate_receive', host.$ref, migrationNetwork.$ref, {})

    const loop = () =>
      this.callAsync(
        'VM.migrate_send',
        vm.$ref,
        token,
        true, // Live migration.
        vdis,
        vifsMap,
        {
          force: force ? 'true' : 'false',
        }
        // FIXME: missing param `vgu_map`, it does not cause issues ATM but it
        // might need to be changed one day.
        // {},
      )::pCatch({ code: 'TOO_MANY_STORAGE_MIGRATES' }, () => pDelay(1e4).then(loop))

    return loop().then(noop)
  }

  @synchronized()
  _callInstallationPlugin(hostRef, vdi) {
    return this.call('host.call_plugin', hostRef, 'install-supp-pack', 'install', { vdi }).catch(error => {
      if (error.code !== 'XENAPI_PLUGIN_FAILURE' || !error.params?.[2]?.includes?.('UPDATE_ALREADY_APPLIED')) {
        throw error
      }
      log.warn('_callInstallationPlugin', { error })
    })
  }

  @decorateWith(deferrable)
  async installSupplementalPack($defer, stream, { hostId }) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const vdi = await this.createTemporaryVdiOnHost(
      stream,
      hostId,
      '[XO] Supplemental pack ISO',
      'small temporary VDI to store a supplemental pack ISO'
    )
    $defer(() => vdi.$destroy())

    await this._callInstallationPlugin(this.getObject(hostId).$ref, vdi.uuid)
  }

  @decorateWith(deferrable)
  async installSupplementalPackOnAllHosts($defer, stream) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const isSrAvailable = sr =>
      sr && sr.content_type === 'user' && sr.physical_size - sr.physical_utilisation >= stream.length

    const hosts = filter(this.objects.all, { $type: 'host' })

    const sr = this.findAvailableSharedSr(stream.length)

    // Shared SR available: create only 1 VDI for all the installations
    if (sr) {
      const vdi = await this.createTemporaryVdiOnSr(
        stream,
        sr,
        '[XO] Supplemental pack ISO',
        'small temporary VDI to store a supplemental pack ISO'
      )
      $defer(() => vdi.$destroy())

      // Install pack sequentially to prevent concurrent access to the unique VDI
      for (const host of hosts) {
        await this._callInstallationPlugin(host.$ref, vdi.uuid)
      }

      return
    }

    // No shared SR available: find an available local SR on each host
    return Promise.all(
      hosts.map(
        deferrable(async ($defer, host) => {
          // pipe stream synchronously to several PassThroughs to be able to pipe them asynchronously later
          const pt = stream.pipe(new PassThrough())
          pt.length = stream.length

          const sr = find(
            host.$PBDs.map(_ => _.$SR),
            isSrAvailable
          )

          if (!sr) {
            throw new Error('no SR available to store installation file')
          }

          const vdi = await this.createTemporaryVdiOnSr(
            pt,
            sr,
            '[XO] Supplemental pack ISO',
            'small temporary VDI to store a supplemental pack ISO'
          )
          $defer(() => vdi.$destroy())

          await this._callInstallationPlugin(host.$ref, vdi.uuid)
        })
      )
    )
  }

  @cancelable
  async _importVm($cancelToken, stream, sr, onVmCreation = undefined) {
    const taskRef = await this.task_create('VM import')
    const query = {}

    if (sr != null) {
      query.sr_id = sr.$ref
    }

    if (onVmCreation != null) {
      this.waitObject(
        obj => obj != null && obj.current_operations != null && taskRef in obj.current_operations,
        onVmCreation
      )
    }

    const vmRef = await this.putResource($cancelToken, stream, '/import/', {
      query,
      task: taskRef,
    }).then(extractOpaqueRef, error => {
      // augment the error with as much relevant info as possible
      error.pool_master = this.pool.$master
      error.SR = sr

      throw error
    })

    return vmRef
  }

  @decorateWith(deferrable)
  async _importOvaVm($defer, stream, { descriptionLabel, disks, memory, nameLabel, networks, nCpus, tables }, sr) {
    // 1. Create VM.
    const vm = await this._getOrWaitObject(
      await this._createVmRecord({
        ...OTHER_CONFIG_TEMPLATE,
        memory_dynamic_max: memory,
        memory_dynamic_min: memory,
        memory_static_max: memory,
        memory_static_min: memory,
        name_description: descriptionLabel,
        name_label: nameLabel,
        VCPUs_at_startup: nCpus,
        VCPUs_max: nCpus,
      })
    )
    $defer.onFailure(() => this.VM_destroy(vm.$ref))
    // Disable start and change the VM name label during import.
    await Promise.all([
      asyncMapSettled(['start', 'start_on'], op => vm.update_blocked_operations(op, 'OVA import in progress...')),
      vm.set_name_label(`[Importing...] ${nameLabel}`),
    ])

    // 2. Create VDIs & Vifs.
    const vdis = {}
    const compression = {}
    const vifDevices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
    if (networks.length > vifDevices.length) {
      throw operationFailed({ objectId: vm.id, code: 'TOO_MANY_VIFs' })
    }
    await Promise.all(
      map(disks, async disk => {
        const vdi = (vdis[disk.path] = await this.createVdi({
          name_description: disk.descriptionLabel,
          name_label: disk.nameLabel,
          size: disk.capacity,
          sr: sr.$ref,
        }))
        $defer.onFailure(() => vdi.$destroy())
        compression[disk.path] = disk.compression
        return this.createVbd({
          userdevice: String(disk.position),
          vdi,
          vm,
        })
      }).concat(
        map(networks, (networkId, i) =>
          this._createVif(vm, this.getObject(networkId), {
            device: vifDevices[i],
          })
        )
      )
    )

    // 3. Import VDIs contents.
    await new Promise((resolve, reject) => {
      const extract = tarStream.extract()

      stream.on('error', reject)

      extract.on('finish', resolve)
      extract.on('error', reject)
      extract.on('entry', async (entry, stream, cb) => {
        // Not a disk to import.
        const vdi = vdis[entry.name]
        if (!vdi) {
          stream.on('end', cb)
          stream.resume()
          return
        }
        const table = tables[entry.name]
        const vhdStream = await vmdkToVhd(
          stream,
          table.grainLogicalAddressList,
          table.grainFileOffsetList,
          compression[entry.name] === 'gzip'
        )
        try {
          await this._importVdiContent(vdi, vhdStream, VDI_FORMAT_VHD)
          // See: https://github.com/mafintosh/tar-stream#extracting
          // No import parallelization.
        } catch (e) {
          reject(e)
        } finally {
          cb()
        }
      })
      stream.pipe(extract)
    })

    // Enable start and restore the VM name label after import.
    await Promise.all([vm.update_blocked_operations({ start: null, start_on: null }), vm.set_name_label(nameLabel)])
    return vm
  }

  // TODO: an XVA can contain multiple VMs
  async importVm(stream, { data, srId, type = 'xva' } = {}) {
    const sr = srId && this.getObject(srId)

    if (type === 'xva') {
      return /* await */ this._getOrWaitObject(await this._importVm(stream, sr))
    }

    if (type === 'ova') {
      return this._getOrWaitObject(await this._importOvaVm(stream, data, sr))
    }

    throw new Error(`unsupported type: '${type}'`)
  }

  async migrateVm(vmId, hostXapi, hostId, { force = false, mapVdisSrs, mapVifsNetworks, migrationNetworkId, sr } = {}) {
    const vm = this.getObject(vmId)
    const host = hostXapi.getObject(hostId)

    const accrossPools = vm.$pool !== host.$pool
    const useStorageMotion =
      accrossPools ||
      sr !== undefined ||
      migrationNetworkId !== undefined ||
      !isEmpty(mapVifsNetworks) ||
      !isEmpty(mapVdisSrs)

    if (useStorageMotion) {
      await this._migrateVmWithStorageMotion(vm, hostXapi, host, {
        migrationNetwork: migrationNetworkId && hostXapi.getObject(migrationNetworkId),
        sr,
        mapVdisSrs,
        mapVifsNetworks,
        force,
      })
    } else {
      try {
        await this.callAsync('VM.pool_migrate', vm.$ref, host.$ref, {
          force: force ? 'true' : 'false',
        })
      } catch (error) {
        if (error.code !== 'VM_REQUIRES_SR') {
          throw error
        }

        // Retry using motion storage.
        await this._migrateVmWithStorageMotion(vm, hostXapi, host, { force })
      }
    }
  }

  @cancelable
  async _snapshotVm($cancelToken, { $ref: vmRef }, nameLabel) {
    const vm = await this.getRecord('VM', vmRef)
    if (nameLabel === undefined) {
      nameLabel = vm.name_label
    }

    log.debug(`Snapshotting VM ${vm.name_label}${nameLabel !== vm.name_label ? ` as ${nameLabel}` : ''}`)

    // see https://github.com/vatesfr/xen-orchestra/issues/4074
    const snapshotNameLabelPrefix = `Snapshot of ${vm.uuid} [`
    ignoreErrors.call(
      Promise.all(
        vm.snapshots.map(async ref => {
          const nameLabel = await this.getField('VM', ref, 'name_label')
          if (nameLabel.startsWith(snapshotNameLabelPrefix)) {
            return this.VM_destroy(ref)
          }
        })
      )
    )

    let ref
    do {
      if (!vm.tags.includes('xo-disable-quiesce')) {
        try {
          ref = await this.callAsync($cancelToken, 'VM.snapshot_with_quiesce', vmRef, nameLabel).then(extractOpaqueRef)
          ignoreErrors.call(this.call('VM.add_tags', ref, 'quiesce'))

          break
        } catch (error) {
          const { code } = error
          if (
            // removed in CH 8.1
            code !== 'MESSAGE_REMOVED' &&
            code !== 'VM_SNAPSHOT_WITH_QUIESCE_NOT_SUPPORTED' &&
            // quiesce only work on a running VM
            code !== 'VM_BAD_POWER_STATE' &&
            // quiesce failed, fallback on standard snapshot
            // TODO: emit warning
            code !== 'VM_SNAPSHOT_WITH_QUIESCE_FAILED'
          ) {
            throw error
          }
        }
      }
      ref = await this.callAsync($cancelToken, 'VM.snapshot', vmRef, nameLabel).then(extractOpaqueRef)
    } while (false)

    await this.setField('VM', ref, 'is_a_template', false)

    return this.getRecord('VM', ref)
  }

  async snapshotVm(vmId, nameLabel = undefined) {
    return /* await */ this._snapshotVm(this.getObject(vmId), nameLabel)
  }

  async _startVm(vm, { force = false, bypassMacAddressesCheck = force, hostId } = {}) {
    if (!bypassMacAddressesCheck) {
      const vmMacAddresses = vm.$VIFs.map(vif => vif.MAC)
      if (new Set(vmMacAddresses).size !== vmMacAddresses.length) {
        throw operationFailed({ objectId: vm.id, code: 'DUPLICATED_MAC_ADDRESS' })
      }

      const existingMacAddresses = new Set(
        filter(
          this.objects.all,
          obj => obj.id !== vm.id && obj.$type === 'VM' && obj.power_state === 'Running'
        ).flatMap(vm => vm.$VIFs.map(vif => vif.MAC))
      )
      if (vmMacAddresses.some(mac => existingMacAddresses.has(mac))) {
        throw operationFailed({ objectId: vm.id, code: 'DUPLICATED_MAC_ADDRESS' })
      }
    }

    log.debug(`Starting VM ${vm.name_label}`)

    if (force) {
      await vm.update_blocked_operations({ start: null, start_on: null })
    }

    return hostId === undefined
      ? this.call(
          'VM.start',
          vm.$ref,
          false, // Start paused?
          false // Skip pre-boot checks?
        )
      : this.callAsync('VM.start_on', vm.$ref, this.getObject(hostId).$ref, false, false)
  }

  async startVm(vmId, options) {
    try {
      await this._startVm(this.getObject(vmId), options)
    } catch (e) {
      if (e.code === 'OPERATION_BLOCKED') {
        throw forbiddenOperation('Start', e.params[1])
      }
      if (e.code === 'VM_BAD_POWER_STATE') {
        return e.params[2] === 'paused' ? this.unpauseVm(vmId) : this.resumeVm(vmId)
      }
      throw e
    }
  }

  async startVmOnCd(vmId) {
    const vm = this.getObject(vmId)

    if (isVmHvm(vm)) {
      const { order } = vm.HVM_boot_params

      await vm.update_HVM_boot_params('order', 'd')

      try {
        await this._startVm(vm)
      } finally {
        await vm.update_HVM_boot_params('order', order)
      }
    } else {
      // Find the original template by name (*sigh*).
      const templateNameLabel = vm.other_config.base_template_name
      const template =
        templateNameLabel &&
        find(this.objects.all, obj => obj.$type === 'VM' && obj.is_a_template && obj.name_label === templateNameLabel)

      const bootloader = vm.PV_bootloader
      const bootables = []
      try {
        const promises = []

        const cdDrive = this._getVmCdDrive(vm)
        forEach(vm.$VBDs, vbd => {
          promises.push(vbd.set_bootable(vbd === cdDrive))

          bootables.push([vbd, Boolean(vbd.bootable)])
        })

        promises.push(
          vm.set_PV_bootloader('eliloader'),
          vm.update_other_config({
            'install-distro': template && template.other_config['install-distro'],
            'install-repository': 'cdrom',
          })
        )

        await Promise.all(promises)

        await this._startVm(vm)
      } finally {
        vm.set_PV_bootloader(bootloader)::ignoreErrors()

        forEach(bootables, ([vbd, bootable]) => {
          vbd.set_bootable(bootable)::ignoreErrors()
        })
      }
    }
  }

  // =================================================================

  async createVbd({
    bootable = false,
    currently_attached = false,
    device = '',
    other_config = {},
    qos_algorithm_params = {},
    qos_algorithm_type = '',
    type = 'Disk',
    unpluggable = false,
    userdevice,
    VDI,
    VM,

    vdi = VDI,

    empty = vdi === undefined,
    mode = type === 'Disk' ? 'RW' : 'RO',
    vm = VM,
  }) {
    vdi = this.getObject(vdi)
    vm = this.getObject(vm)

    log.debug(`Creating VBD for VDI ${vdi.name_label} on VM ${vm.name_label}`)

    if (userdevice == null) {
      const allowed = await this.call('VM.get_allowed_VBD_devices', vm.$ref)
      const { length } = allowed
      if (length === 0) {
        throw new Error('no allowed VBD devices')
      }

      if (type === 'CD') {
        // Choose position 3 if allowed.
        userdevice = includes(allowed, '3') ? '3' : allowed[0]
      } else {
        userdevice = allowed[0]

        // Avoid userdevice 3 if possible.
        if (userdevice === '3' && length > 1) {
          userdevice = allowed[1]
        }
      }
    }

    const ifVmSuspended = vm.power_state === 'Suspended' ? identity : noop

    // By default a VBD is unpluggable.
    const vbdRef = await this.call('VBD.create', {
      bootable: Boolean(bootable),
      currently_attached: ifVmSuspended(currently_attached),
      device: ifVmSuspended(device),
      empty: Boolean(empty),
      mode,
      other_config,
      qos_algorithm_params,
      qos_algorithm_type,
      type,
      unpluggable: Boolean(unpluggable),
      userdevice,
      VDI: vdi && vdi.$ref,
      VM: vm.$ref,
    })

    if (isVmRunning(vm)) {
      await this.callAsync('VBD.plug', vbdRef)
    }
  }

  _cloneVdi(vdi) {
    log.debug(`Cloning VDI ${vdi.name_label}`)

    return this.callAsync('VDI.clone', vdi.$ref).then(extractOpaqueRef)
  }

  async createVdi(
    {
      name_description,
      name_label,
      other_config = {},
      read_only = false,
      sharable = false,
      sm_config,
      SR,
      tags,
      type = 'user',
      virtual_size,
      xenstore_data,

      size,
      sr = Ref.isNotEmpty(SR) ? SR : this.pool.default_SR,
    },
    {
      // blindly copying `sm_config` from another VDI can create problems,
      // therefore it is ignored by default by this method
      //
      // see https://github.com/vatesfr/xen-orchestra/issues/4482
      setSmConfig = false,
    } = {}
  ) {
    sr = this.getObject(sr)
    log.debug(`Creating VDI ${name_label} on ${sr.name_label}`)

    return this._getOrWaitObject(
      await this.callAsync('VDI.create', {
        name_description,
        name_label,
        other_config,
        read_only: Boolean(read_only),
        sharable: Boolean(sharable),
        SR: sr.$ref,
        tags,
        type,
        sm_config: setSmConfig ? sm_config : undefined,
        virtual_size: size !== undefined ? parseSize(size) : virtual_size,
        xenstore_data,
      }).then(extractOpaqueRef)
    )
  }

  async moveVdi(vdiId, srId) {
    const vdi = this.getObject(vdiId)
    const sr = this.getObject(srId)

    if (vdi.SR === sr.$ref) {
      return vdi
    }

    log.debug(`Moving VDI ${vdi.name_label} from ${vdi.$SR.name_label} to ${sr.name_label}`)
    try {
      return this.barrier(
        await pRetry(() => this.callAsync('VDI.pool_migrate', vdi.$ref, sr.$ref, {}), {
          when: { code: 'TOO_MANY_STORAGE_MIGRATES' },
        }).then(extractOpaqueRef)
      )
    } catch (error) {
      const { code } = error
      if (code !== 'NO_HOSTS_AVAILABLE' && code !== 'LICENCE_RESTRICTION' && code !== 'VDI_NEEDS_VM_FOR_MIGRATE') {
        throw error
      }
      const newVdi = await this.barrier(await this.callAsync('VDI.copy', vdi.$ref, sr.$ref).then(extractOpaqueRef))
      await asyncMapSettled(vdi.$VBDs, async vbd => {
        await this.call('VBD.destroy', vbd.$ref)
        await this.createVbd({
          ...vbd,
          vdi: newVdi,
        })
      })
      await vdi.$destroy()

      return newVdi
    }
  }

  _resizeVdi(vdi, size) {
    log.debug(`Resizing VDI ${vdi.name_label} from ${vdi.virtual_size} to ${size}`)

    return this.callAsync('VDI.resize', vdi.$ref, size)
  }

  _getVmCdDrive(vm) {
    for (const vbd of vm.$VBDs) {
      if (vbd.type === 'CD') {
        return vbd
      }
    }
  }

  async _ejectCdFromVm(vm) {
    const cdDrive = this._getVmCdDrive(vm)
    if (cdDrive) {
      await this.callAsync('VBD.eject', cdDrive.$ref)
    }
  }

  async _insertCdIntoVm(cd, vm, { bootable = false, force = false } = {}) {
    const cdDrive = await this._getVmCdDrive(vm)
    if (cdDrive) {
      try {
        await this.callAsync('VBD.insert', cdDrive.$ref, cd.$ref)
      } catch (error) {
        if (!force || error.code !== 'VBD_NOT_EMPTY') {
          throw error
        }

        await this.callAsync('VBD.eject', cdDrive.$ref)::ignoreErrors()

        // Retry.
        await this.callAsync('VBD.insert', cdDrive.$ref, cd.$ref)
      }

      if (bootable !== Boolean(cdDrive.bootable)) {
        await cdDrive.set_bootable(bootable)
      }
    } else {
      await this.createVbd({
        bootable,
        type: 'CD',
        vdi: cd,
        vm,
      })
    }
  }

  async connectVbd(vbdId) {
    await this.callAsync('VBD.plug', vbdId)
  }

  async _disconnectVbd(vbd) {
    // TODO: check if VBD is attached before
    try {
      await this.call('VBD.unplug_force', vbd.$ref)
    } catch (error) {
      if (error.code === 'VBD_NOT_UNPLUGGABLE') {
        await vbd.set_unpluggable(true)
        return this.call('VBD.unplug_force', vbd.$ref)
      }
      throw error
    }
  }

  async disconnectVbd(vbdId) {
    await this._disconnectVbd(this.getObject(vbdId))
  }

  async _deleteVbd(vbd) {
    await this._disconnectVbd(vbd)::ignoreErrors()
    await this.call('VBD.destroy', vbd.$ref)
  }

  deleteVbd(vbdId) {
    return this._deleteVbd(this.getObject(vbdId))
  }

  // TODO: remove when no longer used.
  async destroyVbdsFromVm(vmId) {
    await Promise.all(
      this.getObject(vmId).$VBDs.map(async vbd => {
        await this.disconnectVbd(vbd.$ref)::ignoreErrors()
        return this.call('VBD.destroy', vbd.$ref)
      })
    )
  }

  async resizeVdi(vdiId, size) {
    await this._resizeVdi(this.getObject(vdiId), size)
  }

  async ejectCdFromVm(vmId) {
    await this._ejectCdFromVm(this.getObject(vmId))
  }

  async insertCdIntoVm(cdId, vmId, opts = undefined) {
    await this._insertCdIntoVm(this.getObject(cdId), this.getObject(vmId), opts)
  }

  // -----------------------------------------------------------------

  async snapshotVdi(vdiId, nameLabel) {
    const vdi = this.getObject(vdiId)

    const snap = await this._getOrWaitObject(await this.callAsync('VDI.snapshot', vdi.$ref).then(extractOpaqueRef))

    if (nameLabel) {
      await snap.set_name_label(nameLabel)
    }

    return snap
  }

  @cancelable
  _exportVdi($cancelToken, vdi, base, format = VDI_FORMAT_VHD) {
    const query = {
      format,
      vdi: vdi.$ref,
    }
    if (base) {
      query.base = base.$ref
    }

    log.debug(`exporting VDI ${vdi.name_label}${base ? ` (from base ${vdi.name_label})` : ''}`)

    return this.getResource($cancelToken, '/export_raw_vdi/', {
      query,
      task: this.task_create('VDI Export', vdi.name_label),
    }).catch(error => {
      // augment the error with as much relevant info as possible
      error.pool_master = vdi.$pool.$master
      error.SR = vdi.$SR
      error.VDI = vdi

      throw error
    })
  }

  @cancelable
  exportVdiContent($cancelToken, vdi, { format } = {}) {
    return this._exportVdi($cancelToken, this.getObject(vdi), undefined, format)
  }

  // -----------------------------------------------------------------

  async _importVdiContent(vdi, body, format = VDI_FORMAT_VHD) {
    if (typeof body.pipe === 'function' && body.length === undefined) {
      if (this._guessVhdSizeOnImport && format === VDI_FORMAT_VHD) {
        body = await createVhdStreamWithLength(body)
      } else if (__DEV__) {
        throw new Error('Trying to import a VDI without a length field. Please report this error to Xen Orchestra.')
      }
    }

    await Promise.all([
      body.task,
      body.checksumVerified,
      this.putResource(body, '/import_raw_vdi/', {
        query: {
          format,
          vdi: vdi.$ref,
        },
        task: this.task_create('VDI Content Import', vdi.name_label),
      }),
    ]).catch(error => {
      // augment the error with as much relevant info as possible
      error.pool_master = vdi.$pool.$master
      error.SR = vdi.$SR
      error.VDI = vdi

      throw error
    })
  }

  importVdiContent(vdiId, body, { format } = {}) {
    return this._importVdiContent(this.getObject(vdiId), body, format)
  }

  // =================================================================

  async _createVif(
    vm,
    network,
    {
      mac = '',
      position = undefined,

      currently_attached = true,
      device = position != null ? String(position) : undefined,
      ipv4_allowed = undefined,
      ipv6_allowed = undefined,
      locking_mode = undefined,
      MAC = mac,
      other_config = {},
      qos_algorithm_params = {},
      qos_algorithm_type = '',
    } = {}
  ) {
    log.debug(`Creating VIF for VM ${vm.name_label} on network ${network.name_label}`)

    if (device == null) {
      device = (await this.call('VM.get_allowed_VIF_devices', vm.$ref))[0]
    }

    const vifRef = await this.call(
      'VIF.create',
      filterUndefineds({
        currently_attached: vm.power_state === 'Suspended' ? currently_attached : undefined,
        device,
        ipv4_allowed,
        ipv6_allowed,
        locking_mode,
        MAC,
        MTU: asInteger(network.MTU),
        network: network.$ref,
        other_config,
        qos_algorithm_params,
        qos_algorithm_type,
        VM: vm.$ref,
      })
    )

    if (currently_attached && isVmRunning(vm)) {
      await this.callAsync('VIF.plug', vifRef)
    }

    return vifRef
  }

  async createVif(vmId, networkId, opts = undefined) {
    return /* await */ this._getOrWaitObject(
      await this._createVif(this.getObject(vmId), this.getObject(networkId), opts)
    )
  }

  @decorateWith(deferrable)
  async createNetwork($defer, { name, description = 'Created with Xen Orchestra', pifId, mtu, vlan }) {
    const networkRef = await this.call('network.create', {
      name_label: name,
      name_description: description,
      MTU: asInteger(mtu),
      // Set automatic to false so XenCenter does not get confused
      // https://citrix.github.io/xenserver-sdk/#network
      other_config: { automatic: 'false' },
    })
    $defer.onFailure(() => this.callAsync('network.destroy', networkRef))
    if (pifId) {
      await this.call('pool.create_VLAN_from_PIF', this.getObject(pifId).$ref, networkRef, asInteger(vlan))
    }

    return this._getOrWaitObject(networkRef)
  }

  async editPif(pifId, { vlan }) {
    const pif = this.getObject(pifId)
    const physPif = find(
      this.objects.all,
      obj =>
        obj.$type === 'PIF' &&
        (obj.physical || !isEmpty(obj.bond_master_of)) &&
        obj.$pool === pif.$pool &&
        obj.device === pif.device
    )

    if (!physPif) {
      throw new Error('PIF not found')
    }

    const pifs = this.getObject(pif.network).$PIFs

    const wasAttached = {}
    forEach(pifs, pif => {
      wasAttached[pif.host] = pif.currently_attached
    })

    const vlans = uniq(pifs.map(pif => pif.VLAN_master_of))
    await Promise.all(vlans.map(vlan => Ref.isNotEmpty(vlan) && this.callAsync('VLAN.destroy', vlan)))

    const newPifs = await this.call('pool.create_VLAN_from_PIF', physPif.$ref, pif.network, asInteger(vlan))
    await Promise.all(
      newPifs.map(
        pifRef => !wasAttached[this.getObject(pifRef).host] && this.callAsync('PIF.unplug', pifRef)::ignoreErrors()
      )
    )
  }

  @decorateWith(deferrable)
  async createBondedNetwork($defer, { bondMode, pifIds: masterPifIds, ...params }) {
    const network = await this.createNetwork(params)
    $defer.onFailure(() => this.deleteNetwork(network))

    const pifsByHost = {}
    masterPifIds.forEach(pifId => {
      this.getObject(pifId).$network.$PIFs.forEach(pif => {
        if (pifsByHost[pif.host] === undefined) {
          pifsByHost[pif.host] = []
        }
        pifsByHost[pif.host].push(pif.$ref)
      })
    })

    await asyncMapSettled(pifsByHost, pifs => this.call('Bond.create', network.$ref, pifs, '', bondMode))

    return network
  }

  async deleteNetwork(networkId) {
    const network = this.getObject(networkId)
    const pifs = network.$PIFs

    const vlans = uniq(pifs.map(pif => pif.VLAN_master_of))
    await Promise.all(vlans.map(vlan => Ref.isNotEmpty(vlan) && this.callAsync('VLAN.destroy', vlan)))

    const bonds = uniq(flatten(pifs.map(pif => pif.bond_master_of)))
    await Promise.all(bonds.map(bond => this.call('Bond.destroy', bond)))

    const tunnels = filter(this.objects.all, { $type: 'tunnel' })
    await Promise.all(
      pifs.map(async pif => {
        const tunnel = find(tunnels, { access_PIF: pif.$ref })
        if (tunnel != null) {
          await this.callAsync('tunnel.destroy', tunnel.$ref)
        }
      })
    )

    await this.callAsync('network.destroy', network.$ref)
  }

  // =================================================================

  async _doDockerAction(vmId, action, containerId) {
    const vm = this.getObject(vmId)
    const host = vm.$resident_on || this.pool.$master

    return /* await */ this.call('host.call_plugin', host.$ref, 'xscontainer', action, {
      vmuuid: vm.uuid,
      container: containerId,
    })
  }

  async registerDockerContainer(vmId) {
    await this._doDockerAction(vmId, 'register')
  }

  async deregisterDockerContainer(vmId) {
    await this._doDockerAction(vmId, 'deregister')
  }

  async startDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'start', containerId)
  }

  async stopDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'stop', containerId)
  }

  async restartDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'restart', containerId)
  }

  async pauseDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'pause', containerId)
  }

  async unpauseDockerContainer(vmId, containerId) {
    await this._doDockerAction(vmId, 'unpause', containerId)
  }

  async getCloudInitConfig(templateId) {
    const template = this.getObject(templateId)
    const host = this.pool.$master

    const config = await this.call('host.call_plugin', host.$ref, 'xscontainer', 'get_config_drive_default', {
      templateuuid: template.uuid,
    })
    return config.slice(4) // FIXME remove the "True" string on the begining
  }

  // Specific CoreOS Config Drive
  async createCoreOsCloudInitConfigDrive(vmId, srId, config) {
    const vm = this.getObject(vmId)
    const host = this.pool.$master
    const sr = this.getObject(srId)

    await this.call('host.call_plugin', host.$ref, 'xscontainer', 'create_config_drive', {
      vmuuid: vm.uuid,
      sruuid: sr.uuid,
      configuration: config,
    })
    await this.registerDockerContainer(vmId)
  }

  // Generic Config Drive
  @decorateWith(deferrable)
  async createCloudInitConfigDrive($defer, vmId, srId, userConfig, networkConfig) {
    const vm = this.getObject(vmId)
    const sr = this.getObject(srId)

    // First, create a small VDI (10MB) which will become the ConfigDrive
    const buffer = fatfsBufferInit({ label: 'cidata     ' })
    const vdi = await this.createVdi({
      name_label: 'XO CloudConfigDrive',
      size: buffer.length,
      sr: sr.$ref,
    })
    $defer.onFailure(() => vdi.$destroy())

    // Then, generate a FAT fs
    const { mkdir, writeFile } = promisifyAll(fatfs.createFileSystem(fatfsBuffer(buffer)))

    await Promise.all([
      // preferred datasource: NoCloud
      //
      // https://cloudinit.readthedocs.io/en/latest/topics/datasources/nocloud.html
      writeFile('meta-data', 'instance-id: ' + vm.uuid + '\n'),
      writeFile('user-data', userConfig),
      networkConfig !== undefined && writeFile('network-config', networkConfig),

      // fallback datasource: Config Drive 2
      //
      // https://cloudinit.readthedocs.io/en/latest/topics/datasources/configdrive.html#version-2
      mkdir('openstack').then(() =>
        mkdir('openstack/latest').then(() =>
          Promise.all([
            writeFile('openstack/latest/meta_data.json', JSON.stringify({ uuid: vm.uuid })),
            writeFile('openstack/latest/user_data', userConfig),
          ])
        )
      ),
    ])

    // ignore errors, I (JFT) don't understand why they are emitted
    // because it works
    await this._importVdiContent(vdi, buffer, VDI_FORMAT_RAW).catch(error => {
      log.warn('importVdiContent: ', { error })
    })

    await this.createVbd({ vdi, vm })
  }

  @decorateWith(deferrable)
  async createTemporaryVdiOnSr($defer, stream, sr, name_label, name_description) {
    const vdi = await this.createVdi({
      name_description,
      name_label,
      size: stream.length,
      sr: sr.$ref,
    })
    $defer.onFailure(() => vdi.$destroy())

    await this.importVdiContent(vdi.$id, stream, { format: VDI_FORMAT_RAW })

    return vdi
  }

  // Create VDI on an adequate local SR
  async createTemporaryVdiOnHost(stream, hostId, name_label, name_description) {
    const pbd = find(this.getObject(hostId).$PBDs, pbd => canSrHaveNewVdiOfSize(pbd.$SR, stream.length))

    if (pbd == null) {
      throw new Error('no SR available')
    }

    return this.createTemporaryVdiOnSr(stream, pbd.$SR, name_label, name_description)
  }

  findAvailableSharedSr(minSize) {
    return find(this.objects.all, obj => obj.$type === 'SR' && obj.shared && canSrHaveNewVdiOfSize(obj, minSize))
  }

  // Main purpose: upload update on VDI
  // Is a local SR on a non master host OK?
  findAvailableSr(minSize) {
    return find(this.objects.all, obj => obj.$type === 'SR' && canSrHaveNewVdiOfSize(obj, minSize))
  }

  async _getHostServerTimeShift(hostRef) {
    return Math.abs(parseDateTime(await this.call('host.get_servertime', hostRef)) - Date.now())
  }

  async isHostServerTimeConsistent(hostRef) {
    return (await this._getHostServerTimeShift(hostRef)) < 30e3
  }

  async assertConsistentHostServerTime(hostRef) {
    if (!(await this.isHostServerTimeConsistent(hostRef))) {
      throw new Error(
        `host server time and XOA date are not consistent with each other (${ms(
          await this._getHostServerTimeShift(hostRef)
        )})`
      )
    }
  }

  async isHyperThreadingEnabled(hostId) {
    try {
      return (
        (await this.call(
          'host.call_plugin',
          this.getObject(hostId).$ref,
          'hyperthreading.py',
          'get_hyperthreading',
          {}
        )) !== 'false'
      )
    } catch (error) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return null
      } else {
        throw error
      }
    }
  }
}
