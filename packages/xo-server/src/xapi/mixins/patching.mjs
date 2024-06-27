import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import pickBy from 'lodash/pickBy.js'
import some from 'lodash/some.js'
import unzip from 'unzipper'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import ensureArray from '../../_ensureArray.mjs'
import { debounceWithKey } from '../../_pDebounceWithKey.mjs'
import { forEach, mapFilter, parseXml } from '../../utils.mjs'

import { useUpdateSystem } from '../utils.mjs'

// TOC -------------------------------------------------------------------------

// # HELPERS
//    _isXcp
//    _ejectToolsIsos
//    _getXenUpdates           Map of Objects
// # LIST
//    _listXcpUpdates          XCP available updates - Array of Objects
//    _listPatches             XS patches (installed or not) - Map of Objects
//    _listInstalledPatches    XS installed patches on the host - Map of Booleans
//    _listInstallablePatches  XS (host, requested patches) → sorted patches that are not installed and not conflicting - Array of Objects
//    listMissingPatches       HL: installable patches (XS) or updates (XCP) - Array of Objects
//    findPatches              HL: get XS patches IDs from names
// # INSTALL
//    _xcpUpdate               XCP yum update
//    _legacyUploadPatch       XS legacy upload
//    _uploadPatch             XS upload on a dedicated VDI
//    installPatches           HL: install patches (XS) or yum update (XCP) on hosts

// HELPERS ---------------------------------------------------------------------

const log = createLogger('xo:xapi')

const _isXcp = host => host.software_version.product_brand === 'XCP-ng'

const LISTING_DEBOUNCE_TIME_MS = 60000

async function _listMissingPatches(hostId) {
  const host = this.getObject(hostId)
  return _isXcp(host)
    ? this._listXcpUpdates(host)
    : // TODO: list paid patches of free hosts as well so the UI can show them
      this._listInstallablePatches(host)
}

const listMissingPatches = debounceWithKey(_listMissingPatches, LISTING_DEBOUNCE_TIME_MS, hostId => hostId)

// =============================================================================

