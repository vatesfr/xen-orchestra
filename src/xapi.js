import createDebug from 'debug'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import filter from 'lodash.filter'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import fs from 'fs-extra'
import got from 'got'
import includes from 'lodash.includes'
import map from 'lodash.map'
import snakeCase from 'lodash.snakecase'
import sortBy from 'lodash.sortby'
import unzip from 'julien-f-unzip'
import {PassThrough} from 'stream'
import Bluebird, {promisify} from 'bluebird'
import {
  wrapError as wrapXapiError,
  Xapi as XapiBase
} from 'xen-api'

import {debounce} from './decorators'
import {
  ensureArray,
  noop, parseXml,
  pFinally
} from './utils'
import {JsonRpcError} from './api-errors'

Bluebird.promisifyAll(fs)

const debug = createDebug('xo:xapi')

// ===================================================================

const gotPromise = promisify(got)

// ===================================================================

const typeToNamespace = Object.create(null)
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

// ===================================================================

export default class Xapi extends XapiBase {
  constructor (...args) {
    super(...args)

    const objectsWatchers = this._objectWatchers = Object.create(null)
    const taskWatchers = this._taskWatchers = Object.create(null)

    const onAddOrUpdate = objects => {
      forEach(objects, object => {
        const {
          $id: id,
          $ref: ref
        } = object

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

  // Wait for an object to appear or to be updated.
  //
  // TODO: implements a timeout.
  _waitObject (idOrUuidOrRef) {
    let watcher = this._objectWatchers[idOrUuidOrRef]
    if (!watcher) {
      let resolve
      const promise = new Promise(resolve_ => {
        resolve = resolve_
      })

      // Register the watcher.
      watcher = this._objectWatchers[idOrUuidOrRef] = {
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
    debug('task created: %s', name)

    pFinally(this._watchTask(ref), () => {
      this.call('task.destroy', ref).then(() => {
        debug('task destroyed: %s', name)
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
    await Promise.all(map(props, (value, name) => {
      if (value != null) {
        return this.call(`${namespace}.set_${snakeCase(name)}`, ref, value)
      }
    }))
  }

  async setPoolProperties ({
    name_label,
    name_description
  }) {
    await this._setObjectProperties(this.pool, {
      name_label,
      name_description
    })
  }

  async setSrProperties (id, {
    name_label,
    name_description
  }) {
    await this._setObjectProperties(this.getObject(id), {
      name_label,
      name_description
    })
  }

  // =================================================================

  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates () {
    const [body, {statusCode}] = await gotPromise(
      'http://updates.xensource.com/XenServer/updates.xml'
    )

    if (statusCode !== 200) {
      throw new JsonRpcError('cannot fetch patches list from Citrix')
    }

    const {patchdata: data} = parseXml(body)

    const patches = Object.create(null)
    forEach(data.patches.patch, patch => {
      patches[patch.uuid] = {
        date: patch.timestamp,
        description: patch['name-description'],
        documentationUrl: patch.url,
        guidance: patch['after-apply-guidance'],
        name: patch['name-label'],
        url: patch['patch-url'],
        uuid: patch.uuid,
        conflicts: map(ensureArray(patch.conflictingpatches), patch => {
          return patch.conflictingpatch.uuid
        }),
        requirements: map(ensureArray(patch.requiredpatches), patch => {
          return patch.requiredpatch.uuid
        })

        // TODO: what does it mean, should we handle it?
        // version: patch.version,
      }
    })

    const resolveVersionPatches = function (uuids) {
      const versionPatches = Object.create(null)

      forEach(uuids, ({uuid}) => {
        versionPatches[uuid] = patches[uuid]
      })

      return versionPatches
    }

    const versions = Object.create(null)
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

  async listMissingPoolPatchesOnHost (hostId) {
    const host = this.getObject(hostId)
    const {product_version: version} = host.software_version

    const all = (await this._getXenUpdates()).versions[version].patches

    const installed = Object.create(null)
    forEach(host.$patches, hostPatch => {
      installed[hostPatch.$pool_patch.uuid] = true
    })

    const installable = []
    forEach(all, (patch, uuid) => {
      if (installed[uuid]) {
        return
      }

      for (let uuid of patch.conflicts) {
        if (uuid in installed) {
          return
        }
      }

      installable.push(patch)
    })

    return installable
  }

  // -----------------------------------------------------------------

  async uploadPoolPatch (stream, length) {
    const taskRef = await this._createTask('Patch upload')

    const [, patchRef] = await Promise.all([
      gotPromise('http://' + this.pool.$master.address + '/pool_patch_upload', {
        method: 'put',
        body: stream,
        query: {
          session_id: this.sessionId,
          task_id: taskRef
        },
        headers: {
          'content-length': length
        }
      }),
      this._watchTask(taskRef)
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

    const PATCH_RE = /\.xsupdate$/
    const proxy = new PassThrough()
    got(patchInfo.url).on('error', error => {
      // TODO: better error handling
      console.error(error)
    }).pipe(unzip.Parse()).on('entry', entry => {
      if (PATCH_RE.test(entry.path)) {
        proxy.emit('length', entry.size)
        entry.pipe(proxy)
      } else {
        entry.autodrain()
      }
    }).on('error', error => {
      // TODO: better error handling
      console.error(error)
    })

    const length = await eventToPromise(proxy, 'length')
    return this.uploadPoolPatch(proxy, length)
  }

  async installPoolPatchOnHost (patchUuid, hostId) {
    const patch = await this._getOrUploadPoolPatch(patchUuid)
    const host = this.getObject(hostId)

    debug('installing patch %s', patchUuid)

    await this.call('pool_patch.apply', patch.$ref, host.$ref)
  }

  async installPoolPatchOnAllHosts (patchUuid) {
    const patch = await this._getOrUploadPoolPatch(patchUuid)

    await this.call('pool_patch.pool_apply', patch.$ref)
  }

  // =================================================================

  async _cloneVm (vm, nameLabel = vm.name_label) {
    return await this.call('VM.clone', vm.$ref, nameLabel)

  }

  async _snapshotVm (vm, nameLabel = vm.name_label) {
    const ref = await this.call('VM.snapshot', vm.$ref, nameLabel)

    // Convert the template to a VM.
    await this.call('VM.set_is_a_template', ref, false)

    return ref
  }

  async cloneVm (vmId, nameLabel = undefined) {
    return this._getOrWaitObject(
      await this._cloneVm(this.getObject(vmId), nameLabel)
    )
  }

  async copyVm (vmId, srId = null, nameLabel = undefined) {
    const vm = this.getObject(vmId)
    const srRef = (srId == null) ?
      '' :
      this.getObject(srId).$ref

    return await this._getOrWaitObject(
      await this.call('VM.copy', vm.$ref, nameLabel || vm.nameLabel, srRef)
    )
  }

  // TODO: clean up on error.
  async createVm (templateId, {
    nameDescription = undefined,
    nameLabel = undefined,
    cpus = undefined,
    installRepository = undefined,
    vdis = [],
    vifs = []
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
    await this.call('VM.remove_from_other_config', vm.$ref, 'disks').catch(noop)

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.call('VM.provision', vm.$ref)

    // Set VMs params.
    this._setObjectProperties(vm, {
      nameDescription,
      VCPUs_at_startup: cpus
    })

    // Sets boot parameters.
    {
      const isHvm = isVmHvm(vm)

      if (isHvm) {
        if (!vdis.length || installMethod === 'network') {
          // TODO: set boot order
        }
      } else { // PV
        if (vm.PV_bootloader === 'eliloader') {
          // Removes any preexisting entry.
          await this.call('VM.remove_from_other_config', vm.$ref, 'install-repository').catch(noop)

          if (installMethod === 'network') {
            // TODO: normalize RHEL URL?

            await this.call('VM.add_to_other_config', vm.$ref, 'install-repository', installRepository)
          } else if (installMethod === 'cd') {
            await this.call('VM.add_to_other_config', vm.$ref, 'install-repository', 'cdrom')
          }
        }

        // TODO: set PV args.
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

    // Creates the VDIs.
    //
    // TODO: set vm.suspend_SR
    await Promise.all(map(vdis, (vdiDescription, i) => {
      return this._createVdi(
        vdiDescription.size,
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
    await Promise.all(map(vm.$vifs, vif => this._deleteVif(vif)))

    // Creates the VIFs specified by the user.
    {
      let position = 0
      await Promise.all(map(vifs, vif => this._createVif(
        vm,
        this.getObject(vif.network),
        {
          position: position++,
          mac: vif.mac,
          mtu: vif.mtu
        }
      )))
    }

    // TODO: Create Cloud config drives.

    // TODO: Assign VGPUs.

    return vm
  }

  async deleteVm (vmId, deleteDisks = false) {
    const vm = this.getObject(vmId)

    if (isVmRunning(vm)) {
      throw new Error('running VMs cannot be deleted')
    }

    if (deleteDisks) {
      await Promise.all(map(vm.$VBDs, vbd => {
        // DO not remove CDs and Floppies.
        if (vbd.type === 'Disk') {
          return this._deleteVdi(vbd.$VDI).catch(noop)
        }
      }))
    }

    await Promise.all(map(vm.$snapshots, snapshot => {
      return this.deleteVm(snapshot.$id, true).catch(noop)
    }))

    await this.call('VM.destroy', vm.$ref)
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
  async exportVm (vmId, {compress = true} = {}) {
    const vm = this.getObject(vmId)

    let host
    let snapshotRef
    if (isVmRunning(vm)) {
      host = vm.$resident_on
      snapshotRef = await this._snapshotVm(vm)
    } else {
      host = this.pool.$master
    }

    const taskRef = await this._createTask('VM Export', vm.name_label)
    if (snapshotRef) {
      pFinally(this._watchTask(taskRef), () => {
        this.deleteVm(snapshotRef, true)
      })
    }

    const stream = got({
      hostname: host.address,
      pathname: '/export/'
    }, {
      query: {
        ref: snapshotRef || vm.$ref,
        session_id: this.sessionId,
        task_id: taskRef,
        use_compression: compress ? 'true' : 'false'
      }
    })
    stream.response = eventToPromise(stream, 'response')

    return stream
  }

  async snapshotVm (vmId) {
    return await this._getOrWaitObject(
      await this._snapshotVm(
        this.getObject(vmId)
      )
    )
  }

  // =================================================================

  async rollingSnapshotVm (vmId, tag, depth) {
    const vm = this.getObject(vmId)
    const reg = new RegExp('^rollingSnapshot_[^_]+_' + escapeStringRegexp(tag))
    const snapshots = sortBy(filter(vm.$snapshots, snapshot => reg.test(snapshot.name_label)), 'name_label')
    const date = new Date().toISOString()

    const ref = await this._snapshotVm(vm, `rollingSnapshot_${date}_${tag}_${vm.name_label}`)

    const promises = []
    for (let surplus = snapshots.length - (depth - 1); surplus > 0; surplus--) {
      const oldSnap = snapshots.shift()
      promises.push(this.deleteVm(oldSnap.uuid, true))
    }
    await Promise.all(promises)

    return await this._getOrWaitObject(ref)
  }

  async _createVbd (vm, vdi, {
    bootable = false,
    position = undefined,
    type = 'Disk',
    readOnly = (type !== 'Disk')
  }) {
    if (position == null) {
      const allowed = await this.call('VM.get_allowed_VBD_devices', vm.$ref)
      const {length} = allowed
      if (!length) {
        throw new Error('no allowed VBD positions (devices)')
      }

      if (type === 'CD') {
        // Choose position 3 if allowed.
        position = includes(allowed, '3') ?
          '3' :
          allowed[0]
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
      bootable,
      empty: false,
      mode: readOnly ? 'RO' : 'RW',
      other_config: {},
      qos_algorithm_params: {},
      qos_algorithm_type: '',
      type,
      userdevice: String(position),
      VDI: vdi.$ref,
      VM: vm.$ref
    })

    if (isVmRunning(vm)) {
      await this.call('VBD.plug', vbdRef)
    }

    return vbdRef
  }

  async _createVdi (size, {
    name_label = '',
    name_description = undefined,
    sr = this.pool.default_SR
  } = {}) {
    return await this.call('VDI.create', {
      name_label: name_label,
      name_description: name_description,
      other_config: {},
      read_only: false,
      sharable: false,
      SR: this.getObject(sr).$ref,
      type: 'user',
      virtual_size: String(size)
    })
  }

  // TODO: check whether the VDI is attached.
  async _deleteVdi (vdi) {
    await this.call('VDI.destroy', vdi.$ref)
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

        await this.call('VBD.eject', cdDrive.$ref).catch(noop)

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

  async createVdi (size, opts) {
    return await this._getOrWaitObject(
      await this._createVdi(size, opts)
    )
  }

  async deleteVdi (vdiId) {
    await this._deleteVdi(this.getObject(vdiId))
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

  // =================================================================

  async _createVif (vm, network, {
    mac = '',
    mtu = 1500,
    position = undefined
  } = {}) {
    // TODO: use VM.get_allowed_VIF_devices()?
    if (position == null) {
      forEach(vm.$VIFs, vif => {
        const curPos = +vif.device
        if (!(position > curPos)) {
          position = curPos
        }
      })

      position = position == null ? 0 : position + 1
    }

    const vifRef = await this.call('VIF.create', {
      device: String(position),
      MAC: String(mac),
      MTU: String(mtu),
      network: network.$ref,
      other_config: {},
      qos_algorithm_params: {},
      qos_algorithm_type: '',
      VM: vm.$ref
    })

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
    return await this._getOrWaitObject(
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

  // =================================================================

  async _doDockerAction (vmId, action, containerId) {
    const vm = this.getObject(vmId)
    const host = vm.$resident_on

    return await this.call('host.call_plugin', host.$ref, 'xscontainer', action, {
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

  // =================================================================

}
