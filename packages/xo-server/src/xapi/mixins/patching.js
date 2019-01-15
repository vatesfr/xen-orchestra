import asyncMap from '@xen-orchestra/async-map'
import createLogger from '@xen-orchestra/log'
import deferrable from 'golike-defer'
import hrp from 'http-request-plus'
import ProxyAgent from 'proxy-agent'
import unzip from 'julien-f-unzip'
import {
  every,
  filter,
  find,
  includes,
  isObject,
  pickBy,
  some,
  sortBy,
  assign,
} from 'lodash'

import { debounce } from '../../decorators'
import {
  ensureArray,
  forEach,
  mapFilter,
  mapToArray,
  parseXml,
} from '../../utils'

import { extractOpaqueRef, useUpdateSystem } from '../utils'

const log = createLogger('xo:xapi')

const proxy = (() => {
  const httpProxy = process.env.http_proxy || process.env.HTTP_PROXY
  return httpProxy && new ProxyAgent(httpProxy)
})()

const _getXenUpdates = debounce(24 * 60 * 60 * 1000)(async () => {
  const response = await hrp(
    {
      agent: proxy,
    },
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
})

const isXcp = host => host.software_version.product_brand === 'XCP-ng'

export default {
  // LIST ----------------------------------------------------------------------

  // list all yum updates available for a XCP-ng host
  async _getXcpUpdates(host) {
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

  // list all patches provided by Citrix for this host regardless of if they're
  // installed or not
  async _listPatches(host) {
    const versions = (await _getXenUpdates()).versions

    const hostVersions = host.software_version
    const version =
      versions[hostVersions.product_version] ||
      versions[hostVersions.product_version_text]

    return version ? version.patches : []
  },

  // list patches installed on the host
  _listInstalledPatches(host) {
    const installed = { __proto__: null }

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

  // list patches that are provided by Citrix but not installed on the host
  async _listMissingPatches(host) {
    const all = await this._getPoolPatchesForHost(host)
    const installed = this._getInstalledPoolPatchesOnHost(host)

    const installable = { __proto__: null }
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

  listMissingPatches(host) {},

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

  // high level
  // install specified patches on specified hosts
  //
  // no patches specified: install all the missing patches for each host
  // no hosts specified: install patches on all hosts
  //
  // patches will be ignored for XCP (always updates completely)
  // patches that are already installed will be ignored (XS only)
  async installPatches({ patches, hosts }) {
    // XCP
    if (this.pool.$master.software_version.product_brand === 'XCP-ng') {
      return this._xcpUpdate(hosts)
    }

    // XS
    const poolWide = hosts === undefined
  },
}