const methods = {
  // raw { uuid: patch } map translated from updates.ops.xenserver.com/xenserver/updates.xml
  // FIXME: should be static
  async _getXenUpdates() {
    const response = await this.xo.httpRequest('https://updates.ops.xenserver.com/xenserver/updates.xml')

    const data = parseXml(await response.buffer()).patchdata

    const patches = { __proto__: null }
    forEach(data.patches.patch, patch => {
      patches[patch.uuid] = {
        date: patch.timestamp,
        description: patch['name-description'],
        documentationUrl: patch.url,
        guidance: patch['after-apply-guidance'],
        name: patch['name-label'],
        url: patch['patch-url'],
        id: patch.uuid,
        uuid: patch.uuid,
        conflicts: ensureArray(patch.conflictingpatches).map(patch => patch.conflictingpatch.uuid),
        requirements: ensureArray(patch.requiredpatches).map(patch => patch.requiredpatch.uuid),
        paid: patch['update-stream'] === 'premium',
        upgrade: /^(XS|CH)\d{2,}$/.test(patch['name-label']),
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

  // eject all ISOs from all the host's VMs when installing patches
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
  // (hostObject) → { uuid: patchObject }
  async _listXcpUpdates(host) {
    const result = JSON.parse(await this.call('host.call_plugin', host.$ref, 'updater.py', 'check_update', {}))

    if (result.error != null) {
      throw new Error(result.error)
    }

    return result
  },

  // list all patches provided by Citrix for this host version regardless
  // of if they're installed or not
  // ignores upgrade patches
  // (hostObject) → { uuid: patchObject }
  async _listPatches(host) {
    const versions = (await this._getXenUpdates()).versions

    const hostVersions = host.software_version
    const version = versions[hostVersions.product_version] || versions[hostVersions.product_version_text]

    return version ? pickBy(version.patches, patch => !patch.upgrade) : {}
  },

  // list patches installed on the host
  // (hostObject) → { uuid: boolean }
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
      // ignore packs
      if (update.name_label.startsWith('XS')) {
        installed[update.uuid] = true
      }
    })

    return installed
  },

  // TODO: handle upgrade patches
  // (hostObject, [ patchId ]) → [ patchObject ]
  async _listInstallablePatches(host, requestedPatches) {
    const all = await this._listPatches(host)
    const installed = this._listInstalledPatches(host)

    let getAll = false
    if (requestedPatches === undefined) {
      getAll = true
      requestedPatches = Object.keys(all)
    }
    const freeHost = this.pool.$master.license_params.sku_type === 'free'
    // We assume:
    // - no conflict transitivity (If A conflicts with B and B with C, Citrix should tell us explicitly that A conflicts with C)
    // - no requirements transitivity (If A requires B and B requires C, Citrix should tell us explicitly that A requires C)
    // - sorted requirements (If A requires B and C, then C cannot require B)
    // For each requested patch:
    // - throw if not found
    // - throw if already installed
    // - ignore if already in installable (may have been added because of requirements)
    // - if paid patch on free host: either ignore (listing all the patches) or throw (patch is requested)
    // - throw if conflicting patches installed
    // - throw if conflicting patches in installable
    // - throw if one of the requirements is not found
    // - push its required patches in installable
    // - push it in installable
    const installable = []
    forEach(requestedPatches, id => {
      const patch = all[id]
      if (patch === undefined) {
        throw new Error(`patch not found: ${id}`)
      }

      if (installed[id] !== undefined) {
        if (getAll) {
          return
        }
        throw new Error(`patch already installed: ${patch.name} (${id})`)
      }

      if (find(installable, { id }) !== undefined) {
        return
      }

      if (patch.paid && freeHost) {
        if (getAll) {
          return
        }
        throw new Error(`requested patch ${patch.name} (${id}) requires a XenServer license`)
      }

      let conflictId
      if ((conflictId = find(patch.conflicts, conflictId => installed[conflictId] !== undefined)) !== undefined) {
        if (getAll) {
          log.debug(`patch ${patch.name} (${id}) conflicts with installed patch ${conflictId}`)
          return
        }
        throw new Error(`patch ${patch.name} (${id}) conflicts with installed patch ${conflictId}`)
      }

      if ((conflictId = find(patch.conflicts, conflictId => find(installable, { id: conflictId }))) !== undefined) {
        if (getAll) {
          log.debug(`patches ${id} and ${conflictId} conflict with eachother`)
          return
        }
        throw new Error(`patches ${id} and ${conflictId} conflict with eachother`)
      }

      // add requirements
      forEach(patch.requirements, id => {
        const requiredPatch = all[id]
        if (requiredPatch === undefined) {
          throw new Error(`required patch ${id} not found`)
        }
        if (!installed[id] && find(installable, { id }) === undefined) {
          if (requiredPatch.paid && freeHost) {
            throw new Error(`required patch ${requiredPatch.name} (${id}) requires a XenServer license`)
          }
          installable.push(requiredPatch)
        }
      })

      // add itself
      installable.push(patch)
    })

    return installable
  },

  // high level
  listMissingPatches,

  // convenient method to find which patches should be installed from a
  // list of patch names
  // e.g.: compare the installed patches of 2 hosts by their
  // names (XS..E...) then find the patches global ID
  // [ names ] → [ IDs ]
  async findPatches(names) {
    const all = await this._listPatches(this.pool.$master)
    return filter(all, patch => names.includes(patch.name)).map(patch => patch.id)
  },

  // INSTALL -------------------------------------------------------------------

  async _xcpUpdate(hosts) {
    if (hosts === undefined) {
      hosts = Object.values(this.objects.indexes.type.host)
    }

    // XCP-ng hosts need to be updated one at a time starting with the pool master
    // https://github.com/vatesfr/xen-orchestra/issues/4468
    hosts = hosts.sort(({ $ref }) => ($ref === this.pool.master ? -1 : 1))
    for (const host of hosts) {
      // With throw in case of error with XCP-ng>=8.2.1
      const result = await this.callAsync('host.call_plugin', host.$ref, 'updater.py', 'update', {})

      // Defined and different than 0 in case of error with XCP-ng<8.2.1
      const { exit } = result
      if (exit !== undefined && exit !== 0) {
        throw new Error(result.stderr)
      }

      log.debug(result.stdout)
      await host.update_other_config('rpm_patch_installation_time', String(Date.now() / 1000))
    }
  },

  // Legacy XS patches: upload a patch on a pool before installing it
  async _legacyUploadPatch(uuid, xsCredentials) {
    // check if the patch has already been uploaded
    try {
      return this.getObjectByUuid(uuid)
    } catch (e) {}

    log.debug(`legacy downloading patch ${uuid}`)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + uuid)
    }

    const { username, apikey } = xsCredentials
    let stream = await this.xo.httpRequest(patchInfo.url, { auth: `${username}:${apikey}` })
    stream = await new Promise((resolve, reject) => {
      const PATCH_RE = /\.xsupdate$/
      stream
        .pipe(unzip.Parse())
        .on('entry', entry => {
          if (PATCH_RE.test(entry.path)) {
            entry.length = entry.vars.uncompressedSize
            resolve(entry)
          } else {
            entry.autodrain()
          }
        })
        .on('error', reject)
    })

    const patchRef = await this.putResource(stream, '/pool_patch_upload', {
      task: this.task_create('Patch upload', patchInfo.name),
    })

    return this._getOrWaitObject(patchRef)
  },
  // ----------

  // upload patch on a VDI on a shared SR
  async _uploadPatch($defer, uuid, xsCredentials) {
    log.debug(`downloading patch ${uuid}`)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]
    if (!patchInfo) {
      throw new Error('no such patch ' + uuid)
    }

    const { username, apikey } = xsCredentials
    let stream = await this.xo.httpRequest(patchInfo.url, { auth: `${username}:${apikey}` })
    stream = await new Promise((resolve, reject) => {
      stream
        .pipe(unzip.Parse())
        .on('entry', entry => {
          entry.length = entry.vars.uncompressedSize
          resolve(entry)
        })
        .on('error', reject)
    })

    const sr = this.findAvailableSr(stream.length)
    if (sr === undefined) {
      return
    }

    const vdi = await this.createTemporaryVdiOnSr(
      stream,
      sr,
      '[XO] Patch ISO',
      'small temporary VDI to store a patch ISO'
    )
    $defer(() => vdi.$destroy())

    return vdi
  },

  async _poolWideInstall($defer, patches, xsCredentials) {
    // New XS patching system: https://support.citrix.com/article/CTX473972/upcoming-changes-in-xencenter
    if (xsCredentials?.username === undefined || xsCredentials?.apikey === undefined) {
      throw new Error(
        'XenServer credentials not found. See https://xen-orchestra.com/docs/updater.html#xenserver-updates'
      )
    }

    // Legacy XS patches
    if (!useUpdateSystem(this.pool.$master)) {
      // for each patch: pool_patch.pool_apply
      for (const p of patches) {
        const [patch] = await Promise.all([
          this._legacyUploadPatch(p.uuid, xsCredentials),
          this._ejectToolsIsos(this.pool.$master.$ref),
        ])

        await this.call('pool_patch.pool_apply', patch.$ref)
      }
      return
    }
    // ----------

    // for each patch: pool_update.introduce → pool_update.pool_apply
    for (const p of patches) {
      const [vdi] = await Promise.all([this._uploadPatch($defer, p.uuid, xsCredentials), this._ejectToolsIsos()])
      if (vdi === undefined) {
        throw new Error('patch could not be uploaded')
      }

      const updateRef = await this.call('pool_update.introduce', vdi.$ref)

      // Checks for license restrictions (and other conditions?)
      await Promise.all(
        filter(this.objects.all, { $type: 'host' }).map(host => this.call('pool_update.precheck', updateRef, host.$ref))
      )

      log.debug(`installing patch ${p.uuid}`)
      await this.call('pool_update.pool_apply', updateRef)
    }
  },

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
  async installPatches({ patches, hosts, xsCredentials } = {}) {
    // XCP
    if (_isXcp(this.pool.$master)) {
      return this._xcpUpdate(hosts)
    }

    // XS
    // TODO: assert consistent time
    const poolWide = hosts === undefined
    if (poolWide) {
      log.debug('patches that were requested to be installed', patches)
      const installablePatches = await this._listInstallablePatches(this.pool.$master, patches)

      log.debug(
        'patches that will actually be installed',
        installablePatches.map(patch => patch.uuid)
      )

      return this._poolWideInstall(installablePatches, xsCredentials)
    }

    // for each host
    // get installable patches
    // filter patches that should be installed
    // sort patches
    // host-by-host install
    throw new Error('non pool-wide install not implemented')
  },

  async rollingPoolUpdate($defer, task, { xsCredentials } = {}) {
    // Temporary workaround until XCP-ng finds a way to update linstor packages
    if (some(this.objects.indexes.type.SR, { type: 'linstor' })) {
      throw new Error('rolling pool update not possible since there is a linstor SR in the pool')
    }

    const isXcp = _isXcp(this.pool.$master)

    const hasMissingPatchesByHost = {}
    const hosts = filter(this.objects.all, { $type: 'host' })
    await Task.run({ properties: { name: `Listing missing patches`, total: hosts.length } }, async () => {
      await asyncEach(hosts, async host => {
        const hostUuid = host.uuid
        await Task.run(
          {
            properties: {
              name: `Listing missing patches for host ${hostUuid}`,
              hostId: hostUuid,
              hostName: host.name_label,
            },
          },
          async () => {
            const missingPatches = await this.listMissingPatches(hostUuid)
            hasMissingPatchesByHost[hostUuid] = missingPatches.length > 0
          }
        )
      })
    })

    return Task.run({ properties: { name: `Updating and rebooting` } }, async () => {
      await this.rollingPoolReboot(task, {
        xsCredentials,
        beforeEvacuateVms: async () => {
          // On XS/CH, start by installing patches on all hosts
          if (!isXcp) {
            return Task.run({ properties: { name: `Installing XS patches` } }, async () => {
              await this.installPatches({ xsCredentials })
            })
          }
        },
        beforeRebootHost: async host => {
          if (isXcp) {
            return Task.run(
              { properties: { name: `Installing patches`, hostId: host.uuid, hostName: host.name_label } },
              async () => {
                await this.installPatches({ hosts: [host] })
              }
            )
          }
        },
        ignoreHost: host => {
          return !hasMissingPatchesByHost[host.uuid]
        },
      })
    })
  },
}

export default decorateObject(methods, {
  _getXenUpdates: [
    debounceWithKey,
    24 * 60 * 60 * 1000,
    function () {
      return this
    },
  ],

  _poolWideInstall: deferrable,

  rollingPoolUpdate: deferrable,
})
