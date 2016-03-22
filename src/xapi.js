import createDebug from 'debug'
import every from 'lodash.every'
import fatfs from 'fatfs'
import fatfsBuffer, { init as fatfsBufferInit } from './fatfs-buffer'
import find from 'lodash.find'
import includes from 'lodash.includes'
// import isFinite from 'lodash.isfinite'
import pickBy from 'lodash.pickby'
import sortBy from 'lodash.sortby'
import unzip from 'julien-f-unzip'
import { utcFormat, utcParse } from 'd3-time-format'
import {
  wrapError as wrapXapiError,
  Xapi as XapiBase
} from 'xen-api'
import {
  satisfies as versionSatisfies
} from 'semver'

import httpRequest from './http-request'
import {
  debounce,
  deferrable
} from './decorators'
import httpProxy from './http-proxy'
import {
  bufferToStream,
  camelToSnakeCase,
  createRawObject,
  ensureArray,
  forEach,
  isBoolean,
  isFunction,
  isInteger,
  isObject,
  map,
  mapToArray,
  noop,
  pAll,
  parseXml,
  pCatch,
  pDelay,
  pFinally,
  promisifyAll,
  pSettle
} from './utils'
import {
  GenericError,
  ForbiddenOperation
} from './api-errors'

const debug = createDebug('xo:xapi')

// ===================================================================

const TAG_BASE_DELTA = 'xo:base_delta'
const TAG_COPY_SRC = 'xo:copy_of'

// ===================================================================

const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/
function extractOpaqueRef (str) {
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    throw new Error('no opaque ref found')
  }
  return matches[0]
}

// HTTP put, use an ugly hack if the length is not known because XAPI
// does not support chunk encoding.
const put = (stream, {
  headers: { ...headers } = {},
  ...opts
}, task) => {
  const makeRequest = () => httpRequest({
    ...opts,
    body: stream,
    headers,
    method: 'put'
  })

  // Xen API does not support chunk encoding.
  if (stream.length == null) {
    headers['transfer-encoding'] = null

    const promise = makeRequest()

    if (task) {
      // Some connections need the task to resolve (VDI import).
      task::pFinally(() => {
        promise.cancel()
      })
    } else {
      // Some tasks need the connection to close (VM import).
      promise.request.once('finish', () => {
        promise.cancel()
      })
    }

    return promise.readAll()
  }

  return makeRequest().readAll()
}

const asBoolean = value => Boolean(value)
// const asFloat = value => {
//   value = String(value)
//   return value.indexOf('.') === -1
//     ? `${value}.0`
//     : value
// }
const asInteger = value => String(value)

const filterUndefineds = obj => pickBy(obj, value => value !== undefined)

const prepareXapiParam = param => {
  // if (isFinite(param) && !isInteger(param)) {
  //   return asFloat(param)
  // }
  if (isInteger(param)) {
    return asInteger(param)
  }
  if (isBoolean(param)) {
    return asBoolean(param)
  }
  if (isObject(param)) {
    return map(filterUndefineds(param), prepareXapiParam)
  }

  return param
}
// ===================================================================

const typeToNamespace = createRawObject()
forEach([
  'Bond',
  'DR_task',
  'GPU_group',
  'PBD',
  'PCI',
  'PGPU',
  'PIF',
  'PIF_metrics',
  'SM',
  'SR',
  'VBD',
  'VBD_metrics',
  'VDI',
  'VGPU',
  'VGPU_type',
  'VLAN',
  'VM',
  'VM_appliance',
  'VM_guest_metrics',
  'VM_metrics',
  'VMPP',
  'VTPM'
], namespace => {
  typeToNamespace[namespace.toLowerCase()] = namespace
})

// Object types given by `xen-api` are always lowercase but the
// namespaces in the Xen API can have a different casing.
const getNamespaceForType = (type) => typeToNamespace[type] || type

// ===================================================================

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
export const formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')

export const parseDateTime = utcParse('%Y%m%dT%H:%M:%SZ')

export const isHostRunning = (host) => {
  const {$metrics: metrics} = host

  return metrics && metrics.live
}

const VM_RUNNING_POWER_STATES = {
  Running: true,
  Paused: true
}
export const isVmRunning = (vm) => VM_RUNNING_POWER_STATES[vm.power_state]

