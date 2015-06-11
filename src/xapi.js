import createDebug from 'debug'
import eventToPromise from 'event-to-promise'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import got from 'got'
import map from 'lodash.map'
import unzip from 'julien-f-unzip'
import {PassThrough} from 'stream'
import {promisify} from 'bluebird'
import {
  wrapError as wrapXapiError,
  Xapi as XapiBase
} from 'xen-api'

import {debounce} from './decorators'
import {
  ensureArray,
  formatXml,
  noop, parseXml,
  pFinally
} from './utils'
import {JsonRpcError} from './api-errors'

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
  //
  // Returns the task object from the Xapi.
  async _createTask (name = 'untitled task', description = '') {
    const ref = await this.call('task.create', `[XO] ${name}`, description)
    debug('task created: %s', name)

    pFinally(this._watchTask(ref), () => {
      this.call('task.destroy', ref).then(() => {
        debug('task destroyed: %s', name)
      })
    })

    return this._getOrWaitObject(ref)
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

  async _setObjectProperties (id, props) {
    const {
      $ref: ref,
      $type: type
    } = this.getObject(id)

    const namespace = getNamespaceForType(type)

    // TODO: the thrown error should contain the name of the
    // properties that failed to be set.
    await Promise.all(map(props, (value, name) => {
      if (value != null) {
        return this.call(`${namespace}.set_${name}`, ref, value)
      }
    }))
  }

  async setPoolProperties ({
    name_label,
    name_description
  }) {
    await this._setObjectProperties(this.pool.$id, {
      name_label,
      name_description
    })
  }

  async setSrProperties (id, {
    name_label,
    name_description
  }) {
    await this._setObjectProperties(id, {
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
    const task = await this._createTask('Patch upload')

    const [, patchRef] = await Promise.all([
      gotPromise('http://' + this.pool.$master.address + '/pool_patch_upload', {
        method: 'put',
        body: stream,
        query: {
          session_id: this.sessionId,
          task_id: task.$ref
        },
        headers: {
          'content-length': length
        }
      }),
      this._watchTask(task)
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
  async createVm (templateId, nameLabel, {
    cpus = undefined,
    installRepository = undefined,
    vdis = [],
    vifs = []
  } = {}) {
    const template = this.getObject(templateId)

    // Clones the template.
    const vm = await this._getOrWaitObject(
      await this._cloneVm(template, nameLabel)
    )

    // Creates the VIFs.
    //
    // TODO: removes existing VIFs.
    {
      let position = 0
      await Promise.all(map(vifs, vif => this._createVif(
        vm,
        this.getObject(vif.network),
        { position: position++ }
      )))
    }

    // TODO: ? await this.call('VM.set_PV_args', vm.$ref, 'noninteractive')

    // Sets the number of CPUs.
    if (cpus != null) {
      await this.call('VM.set_VCPUs_at_startup')
    }

    // Removes any preexisting entry.
    await this.call('VM.remove_from_other_config', vm.$ref, 'disks').catch(noop)

    // TODO: remove existing VDIs (to make sure there are only those
    // wanted).
    //
    // Registers the VDIs description for the provisioner.
    if (vdis.length) {
      const {$default_SR: defaultSr} = vm.$pool

      const vdisXml = formatXml({
        provision: {
          disk: map(vdis, (vdi, i) => {
            // Default values:
            // - VDI type: system.
            return {$: {
              bootable: String(Boolean(vdi.bootable)),
              device: String(i),
              size: String(vdi.size),
              sr: this.getObject(vdi.sr || vdi.SR, defaultSr).uuid
            }}
          })
        }
      })

      // TODO: set VDI name_label & name_description.
      await this.call('VM.add_to_other_config', vm.$ref, 'disks', vdisXml)
    }

    // Removes any preexisting entry.
    await this.call('VM.remove_from_other_config', vm.$ref, 'install-repository').catch(noop)

    if (installRepository != null) {
      await this.call('VM.add_to_other_config', vm.$ref, 'install-repository', installRepository)
    }

    // Creates the VDIs and executes the initial steps of the
    // installation.
    await this.call('VM.provision', vm.$ref)

    if (installRepository != null) {
      try {
        const cd = this.getObject(installRepository)

        await this._insertCdIntoVm(cd, vm)
      } catch (_) {}
    }

    return vm
  }

  async deleteVm (vmId, deleteDisks = false) {
    const vm = this.getObject(vmId)

    if (isVmRunning(vm)) {
      throw new Error('running VMs cannot be deleted')
    }

    if (deleteDisks) {
      await Promise.all(map(vm.$VBDs, vbd => {
        try {
          return this._deleteVdi(vbd.$VDI).catch(noop)
        } catch (_) {}
      }))
    }

    await this.call('VM.destroy', vm.$ref)
  }

  getVmConsoleUrl (vmId) {
    const vm = this.getObject(vmId)

    const console = find(vm.$consoles, { protocol: 'rfb' })
    if (!console) {
      throw new Error('no RFB console found')
    }

    return `${console.location}&session_id=${this.sessionId}`
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

    const task = await this._createTask('VM Snapshot', vm.name_label)
    pFinally(this._watchTask(task), () => {
      if (snapshotRef) {
        this.deleteVm(snapshotRef, true)
      }
    })

    const stream = got({
      hostname: host.address,
      path: '/export/'
    }, {
      query: {
        ref: snapshotRef || vm.$ref,
        session_id: this.sessionId,
        task_id: task.$ref,
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

  async _createVbd (vm, vdi, {
    bootable = false,
    position = undefined,
    type = 'Disk',
    readOnly = (type !== 'Disk')
  }) {
    // TODO: use VM.get_allowed_VBD_devices()?
    if (position == null) {
      forEach(vm.$VBDs, vbd => {
        const curPos = +vbd.userdevice
        if (!(position > curPos)) {
          position = curPos
        }
      })

      position = position == null ? 0 : position + 1
    }

    const vbdRef = await this.call('VBD.create', {
      bootable,
      empty: false,
      mode: readOnly ? 'RO' : 'RW',
      other_config: {},
      qos_algorithm_params: {},
      qos_algorithm_type: '',
      type,
      unpluggable: (type !== 'Disk'),
      userdevice: String(position),
      VDI: vdi.$ref,
      VM: vm.$ref
    })

    if (isVmRunning(vm)) {
      await this.call('VBD.plug', vbdRef)
    }

    return vbdRef
  }

  async _deleteVdi (vdiId) {
    const vdi = this.getObject(vdiId)

    await this.call('VDI.destroy', vdi.$ref)
  }

  _getVmCdDrive (vm) {
    for (let vbd of vm.$VBDs) {
      if (vbd.type === 'CD') {
        return vbd
      }
    }
  }

  async _insertCdIntoVm (cd, vm, force) {
    const cdDrive = await this._getVmCdDrive(vm)
    if (cdDrive) {
      try {
        await this.call('VBD.insert', cdDrive.$ref, cd.$ref).catch()
      } catch (error) {
        if (force && error.code === 'VBD_NOT_EMPTY') {
          await this.call('VBD.eject', cdDrive.$ref).catch(noop)

          return this._insertCdIntoVm(cd, vm, force)
        }

        throw error
      }
    } else {
      await this._createVbd(vm, cd, {
        bootable: true,
        type: 'CD'
      })
    }
  }

  async attachVdiToVm (vdiId, vmId, opts = undefined) {
    await this._createVbd(
      this.getObject(vdiId),
      this.getObject(vmId),
      opts
    )
  }

  async insertCdIntoVm (cdId, vmId, force = undefined) {
    await this._insertCdIntoVm(
      this.getObject(cdId),
      this.getObject(vmId),
      force
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

  async createVirtualInterface (vmId, networkId, opts = undefined) {
    return await this._getOrWaitObject(
      await this._createVif(
        this.getObject(vmId),
        this.getObject(networkId),
        opts
      )
    )
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
