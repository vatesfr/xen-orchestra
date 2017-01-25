import filter from 'lodash/filter'
import includes from 'lodash/includes'
import some from 'lodash/some'
import sortBy from 'lodash/sortBy'
import unzip from 'julien-f-unzip'

import httpProxy from '../../http-proxy'
import httpRequest from '../../http-request'
import { debounce } from '../../decorators'
import {
  createRawObject,
  ensureArray,
  forEach,
  mapFilter,
  mapToArray,
  parseXml
} from '../../utils'

import {
  debug,
  put
} from '../utils'

export default {
  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates () {
    const { readAll, statusCode } = await httpRequest(
      'http://updates.xensource.com/XenServer/updates.xml',
      { agent: httpProxy }
    )

    if (statusCode !== 200) {
      throw new Error('cannot fetch patches list from Citrix')
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

      forEach(ensureArray(uuids), ({uuid}) => {
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
  },

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
  },

  _getInstalledPoolPatchesOnHost (host) {
    const installed = createRawObject()

    forEach(host.$patches, hostPatch => {
      installed[hostPatch.$pool_patch.uuid] = true
    })

    return installed
  },

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
  },

  async listMissingPoolPatchesOnHost (hostId) {
    // Returns an array to not break compatibility.
    return mapToArray(
      await this._listMissingPoolPatchesOnHost(this.getObject(hostId))
    )
  },

  async _ejectToolsIsos (hostRef) {
    return Promise.all(mapFilter(
      this.objects.all,
      vm => {
        if (vm.$type !== 'vm' || (hostRef && vm.resident_on !== hostRef)) {
          return
        }

        const shouldEjectCd = some(vm.$VBDs, vbd => {
          const vdi = vbd.$VDI

          return vdi && vdi.is_tools_iso
        })

        if (shouldEjectCd) {
          return this.ejectCdFromVm(vm.$id)
        }
      }
    ))
  },

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
  },

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
  },

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
  },

  // -----------------------------------------------------------------

  async _installPoolPatchOnHost (patchUuid, host) {
    debug('installing patch %s', patchUuid)

    const [ patch ] = await Promise.all([ this._getOrUploadPoolPatch(patchUuid), this._ejectToolsIsos(host.$ref) ])

    await this.call('pool_patch.apply', patch.$ref, host.$ref)
  },

  async installPoolPatchOnHost (patchUuid, hostId) {
    return /* await */ this._installPoolPatchOnHost(
      patchUuid,
      this.getObject(hostId)
    )
  },

  // -----------------------------------------------------------------

  async installPoolPatchOnAllHosts (patchUuid) {
    const [ patch ] = await Promise.all([ this._getOrUploadPoolPatch(patchUuid), this._ejectToolsIsos() ])

    await this.call('pool_patch.pool_apply', patch.$ref)
  },

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
  },

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
        await this._installPoolPatchOnHostAndRequirements(patch, host, installableByUuid).catch(error => {
          if (error.code !== 'PATCH_ALREADY_APPLIED') {
            throw error
          }
        })
        host = this.getObject(host.$id)
      }
    }
  },

  async installAllPoolPatchesOnAllHosts () {
    await this.installAllPoolPatchesOnHost(this.pool.master)
    await Promise.all(mapToArray(
      filter(this.objects.all, { $type: 'host' }),
      host => this.installAllPoolPatchesOnHost(host.$id)
    ))
  }
}