export const isVmHvm = (vm) => Boolean(vm.HVM_boot_policy)

// VDI formats. (Raw is not available for delta vdi.)
export const VDI_FORMAT_VHD = 'vhd'
export const VDI_FORMAT_RAW = 'raw'

// ===================================================================

export default class Xapi extends XapiBase {
  constructor (...args) {
    super(...args)

    const genericWatchers = this._genericWatchers = createRawObject()
    const objectsWatchers = this._objectWatchers = createRawObject()
    const taskWatchers = this._taskWatchers = createRawObject()

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

        // Watched task.
        if (ref in taskWatchers) {
          const {status} = object

          if (status === 'success') {
            taskWatchers[ref].resolve(object.result)
          } else if (status === 'failure') {
            taskWatchers[ref].reject(wrapXapiError(object.error_info))
          } else {
            return
          }

          delete taskWatchers[ref]
        }
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
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
      let resolve
      const promise = new Promise(resolve_ => resolve = resolve_)

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
      let resolve
      const promise = new Promise(resolve_ => {
        resolve = resolve_
      })

      // Register the watcher.
      watcher = this._objectWatchers[predicate] = {
        promise,
        resolve
      }
    }

    return watcher.promise
  }

  // Returns the objects if already presents or waits for it.
  async _getOrWaitObject (idOrUuidOrRef) {
    return (
      this.getObject(idOrUuidOrRef, undefined) ||
      this._waitObject(idOrUuidOrRef)
    )
  }

  // =================================================================

  // Create a task.
  async _createTask (name = 'untitled task', description = '') {
    const ref = await this.call('task.create', `[XO] ${name}`, description)
    debug('task created: %s (%s)', name, description)

    this._watchTask(ref)::pFinally(() => {
      this.call('task.destroy', ref).then(() => {
        debug('task destroyed: %s (%s)', name, description)
      })
    })

    return ref
  }

  // Waits for a task to be resolved.
  _watchTask (ref) {
    // If a task object is passed, unpacked the ref.
    if (typeof ref === 'object' && ref.$ref) ref = ref.$ref

    let watcher = this._taskWatchers[ref]
    if (!watcher) {
      let resolve, reject
      const promise = new Promise((resolve_, reject_) => {
        resolve = resolve_
        reject = reject_
      })

      // Register the watcher.
      watcher = this._taskWatchers[ref] = {
        promise,
        resolve,
        reject
      }
    }

    return watcher.promise
  }

  // =================================================================

  async _setObjectProperties (object, props) {
    const {
      $ref: ref,
      $type: type
    } = object

    const namespace = getNamespaceForType(type)

    // TODO: the thrown error should contain the name of the
    // properties that failed to be set.
    await Promise.all(mapToArray(props, (value, name) => {
      if (value != null) {
        return this.call(`${namespace}.set_${camelToSnakeCase(name)}`, ref, value)
      }
    }))
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
          : removal::pCatch(noop).then(() => this.call(add, ref, name, prepareXapiParam(value)))
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
      this._updateObjectMapProperty(pool, 'other_config', {
        autoPoweron
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

  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates () {
    const { readAll, statusCode } = await httpRequest(
      'http://updates.xensource.com/XenServer/updates.xml',
      { agent: httpProxy }
    )

    if (statusCode !== 200) {
      throw new GenericError('cannot fetch patches list from Citrix')
    }

    const data = parseXml(await readAll()).patchdata

    const patches = createRawObject()
    forEach(data.patches.patch, patch => {
      patches[patch.uuid] = {
        date: patch.timestamp,
        description: patch['name-description'],
        documentationUrl: patch.url,
        guidance: patch['after-apply-guidance'],
        name: patch['name-label'],
        url: patch['patch-url'],
        uuid: patch.uuid,
        conflicts: mapToArray(ensureArray(patch.conflictingpatches), patch => {
          return patch.conflictingpatch.uuid
        }),
        requirements: mapToArray(ensureArray(patch.requiredpatches), patch => {
          return patch.requiredpatch.uuid
        })
        // TODO: what does it mean, should we handle it?
        // version: patch.version,
      }
      if (patches[patch.uuid].conflicts[0] === undefined) {
        patches[patch.uuid].conflicts.length = 0
      }
      if (patches[patch.uuid].requirements[0] === undefined) {
        patches[patch.uuid].requirements.length = 0
      }
    })

    const resolveVersionPatches = function (uuids) {
      const versionPatches = createRawObject()

      forEach(uuids, ({uuid}) => {
        versionPatches[uuid] = patches[uuid]
      })

      return versionPatches
    }

    const versions = createRawObject()
    let latestVersion
    forEach(data.serverversions.version, version => {
      versions[version.value] = {
        date: version.timestamp,
        name: version.name,
        id: version.value,
        documentationUrl: version.url,
        patches: resolveVersionPatches(version.patch)
      }

      if (version.latest) {
        latestVersion = versions[version.value]
      }
    })

    return {
      patches,
      latestVersion,
      versions
    }
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

  // Returns installed and not installed patches for a given host.
  async _getPoolPatchesForHost (host) {
    const versions = (await this._getXenUpdates()).versions

    const hostVersions = host.software_version
    const version =
      versions[hostVersions.product_version] ||
      versions[hostVersions.product_version_text]

    return version
      ? version.patches
      : []
  }

  _getInstalledPoolPatchesOnHost (host) {
    const installed = createRawObject()

    forEach(host.$patches, hostPatch => {
      installed[hostPatch.$pool_patch.uuid] = true
    })

    return installed
  }

  async _listMissingPoolPatchesOnHost (host) {
    const all = await this._getPoolPatchesForHost(host)
    const installed = this._getInstalledPoolPatchesOnHost(host)

    const installable = createRawObject()
    forEach(all, (patch, uuid) => {
      if (installed[uuid]) {
        return
      }

      for (const uuid of patch.conflicts) {
        if (uuid in installed) {
          return
        }
      }

      installable[uuid] = patch
    })

    return installable
  }

  async listMissingPoolPatchesOnHost (hostId) {
    // Returns an array to not break compatibility.
    return mapToArray(
      await this._listMissingPoolPatchesOnHost(this.getObject(hostId))
    )
  }

  // -----------------------------------------------------------------

  _isPoolPatchInstallableOnHost (patchUuid, host) {
    const installed = this._getInstalledPoolPatchesOnHost(host)

    if (installed[patchUuid]) {
      return false
    }

    let installable = true

    forEach(installed, patch => {
      if (includes(patch.conflicts, patchUuid)) {
        installable = false

        return false
      }
    })

    return installable
  }

  // -----------------------------------------------------------------

  async uploadPoolPatch (stream, patchName = 'unknown') {
    const taskRef = await this._createTask('Patch upload', patchName)

    const task = this._watchTask(taskRef)
    const [ patchRef ] = await Promise.all([
      task,
      put(stream, {
        hostname: this.pool.$master.address,
        path: '/pool_patch_upload',
        query: {
          session_id: this.sessionId,
          task_id: taskRef
        }
      }, task)
    ])

    return this._getOrWaitObject(patchRef)
  }

  async _getOrUploadPoolPatch (uuid) {
    try {
      return this.getObjectByUuid(uuid)
    } catch (error) {}

    debug('downloading patch %s', uuid)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + uuid)
    }

    let stream = await httpRequest(patchInfo.url, { agent: httpProxy })
    stream = await new Promise((resolve, reject) => {
      const PATCH_RE = /\.xsupdate$/
      stream.pipe(unzip.Parse()).on('entry', entry => {
        if (PATCH_RE.test(entry.path)) {
          entry.length = entry.size
          resolve(entry)
        } else {
          entry.autodrain()
        }
      }).on('error', reject)
    })

    return this.uploadPoolPatch(stream, patchInfo.name)
  }

  // -----------------------------------------------------------------

  async _installPoolPatchOnHost (patchUuid, host) {
    debug('installing patch %s', patchUuid)

    const patch = await this._getOrUploadPoolPatch(patchUuid)
    await this.call('pool_patch.apply', patch.$ref, host.$ref)
  }

  async installPoolPatchOnHost (patchUuid, hostId) {
    return /* await */ this._installPoolPatchOnHost(
      patchUuid,
      this.getObject(hostId)
    )
  }

  // -----------------------------------------------------------------

  async installPoolPatchOnAllHosts (patchUuid) {
    const patch = await this._getOrUploadPoolPatch(patchUuid)

    await this.call('pool_patch.pool_apply', patch.$ref)
  }

  // -----------------------------------------------------------------

  async _installPoolPatchOnHostAndRequirements (patch, host, patchesByUuid) {
    const { requirements } = patch
    if (requirements.length) {
      for (const requirementUuid of requirements) {
        if (this._isPoolPatchInstallableOnHost(requirementUuid, host)) {
          const requirement = patchesByUuid[requirementUuid]
          await this._installPoolPatchOnHostAndRequirements(requirement, host, patchesByUuid)

          host = this.getObject(host.$id)
        }
      }
    }

    await this._installPoolPatchOnHost(patch.uuid, host)
  }

  async installAllPoolPatchesOnHost (hostId) {
    let host = this.getObject(hostId)

    const installableByUuid = await this._listMissingPoolPatchesOnHost(host)

    // List of all installable patches sorted from the newest to the
    // oldest.
    const installable = sortBy(
      installableByUuid,
      patch => -Date.parse(patch.date)
    )

    for (let i = 0, n = installable.length; i < n; ++i) {
      const patch = installable[i]

      if (this._isPoolPatchInstallableOnHost(patch.uuid, host)) {
        await this._installPoolPatchOnHostAndRequirements(patch, host, installableByUuid)
        host = this.getObject(host.$id)
      }
    }
  }

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
        await this.call('host.enabled', ref)

        throw error
      }
    }
  }

  async disableHost (hostId) {
    await this.call('host.disable', this.getObject(hostId).$ref)
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
    let snapshotRef
    if (isVmRunning(vm)) {
      snapshotRef = await this._snapshotVm(vm)
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
        snapshotRef || vm.$ref,
        nameLabel,
        sr ? sr.$ref : ''
      )
    } finally {
      if (snapshotRef) {
        await this._deleteVm(
          await this._getOrWaitObject(snapshotRef),
          true
        )
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
      this.addTag(ref, 'quiesce')::pCatch(noop) // ignore any failures
    } catch (error) {
      if (
        error.code !== 'VM_SNAPSHOT_WITH_QUIESCE_NOT_SUPPORTED' &&
        error.code !== 'VM_BAD_POWER_STATE' // quiesce only work on a running VM
      ) {
        throw error
      }
      ref = await this.call('VM.snapshot', vm.$ref, nameLabel)
    }
    // Convert the template to a VM.
    await this.call('VM.set_is_a_template', ref, false)

    return ref
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
      return this.copyVm(vmId, targetSrId, { nameLabel })
    }

    const sr = targetXapi.getObject(targetSrId)
    const stream = await this.exportVm(vmId, {
      compress,
      onlyMetadata: false
    })

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

    return vm
  }

  // Low level create VM.
  _createVm ({
    actions_after_crash,
    actions_after_reboot,
    actions_after_shutdown,
    affinity,
    // appliance,
    blocked_operations,
    generation_id,
    ha_always_run,
    ha_restart_priority,
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
      affinity: affinity == null ? 'OpaqueRef:NULL' : affinity,
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
      hardware_platform_version,
      // HVM_shadow_multiplier: asFloat(HVM_shadow_multiplier), // FIXME: does not work FIELD_TYPE_ERROR(hVM_shadow_multiplier)
      name_description,
      name_label,
      order,
      protection_policy,
      shutdown_delay: asInteger(shutdown_delay),
      start_delay: asInteger(start_delay),
      tags,
      version: asInteger(version),
      xenstore_data
    }))
  }

  // TODO: clean up on error.
  async createVm (templateId, {
    nameDescription = undefined,
    nameLabel = undefined,
    pvArgs = undefined,
    cpus = undefined,
    installRepository = undefined,
    vdis = undefined,
    vifs = undefined,
    existingVdis = undefined
  } = {}) {
    const installMethod = (() => {
      if (installRepository == null) {
        return 'none'
      }

      try {
        installRepository = this.getObject(installRepository)
        return 'cd'
      } catch (_) {
        return 'network'
      }
    })()
    const template = this.getObject(templateId)

    // Clones the template.
    const vm = await this._getOrWaitObject(
      await this._cloneVm(template, nameLabel)
    )

    // TODO: copy BIOS strings?

    // Removes disks from the provision XML, we will create them by
    // ourselves.
    await this.call('VM.remove_from_other_config', vm.$ref, 'disks')::pCatch(noop)

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.call('VM.provision', vm.$ref)

    // Set VMs params.
    this._setObjectProperties(vm, {
      nameDescription,
      PV_args: pvArgs,
      VCPUs_at_startup: cpus
    })

    // Sets boot parameters.
    {
      const isHvm = isVmHvm(vm)

      if (isHvm) {
        if (!vdis.length || installMethod === 'network') {
          const { HVM_boot_params: bootParams } = vm
          let order = bootParams.order
          if (order) {
            order = 'n' + order.replace('n', '')
          } else {
            order = 'ncd'
          }

          this._setObjectProperties(vm, {
            HVM_boot_params: { ...bootParams, order }
          })
        }
      } else { // PV
        if (vm.PV_bootloader === 'eliloader') {
          if (installMethod === 'network') {
            // TODO: normalize RHEL URL?

            await this._updateObjectMapProperty(vm, 'other_config', {
              'install-repository': installRepository
            })
          } else if (installMethod === 'cd') {
            await this._updateObjectMapProperty(vm, 'other_config', {
              'install-repository': 'cdrom'
            })
          }
        }
      }
    }

    // Inserts the CD if necessary.
    if (installMethod === 'cd') {
      // When the VM is started, if PV, the CD drive will become not
      // bootable and the first disk bootable.
      await this._insertCdIntoVm(installRepository, vm, {
        bootable: true
      })
    }

    // Modify existing (previous template) disks if necessary
    const this_ = this // Work around http://phabricator.babeljs.io/T7172
    existingVdis && await Promise.all(mapToArray(existingVdis, async ({ size, $SR: srId, ...properties }, userdevice) => {
      const vbd = find(vm.$VBDs, { userdevice })
      if (!vbd) {
        return
      }
      const vdi = vbd.$VDI
      await this_._setObjectProperties(vdi, properties)

      // if the disk is bigger
      if (
        size != null &&
        size > vdi.virtual_size
      ) {
        await this_.resizeVdi(vdi.$id, size)
      }
      // if another SR is set, move it there
      if (srId) {
        await this_.moveVdi(vdi.$id, srId)
      }
    }))

    // Creates the user defined VDIs.
    //
    // TODO: set vm.suspend_SR
    vdis && await Promise.all(mapToArray(vdis, (vdiDescription, i) => {
      return this._createVdi(
        vdiDescription.size, // FIXME: Should not be done in Xapi.
        {
          name_label: vdiDescription.name_label,
          name_description: vdiDescription.name_description,
          sr: vdiDescription.sr || vdiDescription.SR
        }
      )
        .then(ref => this._getOrWaitObject(ref))
        .then(vdi => this._createVbd(vm, vdi, {
          // Only the first VBD if installMethod is not cd is bootable.
          bootable: installMethod !== 'cd' && !i
        }))
    }))

    // Destroys the VIFs cloned from the template.
    await Promise.all(mapToArray(vm.$VIFs, vif => this._deleteVif(vif)))

    // Creates the VIFs specified by the user.
    {
      let position = 0
      vifs && await Promise.all(mapToArray(vifs, vif => this._createVif(
        vm,
        this.getObject(vif.network),
        {
          position: position++,
          mac: vif.mac,
          mtu: vif.mtu
        }
      )))
    }

    // TODO: Assign VGPUs.

    return this._waitObject(vm.$id)
  }

  async _deleteVm (vm, deleteDisks) {
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
          return this._deleteVdi(vdi)::pCatch(noop)
        }
        console.error(`cannot delete VDI ${vdi.name_label} (from VM ${vm.name_label})`)
      }))
    }

    await Promise.all(mapToArray(vm.$snapshots, snapshot => {
      return this.deleteVm(snapshot.$id, true)::pCatch(noop)
    }))

    await this.call('VM.destroy', vm.$ref)
  }

  async deleteVm (vmId, deleteDisks = false) {
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
      snapshotRef = await this._snapshotVm(vm)
    } else {
      host = this.pool.$master
    }

    const taskRef = await this._createTask('VM Export', vm.name_label)
    if (snapshotRef) {
      this._watchTask(taskRef)::pFinally(() => {
        this.deleteVm(snapshotRef, true)::pCatch(noop)
      })
    }

    return httpRequest({
      hostname: host.address,
      path: onlyMetadata ? '/export_metadata/' : '/export/',
      query: {
        ref: snapshotRef || vm.$ref,
        session_id: this.sessionId,
        task_id: taskRef,
        use_compression: compress ? 'true' : 'false'
      }
    })
  }

  // Create a snapshot of the VM and returns a delta export object.
  @deferrable.onFailure
  async exportDeltaVm ($onFailure, vmId, baseVmId = undefined, {
    snapshotNameLabel = undefined,
    // Contains a vdi.$id set of vmId.
    fullVdisRequired = [],
    disableBaseTags = false
  } = {}) {
    const vm = await this.snapshotVm(vmId)
    $onFailure(() => this._deleteVm(vm, true))
    if (snapshotNameLabel) {
      this._setObjectProperties(vm, {
        nameLabel: snapshotNameLabel
      })::pCatch(noop)
    }

    const baseVm = baseVmId && this.getObject(baseVmId)

    const baseVdis = {}
    baseVm && forEach(baseVm.$VBDs, vbd => {
      const vdi = vbd.$VDI
      if (vdi && !find(fullVdisRequired, id => vdi.$snapshot_of.$id === id)) {
        baseVdis[vbd.VDI] = vdi
      }
    })

    const streams = {}
    const vdis = {}
    const vbds = {}
    forEach(vm.$VBDs, vbd => {
      const vdiId = vbd.VDI
      if (!vdiId || vbd.type !== 'Disk') {
        // Ignore this VBD.
        return
      }

      vbds[vbd.$ref] = vbd

      if (vdiId in vdis) {
        // This VDI has already been managed.
        return
      }

      const vdi = vbd.$VDI

      // Look for a snapshot of this vdi in the base VM.
      let baseVdi
      baseVm && forEach(vdi.$snapshot_of.$snapshots, vdi => {
        if (baseVdis[vdi.$ref]) {
          baseVdi = vdi

          // Stop iterating.
          return false
        }
      })

      vdis[vdiId] = baseVdi && !disableBaseTags
        ? {
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: baseVdi.uuid
          }
        }
        : vdi
      const stream = streams[`${vdiId}.vhd`] = this._exportVdi(vdi, baseVdi, VDI_FORMAT_VHD)
      $onFailure(() => stream.cancel())
    })

    const vifs = {}
    forEach(vm.$VIFs, vif => {
      vifs[vif.$ref] = vif
    })

    return {
      // TODO: make non-enumerable?
      streams: await streams::pAll(),

      version: '1.0.0',
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
        : vm
    }
  }

  @deferrable.onFailure
  async importDeltaVm ($onFailure, delta, {
    deleteBase = false,
    name_label = delta.vm.name_label,
    srId = this.pool.default_SR,
    disableStartAfterImport = true
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

    const sr = this.getObject(srId)

    const baseVdis = {}
    baseVm && forEach(baseVm.$VBDs, vbd => {
      baseVdis[vbd.VDI] = vbd.$VDI
    })

    const { streams } = delta

    // 1. Create the VMs.
    const vm = await this._getOrWaitObject(
      await this._createVm({
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
    await Promise.all(mapToArray(
      vm.$VBDs,
      vbd => this._deleteVbd(vbd)::pCatch(noop)
    ))

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
          sr: sr.$id
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
      defaultNetwork && Promise.all(mapToArray(delta.vifs, vif => this._createVif(
        vm,
        networksOnPoolMasterByDevice[vif.device] || defaultNetwork,
        vif
      )))
    ])

    if (deleteBase && baseVm) {
      this._deleteVm(baseVm, true)::pCatch(noop)
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
    mapVdisSrs,
    mapVifsNetworks
  }) {
    // VDIs/SRs mapping
    const vdis = {}
    const defaultSrRef = host.$pool.$default_SR.$ref
    for (const vbd of vm.$VBDs) {
      const vdi = vbd.$VDI
      if (vbd.type === 'Disk') {
        vdis[vdi.$ref] = mapVdisSrs && mapVdisSrs[vdi.$id]
          ? hostXapi.getObject(mapVdisSrs[vdi.$id]).$ref
          : defaultSrRef
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

    const this_ = this
    const loop = () => this_.call(
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

  async _importVm (stream, sr, onlyMetadata = false, onVmCreation = undefined) {
    const taskRef = await this._createTask('VM import')
    const query = {
      force: onlyMetadata
        ? 'true'
        : undefined,
      session_id: this.sessionId,
      task_id: taskRef
    }

    let host
    if (sr) {
      host = sr.$PBDs[0].$host
      query.sr_id = sr.$ref
    } else {
      host = this.pool.$master
    }

    const path = onlyMetadata ? '/import_metadata/' : '/import/'

    if (onVmCreation) {
      this._waitObject(
        obj => obj && obj.current_operations && taskRef in obj.current_operations
      ).then(onVmCreation)::pCatch(noop)
    }

    const [ vmRef ] = await Promise.all([
      this._watchTask(taskRef).then(extractOpaqueRef),
      put(stream, {
        hostname: host.address,
        path,
        query
      })
    ])

    // Importing a metadata archive of running VMs is currently
    // broken: its VBDs are incorrectly seen as attached.
    //
    // A call to VM.power_state_reset fixes this problem.
    if (onlyMetadata) {
      await this.call('VM.power_state_reset', vmRef)
    }

    return vmRef
  }

  // TODO: an XVA can contain multiple VMs
  async importVm (stream, {
    onlyMetadata = false,
    srId
  } = {}) {
    return /* await */ this._getOrWaitObject(await this._importVm(
      stream,
      srId && this.getObject(srId),
      onlyMetadata
    ))
  }

  async migrateVm (vmId, hostXapi, hostId, {
    migrationNetworkId,
    mapVifsNetworks,
    mapVdisSrs
  } = {}) {
    const vm = this.getObject(vmId)
    if (!isVmRunning(vm)) {
      throw new Error('cannot migrate a non-running VM')
    }

    const host = hostXapi.getObject(hostId)

    const accrossPools = vm.$pool !== host.$pool
    const useStorageMotion = (
      accrossPools ||
      migrationNetworkId ||
      mapVifsNetworks ||
      mapVdisSrs
    )

    if (useStorageMotion) {
      await this._migrateVmWithStorageMotion(vm, hostXapi, host, {
        migrationNetwork: migrationNetworkId && hostXapi.getObject(migrationNetworkId),
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

  async snapshotVm (vmId, nameLabel = undefined) {
    return /* await */ this._getOrWaitObject(
      await this._snapshotVm(
        this.getObject(vmId),
        nameLabel
      )
    )
  }

  async setVcpuWeight (vmId, weight) {
    weight = weight || null // Take all falsy values as a removal (0 included)
    const vm = this.getObject(vmId)
    await this._updateObjectMapProperty(vm, 'VCPUs_params', {weight})
  }

  _startVm (vm) {
    debug(`Starting VM ${vm.name_label}`)

    return this.call(
      'VM.start',
      vm.$ref,
      false, // Start paused?
      false // Skip pre-boot checks?
    )
  }

  async startVm (vmId) {
    try {
      await this._startVm(this.getObject(vmId))
    } catch (e) {
      if (e.code === 'OPERATION_BLOCKED') {
        throw new ForbiddenOperation('Start', e.params[1])
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
        })::pCatch(noop)

        forEach(bootables, ([ vbd, bootable ]) => {
          this._setObjectProperties(vbd, { bootable })::pCatch(noop)
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
    empty = false,
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

    debug(`Moving VDI ${vdi.name_label} from vdi.$SR.name_label to ${sr.name_label}`)
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

        await this.call('VBD.eject', cdDrive.$ref)::pCatch(noop)

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

  _disconnectVbd (vbd) {
    // TODO: check if VBD is attached before
    return this.call('VBD.unplug_force', vbd.$ref)
  }

  async disconnectVbd (vbdId) {
    await this._disconnectVbd(this.getObject(vbdId))
  }

  async _deleteVbd (vbd) {
    await this._disconnectVbd(vbd)::pCatch(noop)
    await this.call('VBD.destroy', vbd.$ref)
  }

  // TODO: remove when no longer used.
  async destroyVbdsFromVm (vmId) {
    await Promise.all(
      mapToArray(this.getObject(vmId).$VBDs, async vbd => {
        await this.disconnectVbd(vbd.$ref)::pCatch(noop)
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

  async _exportVdi (vdi, base, format = VDI_FORMAT_VHD) {
    const host = vdi.$SR.$PBDs[0].$host
    const taskRef = await this._createTask('VDI Export', vdi.name_label)

    const query = {
      format,
      session_id: this.sessionId,
      task_id: taskRef,
      vdi: vdi.$ref
    }
    if (base) {
      query.base = base.$ref
    }

    debug(`exporting VDI ${vdi.name_label}${base
      ? ` (from base ${vdi.name_label})`
      : ''
    }`)

    const task = this._watchTask(taskRef)
    return httpRequest({
      hostname: host.address,
      path: '/export_raw_vdi/',
      query
    }).then(response => {
      response.cancel = (cancel => () => {
        return new Promise(resolve => {
          resolve(cancel())
        }).then(() => task::pCatch(noop))
      })(response.cancel)
      response.task = task

      return response
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

  async _importVdiContent (vdi, stream, format = VDI_FORMAT_VHD) {
    const taskRef = await this._createTask('VDI Content Import', vdi.name_label)

    const query = {
      session_id: this.sessionId,
      task_id: taskRef,
      format,
      vdi: vdi.$ref
    }

    const host = vdi.$SR.$PBDs[0].$host

    const task = this._watchTask(taskRef)
    await Promise.all([
      stream.checksumVerified,
      task,
      put(stream, {
        hostname: host.address,
        method: 'put',
        path: '/import_raw_vdi/',
        query
      }, task)
    ])
  }

  importVdiContent (vdiId, stream, {
    format
  } = {}) {
    return this._importVdiContent(
      this.getObject(vdiId),
      stream,
      format
    )
  }

  // =================================================================

  async _createVif (vm, network, {
    mac = '',
    mtu = 1500,
    position = undefined,

    device = position != null && String(position),
    ipv4_allowed = undefined,
    ipv6_allowed = undefined,
    locking_mode = undefined,
    MAC = mac,
    MTU = mtu,
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
      MTU: asInteger(MTU),
      network: network.$ref,
      other_config,
      qos_algorithm_params,
      qos_algorithm_type,
      VM: vm.$ref
    }))

    if (isVmRunning(vm)) {
      await this.call('VIF.plug', vifRef)
    }

    return vifRef
  }

  // TODO: check whether the VIF was unplugged before.
  async _deleteVif (vif) {
    await this.call('VIF.destroy', vif.$ref)
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

  async deleteVif (vifId) {
    await this._deleteVif(this.getObject(vifId))
  }

  async createNetwork ({
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
    if (pifId) {
      await this.call('pool.create_VLAN_from_PIF', this.getObject(pifId).$ref, networkRef, asInteger(vlan))
    }

    return this._getOrWaitObject(networkRef)
  }

  async deleteNetwork (networkId) {
    const network = this.getObject(networkId)
    await Promise.all(
      mapToArray(network.$PIFs, (pif) => this.call('VLAN.destroy', pif.$VLAN_master_of.$ref))
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
  }

  // Generic Config Drive
  async createCloudInitConfigDrive (vmId, srId, config) {
    const vm = this.getObject(vmId)
    const sr = this.getObject(srId)

    // First, create a small VDI (10MB) which will become the ConfigDrive
    const buffer = fatfsBufferInit()
    const vdi = await this.createVdi(buffer.length, { name_label: 'XO CloudConfigDrive', name_description: undefined, sr: sr.$ref })
    // Then, generate a FAT fs
    const fs = fatfs.createFileSystem(fatfsBuffer(buffer))::promisifyAll()
    // Create Cloud config folders
    await fs.mkdir('openstack')
    await fs.mkdir('openstack/latest')
    // Create the meta_data file
    await fs.writeFile('openstack/latest/meta_data.json', '{\n    "uuid": "' + vm.uuid + '"\n}\n')
    // Create the user_data file
    await fs.writeFile('openstack/latest/user_data', config)

    // Transform the buffer into a stream
    const stream = bufferToStream(buffer)
    await this.importVdiContent(vdi.$id, stream, {
      format: VDI_FORMAT_RAW
    })
    await this._createVbd(vm, vdi)
  }

  // =================================================================

}
