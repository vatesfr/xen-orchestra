/* eslint-disable camelcase */
import deferrable from 'golike-defer'
import fatfs from 'fatfs'
import synchronized from 'decorator-synchronized'
import tarStream from 'tar-stream'
import vmdkToVhd from 'xo-vmdk-to-vhd'
import { cancellable, catchPlus as pCatch, defer, ignoreErrors } from 'promise-toolbox'
import { PassThrough } from 'stream'
import { forbiddenOperation } from 'xo-common/api-errors'
import {
  every,
  find,
  filter,
  flatten,
  groupBy,
  includes,
  isEmpty,
  omit,
  startsWith,
  uniq
} from 'lodash'
import {
  Xapi as XapiBase
} from 'xen-api'
import {
  satisfies as versionSatisfies
} from 'semver'

import createSizeStream from '../size-stream'
import fatfsBuffer, { init as fatfsBufferInit } from '../fatfs-buffer'
import { mixin } from '../decorators'
import {
  asyncMap,
  camelToSnakeCase,
  createRawObject,
  ensureArray,
  forEach,
  isFunction,
  map,
  mapToArray,
  pAll,
  pDelay,
  pFinally,
  promisifyAll,
  pSettle
} from '../utils'

import mixins from './mixins'
import OTHER_CONFIG_TEMPLATE from './other-config-template'
import {
  asBoolean,
  asInteger,
  debug,
  extractOpaqueRef,
  filterUndefineds,
  getNamespaceForType,
  canSrHaveNewVdiOfSize,
  isVmHvm,
  isVmRunning,
  NULL_REF,
  optional,
  prepareXapiParam
} from './utils'

// ===================================================================

const TAG_BASE_DELTA = 'xo:base_delta'
const TAG_COPY_SRC = 'xo:copy_of'

// ===================================================================

// FIXME: remove this work around when fixed, https://phabricator.babeljs.io/T2877
//  export * from './utils'
require('lodash/assign')(module.exports, require('./utils'))

// VDI formats. (Raw is not available for delta vdi.)
export const VDI_FORMAT_VHD = 'vhd'
export const VDI_FORMAT_RAW = 'raw'

export const IPV4_CONFIG_MODES = ['None', 'DHCP', 'Static']
export const IPV6_CONFIG_MODES = ['None', 'DHCP', 'Static', 'Autoconf']

// ===================================================================

