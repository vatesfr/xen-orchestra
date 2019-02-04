import asyncMap from '@xen-orchestra/async-map'
import createLogger from '@xen-orchestra/log'
import deferrable from 'golike-defer'
import unzip from 'julien-f-unzip'
import { filter, find, isEmpty, pick, pickBy, some, toArray } from 'lodash'

import { debounce } from '../../decorators'
import {
  ensureArray,
  forEach,
  mapFilter,
  mapToArray,
  parseXml,
} from '../../utils'

import { extractOpaqueRef, useUpdateSystem } from '../utils'

// TOC -------------------------------------------------------------------------

// # HELPERS
//    _getXenUpdates
//    _sortPatches
//    _isXcp
//    _ejectToolsIsos
// # LIST
//    _listXcpUpdates          XCP available updates
//    _listPatches             XS patches (installed or not)
//    _listInstalledPatches    XS installed patches on the host
//    _listInstallablePatches  XS (host, requested patches) → sorted patches that are not installed and not conflicting
//    listMissingPatches       HL: installable patches (XS) or updates (XCP)
// # INSTALL
//    _xcpUpdate               XCP yum update
//    _legacyUploadPatch       XS legacy upload
//    _uploadPatch             XS upload on a dedicated VDI
//    installPatches           HL: install patches (XS) or yum update (XCP) on hosts

// HELPERS ---------------------------------------------------------------------

const log = createLogger('xo:xapi')

// sort patches so they can be installed in the correct order according to their
// requirements
// installablePatches is a { uuid: patch } map that can be used to pull required
// patches out of
// if a required patch is not found in installablePatches, an error is thrown
const _sortPatches = (patches, installablePatches) => {
  if (isEmpty(patches)) {
    return []
  }

  const sortedPatches = []
  forEach(patches, patch => {
    const requiredPatches = toArray(
      pick(installablePatches, patch.requirements)
    )
    if (requiredPatches.length !== patch.requirements.length) {
      throw new Error('some required patches cannot be installed')
    }
    forEach(_sortPatches(requiredPatches, installablePatches), patch => {
      if (!find(sortedPatches({ uuid: patch.uuid }))) {
        sortedPatches.push(patch)
      }
    })
    sortedPatches.push(patch)
  })

  return sortedPatches
}

const _isXcp = host => host.software_version.product_brand === 'XCP-ng'

// =============================================================================

