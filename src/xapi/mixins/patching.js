import deferrable from 'golike-defer'
import every from 'lodash/every'
import find from 'lodash/find'
import includes from 'lodash/includes'
import isObject from 'lodash/isObject'
import some from 'lodash/some'
import sortBy from 'lodash/sortBy'
import assign from 'lodash/assign'
import unzip from 'julien-f-unzip'

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
  extractOpaqueRef,
  useUpdateSystem
} from '../utils'

export default {
  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates () {
    const { readAll, statusCode } = await this.xo.httpRequest(
      'http://updates.xensource.com/XenServer/updates.xml'
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

    // platform_version < 2.1.1
    forEach(host.$patches, hostPatch => {
      installed[hostPatch.$pool_patch.uuid] = true
    })

    // platform_version >= 2.1.1
    forEach(host.$updates, update => {
      installed[update.uuid] = true // TODO: ignore packs
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

  _isPoolPatchInstallableOnPool (patchUuid) {
    return every(
      this.objects.all,
      obj => obj.$type !== 'host' || this._isPoolPatchInstallableOnHost(patchUuid, obj)
    )
  },

  // -----------------------------------------------------------------

  // platform_version < 2.1.1 ----------------------------------------
  async uploadPoolPatch (stream, patchName) {
    const patchRef = await this.putResource(
      stream,
      '/pool_patch_upload',
      {
        task: this.createTask('Patch upload', patchName)
      }
    ).then(extractOpaqueRef)

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

    let stream = await this.xo.httpRequest(patchInfo.url)
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

  // patform_version >= 2.1.1 ----------------------------------------
  async _getUpdateVdi ($defer, patchUuid, hostId) {
    debug('downloading patch %s', patchUuid)

    const patchInfo = (await this._getXenUpdates()).patches[patchUuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + patchUuid)
    }

    let stream = await this.xo.httpRequest(patchInfo.url)
    stream = await new Promise((resolve, reject) => {
      stream.pipe(unzip.Parse()).on('entry', entry => {
        entry.length = entry.size
        resolve(entry)
      }).on('error', reject)
    })

    let vdi

    // If no hostId provided, try and find a shared SR
    if (!hostId) {
      const sr = this.findAvailableSharedSr(stream.length)

      if (!sr) {
        return
      }

      vdi = await this.createTemporaryVdiOnSr(stream, sr, '[XO] Patch ISO', 'small temporary VDI to store a patch ISO')
    } else {
      vdi = await this.createTemporaryVdiOnHost(stream, hostId, '[XO] Patch ISO', 'small temporary VDI to store a patch ISO')
    }
    $defer(() => this._deleteVdi(vdi))

    return vdi
  },

  // -----------------------------------------------------------------

  // patform_version < 2.1.1 -----------------------------------------
  async _installPoolPatchOnHost (patchUuid, host) {
    const [ patch ] = await Promise.all([ this._getOrUploadPoolPatch(patchUuid), this._ejectToolsIsos(host.$ref) ])

    await this.call('pool_patch.apply', patch.$ref, host.$ref)
  },

  // patform_version >= 2.1.1
  _installPatchUpdateOnHost: deferrable(async function ($defer, patchUuid, host) {
    const [ vdi ] = await Promise.all([
      this._getUpdateVdi($defer, patchUuid, host.$id),
      this._ejectToolsIsos(host.$ref)
    ])

    const updateRef = await this.call('pool_update.introduce', vdi.$ref)
    // TODO: check update status
    // const precheck = await this.call('pool_update.precheck', updateRef, host.$ref)
    // - ok_livepatch_complete     An applicable live patch exists for every required component
    // - ok_livepatch_incomplete   An applicable live patch exists but it is not sufficient
    // - ok                        There is no applicable live patch
    return this.call('pool_update.apply', updateRef, host.$ref)
  }),

  // -----------------------------------------------------------------

  async installPoolPatchOnHost (patchUuid, host) {
    debug('installing patch %s', patchUuid)
    if (!isObject(host)) {
      host = this.getObject(host)
    }

    return useUpdateSystem(host)
      ? this._installPatchUpdateOnHost(patchUuid, host)
      : this._installPoolPatchOnHost(patchUuid, host)
  },

  // -----------------------------------------------------------------

  // platform_version < 2.1.1
  async _installPoolPatchOnAllHosts (patchUuid) {
    const [ patch ] = await Promise.all([
      this._getOrUploadPoolPatch(patchUuid),
      this._ejectToolsIsos()
    ])

    await this.call('pool_patch.pool_apply', patch.$ref)
  },

  // platform_version >= 2.1.1
  _installPatchUpdateOnAllHosts: deferrable(async function ($defer, patchUuid) {
    let [ vdi ] = await Promise.all([
      this._getUpdateVdi($defer, patchUuid),
      this._ejectToolsIsos()
    ])
    if (vdi == null) {
      vdi = await this._getUpdateVdi($defer, patchUuid, this.pool.master)
    }

    return this.call(
      'pool_update.pool_apply',
      await this.call('pool_update.introduce', vdi.$ref)
    )
  }),

  async installPoolPatchOnAllHosts (patchUuid) {
    debug('installing patch %s on all hosts', patchUuid)

    return useUpdateSystem(this.pool.$master)
      ? this._installPatchUpdateOnAllHosts(patchUuid)
      : this._installPoolPatchOnAllHosts(patchUuid)
  },

  // -----------------------------------------------------------------

  // If no host is provided, install on pool
  async _installPoolPatchAndRequirements (patch, patchesByUuid, host) {
    if (host == null
      ? !this._isPoolPatchInstallableOnPool(patch.uuid)
      : !this._isPoolPatchInstallableOnHost(patch.uuid, host)
    ) {
      return
    }

    const { requirements } = patch

    if (requirements.length) {
      for (const requirementUuid of requirements) {
        const requirement = patchesByUuid[requirementUuid]

        if (requirement != null) {
          await this._installPoolPatchAndRequirements(requirement, patchesByUuid, host)
          host = host && this.getObject(host.$id)
        }
      }
    }

    return host == null
      ? this.installPoolPatchOnAllHosts(patch.uuid)
      : this.installPoolPatchOnHost(patch.uuid, host)
  },

  async installSpecificPatchesOnHost (patchNames, hostId) {
    const host = this.getObject(hostId)
    const missingPatches = await this._listMissingPoolPatchesOnHost(host)

    const patchesToInstall = []
    const addPatchesToList = patches => {
      forEach(patches, patch => {
        addPatchesToList(mapToArray(patch.requirements, { uuid: patch.uuid }))

        if (!find(patchesToInstall, { name: patch.name })) {
          patchesToInstall.push(patch)
        }
      })
    }
    addPatchesToList(mapToArray(patchNames, name =>
      find(missingPatches, { name })
    ))

    for (let i = 0, n = patchesToInstall.length; i < n; i++) {
      await this._installPoolPatchAndRequirements(patchesToInstall[i], missingPatches, host)
    }
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
        await this._installPoolPatchAndRequirements(patch, installableByUuid, host).catch(error => {
          if (error.code !== 'PATCH_ALREADY_APPLIED' && error.code !== 'UPDATE_ALREADY_APPLIED') {
            throw error
          }
        })
        host = this.getObject(host.$id)
      }
    }
  },

  async installAllPoolPatchesOnAllHosts () {
    const installableByUuid = assign(
      {},
      ...await Promise.all(mapFilter(this.objects.all, host => {
        if (host.$type === 'host') {
          return this._listMissingPoolPatchesOnHost(host)
        }
      }))
    )

    // List of all installable patches sorted from the newest to the
    // oldest.
    const installable = sortBy(
      installableByUuid,
      patch => -Date.parse(patch.date)
    )

    for (let i = 0, n = installable.length; i < n; ++i) {
      const patch = installable[i]

      await this._installPoolPatchAndRequirements(patch, installableByUuid).catch(error => {
        if (error.code !== 'PATCH_ALREADY_APPLIED' && error.code !== 'UPDATE_ALREADY_APPLIED_IN_POOL') {
          throw error
        }
      })
    }
  }
}