@mixin(mapToArray(mixins))
export default class Xapi extends XapiBase {
  constructor (...args) {
    super(...args)

    // Patch getObject to resolve _xapiId property.
    this.getObject = (getObject => (...args) => {
      let tmp
      if ((tmp = args[0]) != null && (tmp = tmp._xapiId) != null) {
        args[0] = tmp
      }
      return getObject.apply(this, args)
    })(this.getObject)

    const genericWatchers = this._genericWatchers = createRawObject()
    const objectsWatchers = this._objectWatchers = createRawObject()

    const onAddOrUpdate = objects => {
      forEach(objects, object => {
        const {
          $id: id,
          $ref: ref
        } = object

        // Run generic watchers.
        for (const watcherId in genericWatchers) {
          genericWatchers[watcherId](object)
        }

        // Watched object.
        if (id in objectsWatchers) {
          objectsWatchers[id].resolve(object)
          delete objectsWatchers[id]
        }
        if (ref in objectsWatchers) {
          objectsWatchers[ref].resolve(object)
          delete objectsWatchers[ref]
        }
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
  }

  call (...args) {
    const fn = super.call

    const loop = () => fn.apply(this, args)::pCatch({
      code: 'TOO_MANY_PENDING_TASKS'
    }, () => pDelay(5e3).then(loop))

    return loop()
  }

  createTask (name = 'untitled task', description) {
    return super.createTask(`[XO] ${name}`, description)
  }

  // =================================================================

  _registerGenericWatcher (fn) {
    const watchers = this._genericWatchers
    const id = String(Math.random())

    watchers[id] = fn

    return () => {
      delete watchers[id]
    }
  }

  // Wait for an object to appear or to be updated.
  //
  // Predicate can be either an id, a UUID, an opaque reference or a
  // function.
  //
  // TODO: implements a timeout.
  _waitObject (predicate) {
    if (isFunction(predicate)) {
      const { promise, resolve } = defer()

      const unregister = this._registerGenericWatcher(obj => {
        if (predicate(obj)) {
          unregister()

          resolve(obj)
        }
      })

      return promise
    }

    let watcher = this._objectWatchers[predicate]
    if (!watcher) {
      const { promise, resolve } = defer()

      // Register the watcher.
      watcher = this._objectWatchers[predicate] = {
        promise,
        resolve
      }
    }

    return watcher.promise
  }

  // Wait for an object to be in a given state.
  //
  // Faster than _waitObject() with a function.
  _waitObjectState (idOrUuidOrRef, predicate) {
    const object = this.getObject(idOrUuidOrRef, null)
    if (object && predicate(object)) {
      return object
    }

    const loop = () => this._waitObject(idOrUuidOrRef).then(
      (object) => predicate(object) ? object : loop()
    )

    return loop()
  }

  // Returns the objects if already presents or waits for it.
  async _getOrWaitObject (idOrUuidOrRef) {
    return (
      this.getObject(idOrUuidOrRef, null) ||
      this._waitObject(idOrUuidOrRef)
    )
  }

  // =================================================================

  _setObjectProperty (object, name, value) {
    return this.call(
      `${getNamespaceForType(object.$type)}.set_${camelToSnakeCase(name)}`,
      object.$ref,
      prepareXapiParam(value)
    )
  }

  _setObjectProperties (object, props) {
    const {
      $ref: ref,
      $type: type
    } = object

    const namespace = getNamespaceForType(type)

    // TODO: the thrown error should contain the name of the
    // properties that failed to be set.
    return Promise.all(mapToArray(props, (value, name) => {
      if (value != null) {
        return this.call(`${namespace}.set_${camelToSnakeCase(name)}`, ref, prepareXapiParam(value))
      }
    }))::ignoreErrors()
  }

  async _updateObjectMapProperty (object, prop, values) {
    const {
      $ref: ref,
      $type: type
    } = object

    prop = camelToSnakeCase(prop)

    const namespace = getNamespaceForType(type)
    const add = `${namespace}.add_to_${prop}`
    const remove = `${namespace}.remove_from_${prop}`

    await Promise.all(mapToArray(values, (value, name) => {
      if (value !== undefined) {
        name = camelToSnakeCase(name)
        const removal = this.call(remove, ref, name)

        return value === null
          ? removal
          : removal::ignoreErrors().then(() => this.call(add, ref, name, prepareXapiParam(value)))
      }
    }))
  }

  async setHostProperties (id, {
    nameLabel,
    nameDescription
  }) {
    await this._setObjectProperties(this.getObject(id), {
      nameLabel,
      nameDescription
    })
  }

  async setPoolProperties ({
    autoPoweron,
    nameLabel,
    nameDescription
  }) {
    const { pool } = this

    await Promise.all([
      this._setObjectProperties(pool, {
        nameLabel,
        nameDescription
      }),
      autoPoweron != null && this._updateObjectMapProperty(pool, 'other_config', {
        autoPoweron: autoPoweron ? 'true' : null
      })
    ])
  }

  async setSrProperties (id, {
    nameLabel,
    nameDescription
  }) {
    await this._setObjectProperties(this.getObject(id), {
      nameLabel,
      nameDescription
    })
  }

  async setNetworkProperties (id, {
    nameLabel,
    nameDescription,
    defaultIsLocked
  }) {
    let defaultLockingMode
    if (defaultIsLocked != null) {
      defaultLockingMode = defaultIsLocked ? 'disabled' : 'unlocked'
    }
    await this._setObjectProperties(this.getObject(id), {
      nameLabel,
      nameDescription,
      defaultLockingMode
    })
  }

  // =================================================================

  async addTag (id, tag) {
    const {
      $ref: ref,
      $type: type
    } = this.getObject(id)

    const namespace = getNamespaceForType(type)
    await this.call(`${namespace}.add_tags`, ref, tag)
  }

  async removeTag (id, tag) {
    const {
      $ref: ref,
      $type: type
    } = this.getObject(id)

    const namespace = getNamespaceForType(type)
    await this.call(`${namespace}.remove_tags`, ref, tag)
  }

  // =================================================================

  async setDefaultSr (srId) {
    this._setObjectProperties(this.pool, {
      default_SR: this.getObject(srId).$ref
    })
  }

  // =================================================================

  async joinPool (masterAddress, masterUsername, masterPassword, force = false) {
    await this.call(
      force ? 'pool.join_force' : 'pool.join',
      masterAddress,
      masterUsername,
      masterPassword
    )
  }

  // =================================================================

  async emergencyShutdownHost (hostId) {
    const host = this.getObject(hostId)
    const vms = host.$resident_VMs
    debug(`Emergency shutdown: ${host.name_label}`)
    await pSettle(
      mapToArray(vms, vm => {
        if (!vm.is_control_domain) {
          return this.call('VM.suspend', vm.$ref)
        }
      })
    )
    await this.call('host.disable', host.$ref)
    await this.call('host.shutdown', host.$ref)
  }

  // =================================================================

  // Disable the host and evacuate all its VMs.
  //
  // If `force` is false and the evacuation failed, the host is re-
  // enabled and the error is thrown.
  async _clearHost ({ $ref: ref }, force) {
    await this.call('host.disable', ref)

    try {
      await this.call('host.evacuate', ref)
    } catch (error) {
      if (!force) {
        await this.call('host.enable', ref)

        throw error
      }
    }
  }

  async disableHost (hostId) {
    await this.call('host.disable', this.getObject(hostId).$ref)
  }

  async forgetHost (hostId) {
    await this.call('host.destroy', this.getObject(hostId).$ref)
  }

  async ejectHostFromPool (hostId) {
    await this.call('pool.eject', this.getObject(hostId).$ref)
  }

  async enableHost (hostId) {
    await this.call('host.enable', this.getObject(hostId).$ref)
  }

  async powerOnHost (hostId) {
    await this.call('host.power_on', this.getObject(hostId).$ref)
  }

  async rebootHost (hostId, force = false) {
    const host = this.getObject(hostId)

    await this._clearHost(host, force)
    await this.call('host.reboot', host.$ref)
  }

  async restartHostAgent (hostId) {
    await this.call('host.restart_agent', this.getObject(hostId).$ref)
  }

  async shutdownHost (hostId, force = false) {
    const host = this.getObject(hostId)

    await this._clearHost(host, force)
    await this.call('host.shutdown', host.$ref)
  }

  // =================================================================

  // Clone a VM: make a fast copy by fast copying each of its VDIs
  // (using snapshots where possible) on the same SRs.
  _cloneVm (vm, nameLabel = vm.name_label) {
    debug(`Cloning VM ${vm.name_label}${
      nameLabel !== vm.name_label
        ? ` as ${nameLabel}`
        : ''
    }`)

    return this.call('VM.clone', vm.$ref, nameLabel)
  }

  // Copy a VM: make a normal copy of a VM and all its VDIs.
  //
  // If a SR is specified, it will contains the copies of the VDIs,
  // otherwise they will use the SRs they are on.
  async _copyVm (vm, nameLabel = vm.name_label, sr = undefined) {
    let snapshot
    if (isVmRunning(vm)) {
      snapshot = await this._snapshotVm(vm)
    }

    debug(`Copying VM ${vm.name_label}${
      nameLabel !== vm.name_label
        ? ` as ${nameLabel}`
        : ''
    }${
      sr
        ? ` on ${sr.name_label}`
        : ''
    }`)

    try {
      return await this.call(
        'VM.copy',
        snapshot ? snapshot.$ref : vm.$ref,
        nameLabel,
        sr ? sr.$ref : ''
      )
    } finally {
      if (snapshot) {
        await this._deleteVm(snapshot)
      }
    }
  }

  async cloneVm (vmId, {
    nameLabel = undefined,
    fast = true
  } = {}) {
    const vm = this.getObject(vmId)

    const cloneRef = await (
      fast
        ? this._cloneVm(vm, nameLabel)
        : this._copyVm(vm, nameLabel)
    )

    return /* await */ this._getOrWaitObject(cloneRef)
  }

  async copyVm (vmId, srId, {
    nameLabel = undefined
  } = {}) {
    return /* await */ this._getOrWaitObject(
      await this._copyVm(
        this.getObject(vmId),
        nameLabel,
        this.getObject(srId)
      )
    )
  }

  async remoteCopyVm (vmId, targetXapi, targetSrId, {
    compress = true,
    nameLabel = undefined
  } = {}) {
    // Fall back on local copy if possible.
    if (targetXapi === this) {
      return {
        vm: await this.copyVm(vmId, targetSrId, { nameLabel })
      }
    }

    const sr = targetXapi.getObject(targetSrId)
    let stream = await this.exportVm(vmId, {
      compress,
      onlyMetadata: false
    })

    const sizeStream = createSizeStream()
    stream = stream.pipe(sizeStream)

    const onVmCreation = nameLabel !== undefined
      ? vm => targetXapi._setObjectProperties(vm, {
        nameLabel
      })
      : null

    const vm = await targetXapi._getOrWaitObject(
      await targetXapi._importVm(
        stream,
        sr,
        false,
        onVmCreation
      )
    )

    return {
      size: sizeStream.size,
      vm
    }
  }

  // Low level create VM.
  _createVmRecord ({
    actions_after_crash,
    actions_after_reboot,
    actions_after_shutdown,
    affinity,
    // appliance,
    blocked_operations,
    generation_id,
    ha_always_run,
    ha_restart_priority,
    has_vendor_device = false, // Avoid issue with some Dundee builds.
    hardware_platform_version,
    HVM_boot_params,
    HVM_boot_policy,
    HVM_shadow_multiplier,
    is_a_template,
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
    xenstore_data
  }) {
    debug(`Creating VM ${name_label}`)

    return this.call('VM.create', filterUndefineds({
      actions_after_crash,
      actions_after_reboot,
      actions_after_shutdown,
      affinity: affinity == null ? NULL_REF : affinity,
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
      xenstore_data
    }))
  }

  async _deleteVm (vm, deleteDisks = true) {
    debug(`Deleting VM ${vm.name_label}`)

    // It is necessary for suspended VMs to be shut down
    // to be able to delete their VDIs.
    if (vm.power_state !== 'Halted') {
      await this.call('VM.hard_shutdown', vm.$ref)
    }

    if (deleteDisks) {
      // Compute the VDIs list without duplicates.
      const vdis = {}
      forEach(vm.$VBDs, vbd => {
        let vdi
        if (
          // Do not remove CDs and Floppies.
          vbd.type === 'Disk' &&

          // Ignore VBD without VDI.
          (vdi = vbd.$VDI)
        ) {
          vdis[vdi.$id] = vdi
        }
      })

      await Promise.all(mapToArray(vdis, vdi => {
        if (
          // Do not remove VBDs attached to other VMs.
          vdi.VBDs.length < 2 ||
          every(vdi.$VBDs, vbd => vbd.VM === vm.$ref)
        ) {
          return this._deleteVdi(vdi)::ignoreErrors()
        }
        console.error(`cannot delete VDI ${vdi.name_label} (from VM ${vm.name_label})`)
      }))
    }

    await Promise.all(mapToArray(vm.$snapshots, snapshot =>
      this.deleteVm(snapshot.$id)::ignoreErrors()
    ))

    await this.call('VM.destroy', vm.$ref)
  }

  async deleteVm (vmId, deleteDisks) {
    return /* await */ this._deleteVm(
      this.getObject(vmId),
      deleteDisks
    )
  }

  getVmConsole (vmId) {
    const vm = this.getObject(vmId)

    const console = find(vm.$consoles, { protocol: 'rfb' })
    if (!console) {
      throw new Error('no RFB console found')
    }

    return console
  }

  // Returns a stream to the exported VM.
  async exportVm (vmId, {
    compress = true,
    onlyMetadata = false
  } = {}) {
    const vm = this.getObject(vmId)

    let host
    let snapshotRef
    // It's not needed to snapshot the VM to get the metadata
    if (isVmRunning(vm) && !onlyMetadata) {
      host = vm.$resident_on
      snapshotRef = (await this._snapshotVm(vm)).$ref
    }

    const promise = this.getResource(onlyMetadata ? '/export_metadata/' : '/export/', {
      host,
      query: {
        ref: snapshotRef || vm.$ref,
        use_compression: compress ? 'true' : 'false'
      },
      task: this.createTask('VM export', vm.name_label)
    })

    if (snapshotRef !== undefined) {
      promise.then(_ => _.task::pFinally(() =>
        this.deleteVm(snapshotRef)::ignoreErrors()
      ))
    }

    return promise
  }

  _assertHealthyVdiChain (vdi, childrenMap) {
    if (vdi == null) {
      return
    }

    if (!vdi.managed) {
      if (childrenMap === undefined) {
        childrenMap = groupBy(vdi.$SR.$VDIs, _ => _.sm_config['vhd-parent'])
      }

      // an unmanaged VDI should not have exactly one child: they
      // should coalesce
      const children = childrenMap[vdi.uuid]
      if (
        children.length === 1 &&
        !children[0].managed // some SRs do not coalesce the leaf
      ) {
        throw new Error('unhealthy VDI chain')
      }
    }

    this._assertHealthyVdiChain(
      this.getObjectByUuid(vdi.sm_config['vhd-parent'], null),
      childrenMap
    )
  }

  _assertHealthyVdiChains (vm) {
    forEach(vm.$VBDs, ({ $VDI }) => {
      this._assertHealthyVdiChain($VDI)
    })
  }

  // Create a snapshot of the VM and returns a delta export object.
  @cancellable
  @deferrable.onFailure
  async exportDeltaVm ($onFailure, $cancelToken, vmId, baseVmId = undefined, {
    snapshotNameLabel = undefined,
    // Contains a vdi.$id set of vmId.
    fullVdisRequired = [],
    disableBaseTags = false
  } = {}) {
    this._assertHealthyVdiChains(this.getObject(vmId))

    const vm = await this.snapshotVm(vmId)
    $onFailure(() => this._deleteVm(vm))
    if (snapshotNameLabel) {
      this._setObjectProperties(vm, {
        nameLabel: snapshotNameLabel
      })::ignoreErrors()
    }

    const baseVm = baseVmId && this.getObject(baseVmId)

    // refs of VM's VDIs → base's VDIs.
    const baseVdis = {}
    baseVm && forEach(baseVm.$VBDs, vbd => {
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
      if (
        vbd.type !== 'Disk' ||
        !(vdi = vbd.$VDI)
      ) {
        // Ignore this VBD.
        return
      }

      // If the VDI name start with `[NOBAK]`, do not export it.
      if (startsWith(vdi.name_label, '[NOBAK]')) {
        // FIXME: find a way to not create the VDI snapshot in the
        // first time.
        //
        // The snapshot must not exist otherwise it could break the
        // next export.
        this._deleteVdi(vdi)::ignoreErrors()
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

      vdis[vdiRef] = baseVdi && !disableBaseTags
        ? {
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: baseVdi.uuid
          },
          $SR$uuid: vdi.$SR.uuid
        }
        : {
          ...vdi,
          $SR$uuid: vdi.$SR.uuid
        }
      const stream = streams[`${vdiRef}.vhd`] = this._exportVdi($cancelToken, vdi, baseVdi, VDI_FORMAT_VHD)
      $onFailure(stream.cancel)
    })

    const vifs = {}
    forEach(vm.$VIFs, vif => {
      vifs[vif.$ref] = {
        ...vif,
        $network$uuid: vif.$network.uuid
      }
    })

    return Object.defineProperty({
      version: '1.1.0',
      vbds,
      vdis,
      vifs,
      vm: baseVm && !disableBaseTags
        ? {
          ...vm,
          other_config: {
            ...vm.other_config,
            [TAG_BASE_DELTA]: baseVm.uuid
          }
        }
        : {
          ...vm,
          other_config: omit(vm.other_config, TAG_BASE_DELTA)
        }
    }, 'streams', {
      value: await streams::pAll()
    })
  }

  @deferrable.onFailure
  async importDeltaVm ($onFailure, delta, {
    deleteBase = false,
    disableStartAfterImport = true,
    mapVdisSrs = {},
    name_label = delta.vm.name_label,
    srId = this.pool.default_SR
  } = {}) {
    const { version } = delta

    if (!versionSatisfies(version, '^1')) {
      throw new Error(`Unsupported delta backup version: ${version}`)
    }

    const remoteBaseVmUuid = delta.vm.other_config[TAG_BASE_DELTA]
    let baseVm
    if (remoteBaseVmUuid) {
      baseVm = find(this.objects.all, obj => (
        (obj = obj.other_config) &&
        obj[TAG_COPY_SRC] === remoteBaseVmUuid
      ))

      if (!baseVm) {
        throw new Error('could not find the base VM')
      }
    }

    const baseVdis = {}
    baseVm && forEach(baseVm.$VBDs, vbd => {
      baseVdis[vbd.VDI] = vbd.$VDI
    })

    const { streams } = delta

    // 1. Create the VMs.
    const vm = await this._getOrWaitObject(
      await this._createVmRecord({
        ...delta.vm,
        affinity: null,
        is_a_template: false
      })
    )
    $onFailure(() => this._deleteVm(vm))

    await Promise.all([
      this._setObjectProperties(vm, {
        name_label: `[Importing…] ${name_label}`
      }),
      this._updateObjectMapProperty(vm, 'blocked_operations', {
        start: 'Importing…'
      }),
      this._updateObjectMapProperty(vm, 'other_config', {
        [TAG_COPY_SRC]: delta.vm.uuid
      })
    ])

    // 2. Delete all VBDs which may have been created by the import.
    await asyncMap(
      vm.$VBDs,
      vbd => this._deleteVbd(vbd)
    )::ignoreErrors()

    // 3. Create VDIs.
    const newVdis = await map(delta.vdis, async vdi => {
      const remoteBaseVdiUuid = vdi.other_config[TAG_BASE_DELTA]
      if (!remoteBaseVdiUuid) {
        const newVdi = await this.createVdi(vdi.virtual_size, {
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: undefined,
            [TAG_COPY_SRC]: vdi.uuid
          },
          sr: mapVdisSrs[vdi.uuid] || srId
        })
        $onFailure(() => this._deleteVdi(newVdi))

        return newVdi
      }

      const baseVdi = find(
        baseVdis,
        vdi => vdi.other_config[TAG_COPY_SRC] === remoteBaseVdiUuid
      )
      if (!baseVdi) {
        throw new Error(`missing base VDI (copy of ${remoteBaseVdiUuid})`)
      }

      const newVdi = await this._getOrWaitObject(
        await this._cloneVdi(baseVdi)
      )
      $onFailure(() => this._deleteVdi(newVdi))

      await this._updateObjectMapProperty(newVdi, 'other_config', {
        [TAG_COPY_SRC]: vdi.uuid
      })

      return newVdi
    })::pAll()

    const networksOnPoolMasterByDevice = {}
    let defaultNetwork
    forEach(this.pool.$master.$PIFs, pif => {
      defaultNetwork = networksOnPoolMasterByDevice[pif.device] = pif.$network
    })

    await Promise.all([
      // Create VBDs.
      Promise.all(mapToArray(
        delta.vbds,
        vbd => this._createVbd(vm, newVdis[vbd.VDI], vbd)
      )),

      // Import VDI contents.
      Promise.all(mapToArray(
        newVdis,
        async (vdi, id) => {
          for (const stream of ensureArray(streams[`${id}.vhd`])) {
            await this._importVdiContent(vdi, stream, VDI_FORMAT_VHD)
          }
        }
      )),

      // Wait for VDI export tasks (if any) termination.
      Promise.all(mapToArray(
        streams,
        stream => stream.task
      )),

      // Create VIFs.
      Promise.all(mapToArray(delta.vifs, vif => {
        const network =
          (vif.$network$uuid && this.getObject(vif.$network$uuid, null)) ||
          networksOnPoolMasterByDevice[vif.device] ||
          defaultNetwork

        if (network) {
          return this._createVif(
            vm,
            network,
            vif
          )
        }
      }))
    ])

    if (deleteBase && baseVm) {
      this._deleteVm(baseVm)::ignoreErrors()
    }

    await Promise.all([
      this._setObjectProperties(vm, {
        name_label
      }),
      // FIXME: move
      this._updateObjectMapProperty(vm, 'blocked_operations', {
        start: disableStartAfterImport
          ? 'Do not start this VM, clone it if you want to use it.'
          : null
      })
    ])

    return vm
  }

  async _migrateVmWithStorageMotion (vm, hostXapi, host, {
    migrationNetwork = find(host.$PIFs, pif => pif.management).$network, // TODO: handle not found
    sr,
    mapVdisSrs,
    mapVifsNetworks
  }) {
    // VDIs/SRs mapping
    const vdis = {}
    const defaultSr = host.$pool.$default_SR
    for (const vbd of vm.$VBDs) {
      const vdi = vbd.$VDI
      if (vbd.type === 'Disk') {
        vdis[vdi.$ref] = mapVdisSrs && mapVdisSrs[vdi.$id]
          ? hostXapi.getObject(mapVdisSrs[vdi.$id]).$ref
          : sr !== undefined
            ? hostXapi.getObject(sr).$ref
            : defaultSr.$ref // Will error if there are no default SR.
      }
    }

    // VIFs/Networks mapping
    let vifsMap = {}
    if (vm.$pool !== host.$pool) {
      const defaultNetworkRef = find(host.$PIFs, pif => pif.management).$network.$ref
      for (const vif of vm.$VIFs) {
        vifsMap[vif.$ref] = mapVifsNetworks && mapVifsNetworks[vif.$id]
          ? hostXapi.getObject(mapVifsNetworks[vif.$id]).$ref
          : defaultNetworkRef
      }
    }

    const token = await hostXapi.call(
      'host.migrate_receive',
      host.$ref,
      migrationNetwork.$ref,
      {}
    )

    const loop = () => this.call(
      'VM.migrate_send',
      vm.$ref,
      token,
      true, // Live migration.
      vdis,
      vifsMap,
      {
        force: 'true'
      }
    )::pCatch(
      { code: 'TOO_MANY_STORAGE_MIGRATES' },
      () => pDelay(1e4).then(loop)
    )

    return loop()
  }

  @synchronized
  _callInstallationPlugin (hostRef, vdi) {
    return this.call('host.call_plugin', hostRef, 'install-supp-pack', 'install', { vdi }).catch(error => {
      if (error.code !== 'XENAPI_PLUGIN_FAILURE') {
        console.warn('_callInstallationPlugin', error)
        throw error
      }
    })
  }

  @deferrable
  async installSupplementalPack ($defer, stream, { hostId }) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const vdi = await this.createTemporaryVdiOnHost(stream, hostId, '[XO] Supplemental pack ISO', 'small temporary VDI to store a supplemental pack ISO')
    $defer(() => this._deleteVdi(vdi))

    await this._callInstallationPlugin(this.getObject(hostId).$ref, vdi.uuid)
  }

  @deferrable
  async installSupplementalPackOnAllHosts ($defer, stream) {
    if (!stream.length) {
      throw new Error('stream must have a length')
    }

    const isSrAvailable = sr =>
      sr && sr.content_type === 'user' && sr.physical_size - sr.physical_utilisation >= stream.length

    const hosts = filter(this.objects.all, { $type: 'host' })

    const sr = this.findAvailableSharedSr(stream.length)

    // Shared SR available: create only 1 VDI for all the installations
    if (sr) {
      const vdi = await this.createTemporaryVdiOnSr(stream, sr, '[XO] Supplemental pack ISO', 'small temporary VDI to store a supplemental pack ISO')
      $defer(() => this._deleteVdi(vdi))

      // Install pack sequentially to prevent concurrent access to the unique VDI
      for (const host of hosts) {
        await this._callInstallationPlugin(host.$ref, vdi.uuid)
      }

      return
    }

    // No shared SR available: find an available local SR on each host
    return Promise.all(mapToArray(hosts, deferrable(async ($defer, host) => {
      // pipe stream synchronously to several PassThroughs to be able to pipe them asynchronously later
      const pt = stream.pipe(new PassThrough())
      pt.length = stream.length

      const sr = find(
        mapToArray(host.$PBDs, '$SR'),
        isSrAvailable
      )

      if (!sr) {
        throw new Error('no SR available to store installation file')
      }

      const vdi = await this.createTemporaryVdiOnSr(pt, sr, '[XO] Supplemental pack ISO', 'small temporary VDI to store a supplemental pack ISO')
      $defer(() => this._deleteVdi(vdi))

      await this._callInstallationPlugin(host.$ref, vdi.uuid)
    })))
  }

  async _importVm (stream, sr, onlyMetadata = false, onVmCreation = undefined) {
    const taskRef = await this.createTask('VM import')
    const query = {
      force: onlyMetadata
    }

    let host
    if (sr != null) {
      host = sr.$PBDs[0].$host
      query.sr_id = sr.$ref
    }

    if (onVmCreation) {
      this._waitObject(
        obj => obj && obj.current_operations && taskRef in obj.current_operations
      ).then(onVmCreation)::ignoreErrors()
    }

    const vmRef = await this.putResource(
      stream,
      onlyMetadata ? '/import_metadata/' : '/import/',
      {
        host,
        query,
        task: taskRef
      }
    ).then(extractOpaqueRef)

    // Importing a metadata archive of running VMs is currently
    // broken: its VBDs are incorrectly seen as attached.
    //
    // A call to VM.power_state_reset fixes this problem.
    if (onlyMetadata) {
      await this.call('VM.power_state_reset', vmRef)
    }

    return vmRef
  }

  @deferrable.onFailure
  async _importOvaVm ($onFailure, stream, {
    descriptionLabel,
    disks,
    memory,
    nameLabel,
    networks,
    nCpus
  }, sr) {
    // 1. Create VM.
    const vm = await this._getOrWaitObject(
      await this._createVmRecord({
        ...OTHER_CONFIG_TEMPLATE,
        memory_dynamic_max: memory,
        memory_dynamic_min: memory,
        memory_static_max: memory,
        name_description: descriptionLabel,
        name_label: nameLabel,
        VCPUs_at_startup: nCpus,
        VCPUs_max: nCpus
      })
    )
    $onFailure(() => this._deleteVm(vm))
    // Disable start and change the VM name label during import.
    await Promise.all([
      this.addForbiddenOperationToVm(vm.$id, 'start', 'OVA import in progress...'),
      this._setObjectProperties(vm, { name_label: `[Importing...] ${nameLabel}` })
    ])

    // 2. Create VDIs & Vifs.
    const vdis = {}
    const vifDevices = await this.call('VM.get_allowed_VIF_devices', vm.$ref)
    await Promise.all(
      map(disks, async disk => {
        const vdi = vdis[disk.path] = await this.createVdi(disk.capacity, {
          name_description: disk.descriptionLabel,
          name_label: disk.nameLabel,
          sr: sr.$ref
        })
        $onFailure(() => this._deleteVdi(vdi))

        return this._createVbd(vm, vdi, { position: disk.position })
      }).concat(map(networks, (networkId, i) => (
        this._createVif(vm, this.getObject(networkId), {
          device: vifDevices[i]
        })
      )))
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

        const vhdStream = await vmdkToVhd(stream)
        await this._importVdiContent(vdi, vhdStream, VDI_FORMAT_RAW)

        // See: https://github.com/mafintosh/tar-stream#extracting
        // No import parallelization.
        cb()
      })
      stream.pipe(extract)
    })

    // Enable start and restore the VM name label after import.
    await Promise.all([
      this.removeForbiddenOperationFromVm(vm.$id, 'start'),
      this._setObjectProperties(vm, { name_label: nameLabel })
    ])
    return vm
  }

  // TODO: an XVA can contain multiple VMs
  async importVm (stream, {
    data,
    onlyMetadata = false,
    srId,
    type = 'xva'
  } = {}) {
    const sr = srId && this.getObject(srId)

    if (type === 'xva') {
      return /* await */ this._getOrWaitObject(await this._importVm(
        stream,
        sr,
        onlyMetadata
      ))
    }

    if (type === 'ova') {
      return this._getOrWaitObject(await this._importOvaVm(stream, data, sr))
    }

    throw new Error(`unsupported type: '${type}'`)
  }

  async migrateVm (vmId, hostXapi, hostId, {
    sr,
    migrationNetworkId,
    mapVifsNetworks,
    mapVdisSrs
  } = {}) {
    const vm = this.getObject(vmId)
    const host = hostXapi.getObject(hostId)

    const accrossPools = vm.$pool !== host.$pool
    const useStorageMotion = (
      accrossPools ||
      sr !== undefined ||
      migrationNetworkId !== undefined ||
      !isEmpty(mapVifsNetworks) ||
      !isEmpty(mapVdisSrs)
    )

    if (useStorageMotion) {
      await this._migrateVmWithStorageMotion(vm, hostXapi, host, {
        migrationNetwork: migrationNetworkId && hostXapi.getObject(migrationNetworkId),
        sr,
        mapVdisSrs,
        mapVifsNetworks
      })
    } else {
      try {
        await this.call('VM.pool_migrate', vm.$ref, host.$ref, { force: 'true' })
      } catch (error) {
        if (error.code !== 'VM_REQUIRES_SR') {
          throw error
        }

        // Retry using motion storage.
        await this._migrateVmWithStorageMotion(vm, hostXapi, host, {})
      }
    }
  }

  async _snapshotVm (vm, nameLabel = vm.name_label) {
    debug(`Snapshotting VM ${vm.name_label}${
      nameLabel !== vm.name_label
        ? ` as ${nameLabel}`
        : ''
    }`)

    let ref
    try {
      ref = await this.call('VM.snapshot_with_quiesce', vm.$ref, nameLabel)
      this.addTag(ref, 'quiesce')::ignoreErrors()

      await this._waitObjectState(ref, vm => includes(vm.tags, 'quiesce'))
    } catch (error) {
      const { code } = error
      if (
        code !== 'VM_SNAPSHOT_WITH_QUIESCE_NOT_SUPPORTED' &&

        // quiesce only work on a running VM
        code !== 'VM_BAD_POWER_STATE' &&

        // quiesce failed, fallback on standard snapshot
        // TODO: emit warning
        code !== 'VM_SNAPSHOT_WITH_QUIESCE_FAILED'
      ) {
        throw error
      }
      ref = await this.call('VM.snapshot', vm.$ref, nameLabel)
    }
    // Convert the template to a VM and wait to have receive the up-
    // to-date object.
    const [ , snapshot ] = await Promise.all([
      this.call('VM.set_is_a_template', ref, false),
      this._waitObjectState(ref, snapshot => !snapshot.is_a_template)
    ])

    return snapshot
  }

  async snapshotVm (vmId, nameLabel = undefined) {
    return /* await */ this._snapshotVm(
      this.getObject(vmId),
      nameLabel
    )
  }

  async setVcpuWeight (vmId, weight) {
    weight = weight || null // Take all falsy values as a removal (0 included)
    const vm = this.getObject(vmId)
    await this._updateObjectMapProperty(vm, 'VCPUs_params', {weight})
  }

  async _startVm (vm, force) {
    debug(`Starting VM ${vm.name_label}`)

    if (force) {
      await this._updateObjectMapProperty(vm, 'blocked_operations', {
        start: null
      })
    }

    return this.call(
      'VM.start',
      vm.$ref,
      false, // Start paused?
      false // Skip pre-boot checks?
    )
  }

  async startVm (vmId, force) {
    try {
      await this._startVm(this.getObject(vmId), force)
    } catch (e) {
      if (e.code === 'OPERATION_BLOCKED') {
        throw forbiddenOperation('Start', e.params[1])
      }

      throw e
    }
  }

  async startVmOnCd (vmId) {
    const vm = this.getObject(vmId)

    if (isVmHvm(vm)) {
      const { order } = vm.HVM_boot_params

      await this._updateObjectMapProperty(vm, 'HVM_boot_params', {
        order: 'd'
      })

      try {
        await this._startVm(vm)
      } finally {
        await this._updateObjectMapProperty(vm, 'HVM_boot_params', {
          order
        })
      }
    } else {
      // Find the original template by name (*sigh*).
      const templateNameLabel = vm.other_config['base_template_name']
      const template = templateNameLabel &&
        find(this.objects.all, obj => (
          obj.$type === 'vm' &&
          obj.is_a_template &&
          obj.name_label === templateNameLabel
        ))

      const bootloader = vm.PV_bootloader
      const bootables = []
      try {
        const promises = []

        const cdDrive = this._getVmCdDrive(vm)
        forEach(vm.$VBDs, vbd => {
          promises.push(
            this._setObjectProperties(vbd, {
              bootable: vbd === cdDrive
            })
          )

          bootables.push([ vbd, Boolean(vbd.bootable) ])
        })

        promises.push(
          this._setObjectProperties(vm, {
            PV_bootloader: 'eliloader'
          }),
          this._updateObjectMapProperty(vm, 'other_config', {
            'install-distro': template && template.other_config['install-distro'],
            'install-repository': 'cdrom'
          })
        )

        await Promise.all(promises)

        await this._startVm(vm)
      } finally {
        this._setObjectProperties(vm, {
          PV_bootloader: bootloader
        })::ignoreErrors()

        forEach(bootables, ([ vbd, bootable ]) => {
          this._setObjectProperties(vbd, { bootable })::ignoreErrors()
        })
      }
    }
  }

  // vm_operations: http://xapi-project.github.io/xen-api/classes/vm.html
  async addForbiddenOperationToVm (vmId, operation, reason) {
    await this.call('VM.add_to_blocked_operations', this.getObject(vmId).$ref, operation, `[XO] ${reason}`)
  }

  async removeForbiddenOperationFromVm (vmId, operation) {
    await this.call('VM.remove_from_blocked_operations', this.getObject(vmId).$ref, operation)
  }

  // =================================================================

  async _createVbd (vm, vdi, {
    bootable = false,
    empty = !vdi,
    type = 'Disk',
    unpluggable = false,
    userdevice = undefined,

    mode = (type === 'Disk') ? 'RW' : 'RO',
    position = userdevice,

    readOnly = (mode === 'RO')
  } = {}) {
    debug(`Creating VBD for VDI ${vdi.name_label} on VM ${vm.name_label}`)

    if (position == null) {
      const allowed = await this.call('VM.get_allowed_VBD_devices', vm.$ref)
      const {length} = allowed
      if (!length) {
        throw new Error('no allowed VBD positions (devices)')
      }

      if (type === 'CD') {
        // Choose position 3 if allowed.
        position = includes(allowed, '3')
          ? '3'
          : allowed[0]
      } else {
        position = allowed[0]

        // Avoid position 3 if possible.
        if (position === '3' && length > 1) {
          position = allowed[1]
        }
      }
    }

    // By default a VBD is unpluggable.
    const vbdRef = await this.call('VBD.create', {
      bootable: Boolean(bootable),
      empty: Boolean(empty),
      mode: readOnly ? 'RO' : 'RW',
      other_config: {},
      qos_algorithm_params: {},
      qos_algorithm_type: '',
      type,
      unpluggable: Boolean(unpluggable),
      userdevice: String(position),
      VDI: vdi.$ref,
      VM: vm.$ref
    })

    if (isVmRunning(vm)) {
      await this.call('VBD.plug', vbdRef)
    }

    return vbdRef
  }

  _cloneVdi (vdi) {
    debug(`Cloning VDI ${vdi.name_label}`)

    return this.call('VDI.clone', vdi.$ref)
  }

  async _createVdi (size, {
    name_description = undefined,
    name_label = '',
    other_config = {},
    read_only = false,
    sharable = false,

    // FIXME: should be named srId or an object.
    sr = this.pool.default_SR,

    tags = [],
    type = 'user',
    xenstore_data = undefined
  } = {}) {
    if (sr === NULL_REF) {
      throw new Error('SR required to create VDI')
    }

    sr = this.getObject(sr)
    debug(`Creating VDI ${name_label} on ${sr.name_label}`)

    sharable = Boolean(sharable)
    read_only = Boolean(read_only)

    const data = {
      name_description,
      name_label,
      other_config,
      read_only,
      sharable,
      tags,
      type,
      virtual_size: String(size),
      SR: sr.$ref
    }

    if (xenstore_data) {
      data.xenstore_data = xenstore_data
    }

    return /* await */ this.call('VDI.create', data)
  }

  async moveVdi (vdiId, srId) {
    const vdi = this.getObject(vdiId)
    const sr = this.getObject(srId)

    if (vdi.SR === sr.$ref) {
      return // nothing to do
    }

    debug(`Moving VDI ${vdi.name_label} from ${vdi.$SR.name_label} to ${sr.name_label}`)
    try {
      await this.call('VDI.pool_migrate', vdi.$ref, sr.$ref, {})
    } catch (error) {
      if (error.code !== 'VDI_NEEDS_VM_FOR_MIGRATE') {
        throw error
      }
      const newVdiref = await this.call('VDI.copy', vdi.$ref, sr.$ref)
      const newVdi = await this._getOrWaitObject(newVdiref)
      await Promise.all(mapToArray(vdi.$VBDs, async vbd => {
        // Remove the old VBD
        await this.call('VBD.destroy', vbd.$ref)
        // Attach the new VDI to the VM with old VBD settings
        await this._createVbd(vbd.$VM, newVdi, {
          bootable: vbd.bootable,
          position: vbd.userdevice,
          type: vbd.type,
          readOnly: vbd.mode === 'RO'
        })
        // Remove the old VDI
        await this._deleteVdi(vdi)
      }))
    }
  }

  // TODO: check whether the VDI is attached.
  async _deleteVdi (vdi) {
    debug(`Deleting VDI ${vdi.name_label}`)

    await this.call('VDI.destroy', vdi.$ref)
  }

  async _resizeVdi (vdi, size) {
    debug(`Resizing VDI ${vdi.name_label} from ${vdi.virtual_size} to ${size}`)

    try {
      await this.call('VDI.resize_online', vdi.$ref, String(size))
    } catch (error) {
      if (error.code !== 'SR_OPERATION_NOT_SUPPORTED') {
        throw error
      }
      await this.call('VDI.resize', vdi.$ref, String(size))
    }
  }

  _getVmCdDrive (vm) {
    for (const vbd of vm.$VBDs) {
      if (vbd.type === 'CD') {
        return vbd
      }
    }
  }

  async _ejectCdFromVm (vm) {
    const cdDrive = this._getVmCdDrive(vm)
    if (cdDrive) {
      await this.call('VBD.eject', cdDrive.$ref)
    }
  }

  async _insertCdIntoVm (cd, vm, {
    bootable = false,
    force = false
  } = {}) {
    const cdDrive = await this._getVmCdDrive(vm)
    if (cdDrive) {
      try {
        await this.call('VBD.insert', cdDrive.$ref, cd.$ref)
      } catch (error) {
        if (!force || error.code !== 'VBD_NOT_EMPTY') {
          throw error
        }

        await this.call('VBD.eject', cdDrive.$ref)::ignoreErrors()

        // Retry.
        await this.call('VBD.insert', cdDrive.$ref, cd.$ref)
      }

      if (bootable !== Boolean(cdDrive.bootable)) {
        await this._setObjectProperties(cdDrive, {bootable})
      }
    } else {
      await this._createVbd(vm, cd, {
        bootable,
        type: 'CD'
      })
    }
  }

  async attachVdiToVm (vdiId, vmId, opts = undefined) {
    await this._createVbd(
      this.getObject(vmId),
      this.getObject(vdiId),
      opts
    )
  }

  async connectVbd (vbdId) {
    await this.call('VBD.plug', vbdId)
  }

  async _disconnectVbd (vbd) {
    // TODO: check if VBD is attached before
    try {
      await this.call('VBD.unplug_force', vbd.$ref)
    } catch (error) {
      if (error.code === 'VBD_NOT_UNPLUGGABLE') {
        await this.call('VBD.set_unpluggable', vbd.$ref, true)
        return this.call('VBD.unplug_force', vbd.$ref)
      }
    }
  }

  async disconnectVbd (vbdId) {
    await this._disconnectVbd(this.getObject(vbdId))
  }

  async _deleteVbd (vbd) {
    await this._disconnectVbd(vbd)::ignoreErrors()
    await this.call('VBD.destroy', vbd.$ref)
  }

  deleteVbd (vbdId) {
    return this._deleteVbd(this.getObject(vbdId))
  }

  // TODO: remove when no longer used.
  async destroyVbdsFromVm (vmId) {
    await Promise.all(
      mapToArray(this.getObject(vmId).$VBDs, async vbd => {
        await this.disconnectVbd(vbd.$ref)::ignoreErrors()
        return this.call('VBD.destroy', vbd.$ref)
      })
    )
  }

  async createVdi (size, opts) {
    return /* await */ this._getOrWaitObject(
      await this._createVdi(size, opts)
    )
  }

  async deleteVdi (vdiId) {
    await this._deleteVdi(this.getObject(vdiId))
  }

  async resizeVdi (vdiId, size) {
    await this._resizeVdi(this.getObject(vdiId), size)
  }

  async ejectCdFromVm (vmId) {
    await this._ejectCdFromVm(this.getObject(vmId))
  }

  async insertCdIntoVm (cdId, vmId, opts = undefined) {
    await this._insertCdIntoVm(
      this.getObject(cdId),
      this.getObject(vmId),
      opts
    )
  }

  // -----------------------------------------------------------------

  async snapshotVdi (vdiId, nameLabel) {
    const vdi = this.getObject(vdiId)

    const snap = await this._getOrWaitObject(
      await this.call('VDI.snapshot', vdi.$ref)
    )

    if (nameLabel) {
      await this.call('VDI.set_name_label', snap.$ref, nameLabel)
    }

    return snap
  }

  @cancellable
  _exportVdi ($cancelToken, vdi, base, format = VDI_FORMAT_VHD) {
    const host = vdi.$SR.$PBDs[0].$host

    const query = {
      format,
      vdi: vdi.$ref
    }
    if (base) {
      query.base = base.$ref
    }

    debug(`exporting VDI ${vdi.name_label}${base
      ? ` (from base ${vdi.name_label})`
      : ''
    }`)

    return this.getResource($cancelToken, '/export_raw_vdi/', {
      host,
      query,
      task: this.createTask('VDI Export', vdi.name_label)
    })
  }

  // Returns a stream to the exported VDI.
  exportVdi (vdiId, {
    baseId,
    format
  } = {}) {
    return this._exportVdi(
      this.getObject(vdiId),
      baseId && this.getObject(baseId),
      format
    )
  }

  // -----------------------------------------------------------------

  async _importVdiContent (vdi, body, format = VDI_FORMAT_VHD) {
    const pbd = find(vdi.$SR.$PBDs, 'currently_attached')
    if (pbd === undefined) {
      throw new Error('no valid PBDs found')
    }

    await Promise.all([
      body.checksumVerified,
      this.putResource(body, '/import_raw_vdi/', {
        host: pbd.host,
        query: {
          format,
          vdi: vdi.$ref
        },
        task: this.createTask('VDI Content Import', vdi.name_label)
      })
    ])
  }

  importVdiContent (vdiId, body, {
    format
  } = {}) {
    return this._importVdiContent(
      this.getObject(vdiId),
      body,
      format
    )
  }

  // =================================================================

  async _createVif (vm, network, {
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
    qos_algorithm_type = ''
  } = {}) {
    debug(`Creating VIF for VM ${vm.name_label} on network ${network.name_label}`)

    if (device == null) {
      device = (await this.call('VM.get_allowed_VIF_devices', vm.$ref))[0]
    }

    const vifRef = await this.call('VIF.create', filterUndefineds({
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
      VM: vm.$ref
    }))

    if (currently_attached && isVmRunning(vm)) {
      await this.call('VIF.plug', vifRef)
    }

    return vifRef
  }

  async createVif (vmId, networkId, opts = undefined) {
    return /* await */ this._getOrWaitObject(
      await this._createVif(
        this.getObject(vmId),
        this.getObject(networkId),
        opts
      )
    )
  }
  @deferrable.onFailure
  async createNetwork ($onFailure, {
    name,
    description = 'Created with Xen Orchestra',
    pifId,
    mtu,
    vlan
  }) {
    const networkRef = await this.call('network.create', {
      name_label: name,
      name_description: description,
      MTU: asInteger(mtu),
      other_config: {}
    })
    $onFailure(() => this.call('network.destroy', networkRef))
    if (pifId) {
      await this.call('pool.create_VLAN_from_PIF', this.getObject(pifId).$ref, networkRef, asInteger(vlan))
    }

    return this._getOrWaitObject(networkRef)
  }

  async editPif (
    pifId,
    { vlan }
  ) {
    const pif = this.getObject(pifId)
    const physPif = find(this.objects.all, obj => (
      obj.$type === 'pif' &&
      (obj.physical || !isEmpty(obj.bond_master_of)) &&
      obj.$pool === pif.$pool &&
      obj.device === pif.device
    ))

    if (!physPif) {
      throw new Error('PIF not found')
    }

    const pifs = this.getObject(pif.network).$PIFs

    const wasAttached = {}
    forEach(pifs, pif => {
      wasAttached[pif.host] = pif.currently_attached
    })

    const vlans = uniq(mapToArray(pifs, pif => pif.VLAN_master_of))
    await Promise.all(
      mapToArray(vlans, vlan => vlan !== NULL_REF && this.call('VLAN.destroy', vlan))
    )

    const newPifs = await this.call('pool.create_VLAN_from_PIF', physPif.$ref, pif.network, asInteger(vlan))
    await Promise.all(
      mapToArray(newPifs, pifRef =>
        !wasAttached[this.getObject(pifRef).host] && this.call('PIF.unplug', pifRef)::ignoreErrors()
      )
    )
  }

  @deferrable.onFailure
  async createBondedNetwork ($onFailure, {
    bondMode,
    mac,
    pifIds,
    ...params
  }) {
    const network = await this.createNetwork(params)
    $onFailure(() => this.deleteNetwork(network))
    // TODO: test and confirm:
    // Bond.create is called here with PIFs from one host but XAPI should then replicate the
    // bond on each host in the same pool with the corresponding PIFs (ie same interface names?).
    await this.call('Bond.create', network.$ref, map(pifIds, pifId => this.getObject(pifId).$ref), mac, bondMode)

    return network
  }

  async deleteNetwork (networkId) {
    const network = this.getObject(networkId)
    const pifs = network.$PIFs

    const vlans = uniq(mapToArray(pifs, pif => pif.VLAN_master_of))
    await Promise.all(
      mapToArray(vlans, vlan => vlan !== NULL_REF && this.call('VLAN.destroy', vlan))
    )

    const bonds = uniq(flatten(mapToArray(pifs, pif => pif.bond_master_of)))
    await Promise.all(
      mapToArray(bonds, bond => this.call('Bond.destroy', bond))
    )

    await this.call('network.destroy', network.$ref)
  }

  // =================================================================

  async _doDockerAction (vmId, action, containerId) {
    const vm = this.getObject(vmId)
    const host = vm.$resident_on || this.pool.$master

    return /* await */ this.call('host.call_plugin', host.$ref, 'xscontainer', action, {
      vmuuid: vm.uuid,
      container: containerId
    })
  }

  async registerDockerContainer (vmId) {
    await this._doDockerAction(vmId, 'register')
  }

  async deregisterDockerContainer (vmId) {
    await this._doDockerAction(vmId, 'deregister')
  }

  async startDockerContainer (vmId, containerId) {
    await this._doDockerAction(vmId, 'start', containerId)
  }

  async stopDockerContainer (vmId, containerId) {
    await this._doDockerAction(vmId, 'stop', containerId)
  }

  async restartDockerContainer (vmId, containerId) {
    await this._doDockerAction(vmId, 'restart', containerId)
  }

  async pauseDockerContainer (vmId, containerId) {
    await this._doDockerAction(vmId, 'pause', containerId)
  }

  async unpauseDockerContainer (vmId, containerId) {
    await this._doDockerAction(vmId, 'unpause', containerId)
  }

  async getCloudInitConfig (templateId) {
    const template = this.getObject(templateId)
    const host = this.pool.$master

    let config = await this.call('host.call_plugin', host.$ref, 'xscontainer', 'get_config_drive_default', {
      templateuuid: template.uuid
    })
    return config.slice(4) // FIXME remove the "True" string on the begining
  }

  // Specific CoreOS Config Drive
  async createCoreOsCloudInitConfigDrive (vmId, srId, config) {
    const vm = this.getObject(vmId)
    const host = this.pool.$master
    const sr = this.getObject(srId)

    await this.call('host.call_plugin', host.$ref, 'xscontainer', 'create_config_drive', {
      vmuuid: vm.uuid,
      sruuid: sr.uuid,
      configuration: config
    })
    await this.registerDockerContainer(vmId)
  }

  // Generic Config Drive
  @deferrable.onFailure
  async createCloudInitConfigDrive ($onFailure, vmId, srId, config) {
    const vm = this.getObject(vmId)
    const sr = this.getObject(srId)

    // First, create a small VDI (10MB) which will become the ConfigDrive
    const buffer = fatfsBufferInit()
    const vdi = await this.createVdi(buffer.length, { name_label: 'XO CloudConfigDrive', name_description: undefined, sr: sr.$ref })
    $onFailure(() => this._deleteVdi(vdi))

    // Then, generate a FAT fs
    const fs = promisifyAll(fatfs.createFileSystem(fatfsBuffer(buffer)))

    await fs.mkdir('openstack')
    await fs.mkdir('openstack/latest')
    await Promise.all([
      fs.writeFile(
        'openstack/latest/meta_data.json',
        '{\n    "uuid": "' + vm.uuid + '"\n}\n'
      ),
      fs.writeFile('openstack/latest/user_data', config)
    ])

    // ignore VDI_IO_ERROR errors, I (JFT) don't understand why they
    // are emitted because it works
    await this._importVdiContent(vdi, buffer, VDI_FORMAT_RAW)::pCatch(
      { code: 'VDI_IO_ERROR' },
      console.warn
    )

    await this._createVbd(vm, vdi)
  }

  @deferrable.onFailure
  async createTemporaryVdiOnSr ($onFailure, stream, sr, name_label, name_description) {
    const vdi = await this.createVdi(stream.length, {
      sr: sr.$ref,
      name_label,
      name_description
    })
    $onFailure(() => this._deleteVdi(vdi))

    await this.importVdiContent(vdi.$id, stream, { format: VDI_FORMAT_RAW })

    return vdi
  }

  // Create VDI on an adequate local SR
  async createTemporaryVdiOnHost (stream, hostId, name_label, name_description) {
    const pbd = find(
      this.getObject(hostId).$PBDs,
      pbd => canSrHaveNewVdiOfSize(pbd.$SR, stream.length)
    )

    if (pbd == null) {
      throw new Error('no SR available')
    }

    return this.createTemporaryVdiOnSr(stream, pbd.SR, name_label, name_description)
  }

  findAvailableSharedSr (minSize) {
    return find(
      this.objects.all,
      obj => obj.$type === 'sr' && obj.shared && canSrHaveNewVdiOfSize(obj, minSize)
    )
  }

  // =================================================================
}