export default {
  // raw { uuid: patch } map translated from updates.xensource.com/XenServer/updates.xml
  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates() {
    const response = await this.xo.httpRequest(
      'http://updates.xensource.com/XenServer/updates.xml'
    )

    if (response.statusCode !== 200) {
      throw new Error('cannot fetch patches list from Citrix')
    }

    const data = parseXml(await response.readAll()).patchdata

    const patches = { __proto__: null }
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
        }),
        paid: patch['update-stream'] === 'premium',
        upgrade: /^XS\d{2,}$/.test(patch['name-label']),
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

    const resolveVersionPatches = function(uuids) {
      const versionPatches = { __proto__: null }

      forEach(ensureArray(uuids), ({ uuid }) => {
        versionPatches[uuid] = patches[uuid]
      })

      return versionPatches
    }

    const versions = { __proto__: null }
    let latestVersion
    forEach(data.serverversions.version, version => {
      versions[version.value] = {
        date: version.timestamp,
        name: version.name,
        id: version.value,
        documentationUrl: version.url,
        patches: resolveVersionPatches(version.patch),
      }

      if (version.latest) {
        latestVersion = versions[version.value]
      }
    })

    return {
      patches,
      latestVersion,
      versions,
    }
  },

  // eject all ISOs from all the host's VM when installing patches
  // if hostRef is not specified: eject ISOs on all the pool's VMs
  async _ejectToolsIsos(hostRef) {
    return Promise.all(
      mapFilter(this.objects.all, vm => {
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
      })
    )
  },

  // LIST ----------------------------------------------------------------------

  // list all yum updates available for a XCP-ng host
  async _listXcpUpdates(host) {
    return JSON.parse(
      await this.call(
        'host.call_plugin',
        host.$ref,
        'updater.py',
        'check_update',
        {}
      )
    )
  },

  // list all patches provided by Citrix for this host version regardless
  // of if they're installed or not
  // ignore upgrade patches
  async _listPatches(host) {
    const versions = (await this._getXenUpdates()).versions

    const hostVersions = host.software_version
    const version =
      versions[hostVersions.product_version] ||
      versions[hostVersions.product_version_text]

    return version ? pickBy(version.patches, patch => !patch.upgrade) : []
  },

  // list patches installed on the host
  _listInstalledPatches(host) {
    const installed = { __proto__: null }

    // Legacy XS patches
    if (!useUpdateSystem(host)) {
      forEach(host.$patches, hostPatch => {
        installed[hostPatch.$pool_patch.uuid] = true
      })
      return installed
    }
    // ----------

    forEach(host.$updates, update => {
      installed[update.uuid] = true // TODO: ignore packs
    })
    return installed
  },

  // list patches:
  //   - not installed on the host
  //   - not conflicting with any of the installed patches
  // TODO: handle upgrade patches
  async _listInstallablePatches(host) {
    const all = await this._listPatches(host)
    const installed = this._listInstalledPatches(host)

    const installable = { __proto__: null }
    forEach(all, (patch, uuid) => {
      if (installed[uuid]) {
        return
      }

      if (host.license_params.sku_type === 'free' && patch.paid) {
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

  // high level
  listMissingPatches(hostId) {
    const host = this.getObject(hostId)
    return _isXcp(host)
      ? this._listXcpUpdates(host)
      : this._listInstallablePatches(host)
  },

  // INSTALL -------------------------------------------------------------------

  _xcpUpdate(hosts) {
    if (hosts === undefined) {
      hosts = filter(this.objects.all, { $type: 'host' })
    }

    return asyncMap(hosts, async host => {
      const update = await this.call(
        'host.call_plugin',
        host.$ref,
        'updater.py',
        'update',
        {}
      )

      if (JSON.parse(update).exit !== 0) {
        throw new Error('Update install failed')
      } else {
        await this._updateObjectMapProperty(host, 'other_config', {
          rpm_patch_installation_time: String(Date.now() / 1000),
        })
      }
    })
  },

  // Legacy XS patches: upload a patch on a pool before installing it
  async _legacyUploadPatch(uuid) {
    // check if the patch has already been uploaded
    try {
      return this.getObjectByUuid(uuid)
    } catch (e) {}

    log.debug(`legacy downloading patch ${uuid}`)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + uuid)
    }

    let stream = await this.xo.httpRequest(patchInfo.url)
    stream = await new Promise((resolve, reject) => {
      const PATCH_RE = /\.xsupdate$/
      stream
        .pipe(unzip.Parse())
        .on('entry', entry => {
          if (PATCH_RE.test(entry.path)) {
            entry.length = entry.size
            resolve(entry)
          } else {
            entry.autodrain()
          }
        })
        .on('error', reject)
    })

    const patchRef = await this.putResource(stream, '/pool_patch_upload', {
      task: this.createTask('Patch upload', patchInfo.name),
    }).then(extractOpaqueRef)

    return this._getOrWaitObject(patchRef)
  },
  // ----------

  // upload patch on a VDI on a shared SR
  async _uploadPatch($defer, uuid) {
    log.debug(`downloading patch ${uuid}`)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + uuid)
    }

    let stream = await this.xo.httpRequest(patchInfo.url)
    stream = await new Promise((resolve, reject) => {
      stream
        .pipe(unzip.Parse())
        .on('entry', entry => {
          entry.length = entry.size
          resolve(entry)
        })
        .on('error', reject)
    })

    const sr = this.findAvailableSharedSr(stream.length)
    if (sr === undefined) {
      return
    }

    const vdi = await this.createTemporaryVdiOnSr(
      stream,
      sr,
      '[XO] Patch ISO',
      'small temporary VDI to store a patch ISO'
    )
    $defer(() => this._deleteVdi(vdi))

    return vdi
  },

  _poolWideInstall: deferrable(async function($defer, patches) {
    // Legacy XS patches
    if (!useUpdateSystem(this.pool.$master)) {
      // for each patch: pool_patch.pool_apply
      for (const p of patches) {
        const [patch] = await Promise.all([
          this._legacyUploadPatch(p.uuid),
          this._ejectToolsIsos(this.pool.$master.$ref),
        ])

        await this.call('pool_patch.pool_apply', patch.$ref)
      }
      return
    }
    // ----------

    // for each patch: pool_update.introduce → pool_update.pool_apply
    for (const p of patches) {
      const [vdi] = await Promise.all([
        this._uploadPatch($defer, p.uuid),
        this._ejectToolsIsos(),
      ])
      if (vdi === undefined) {
        throw new Error('patch could not be uploaded')
      }

      log.debug(`installing patch ${p.uuid}`)
      return this.call(
        'pool_update.pool_apply',
        await this.call('pool_update.introduce', vdi.$ref)
      )
    }
  }),

  async _hostInstall(patches, host) {
    throw new Error('single host install not implemented')
    // Legacy XS patches
    // for each patch: pool_patch.apply
    // ----------
    // for each patch: pool_update.introduce → pool_update.apply
  },

  // high level
  // install specified patches on specified hosts
  //
  // no hosts specified: pool-wide install (only the pool master installed patches will be considered)
  // no patches specified: install either the pool master's missing patches (no hosts specified) or each host's missing patches
  //
  // patches will be ignored for XCP (always updates completely)
  // patches that are already installed will be ignored (XS only)
  //
  // XS pool-wide optimization only works when no hosts are specified
  // it may install more patches that specified if some of them require other patches
  async installPatches({ patches, hosts }) {
    // XCP
    if (_isXcp(this.pool.$master)) {
      return this._xcpUpdate(hosts)
    }

    // XS
    // TODO: assert consistent time
    const poolWide = hosts === undefined
    if (poolWide) {
      // get pool master installable patches
      // filter patches that should be installed (patches ^ installable patches OR installable patches if no patches specified)
      // sort patches by requirements and add required patches if necessary
      // pool-wide install
      const installablePatches = await this._listInstallablePatches(
        this.pool.$master
      )
      log.debug(`patches that were requested to be installed ${patches}`)

      const patchesToInstall =
        patches === undefined
          ? installablePatches
          : pick(installablePatches, patches)
      const sortedPatchesToInstall = _sortPatches(
        toArray(patchesToInstall),
        installablePatches
      )

      log.debug(
        'patches that will actually be installed',
        sortedPatchesToInstall.map(patch => patch.uuid)
      )

      return this._poolWideInstall(sortedPatchesToInstall)
    }

    // for each host
    // get installable patches
    // filter patches that should be installed
    // sort patches
    // host-by-host install
    throw new Error('non pool-wide install not implemented')
  },
}
