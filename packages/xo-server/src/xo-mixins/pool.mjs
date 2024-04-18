import difference from 'lodash/difference.js'
import flatten from 'lodash/flatten.js'
import isEmpty from 'lodash/isEmpty.js'
import keyBy from 'lodash/keyBy.js'
import semver from 'semver'
import some from 'lodash/some.js'
import stubTrue from 'lodash/stubTrue.js'
import uniq from 'lodash/uniq.js'
import { asyncEach } from '@vates/async-each'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'

async function processLicenses($defer, app, productId, licenses, hostIds) {
  const now = Date.now()
  const nNewHosts = hostIds.length
  const availableLicenses = licenses.filter(
    ({ boundObjectId, expires }) => boundObjectId === undefined && (expires === undefined || expires > now)
  )
  const nAvailableLicenses = availableLicenses.length
  if (nNewHosts > nAvailableLicenses) {
    throw new Error(
      `Not enough ${productId.toUpperCase()} Licenses. Expected: ${nNewHosts}, actual: ${nAvailableLicenses}`
    )
  }

  await asyncEach(
    hostIds,
    async hostId => {
      const license = availableLicenses.pop()
      await app.bindLicense({
        licenseId: license.id,
        boundObjectId: hostId,
      })
      $defer.onFailure(() => app.unbindLicense({ licenseId: license.id, productId, boundObjectId: hostId }))
    },
    {
      stopOnError: false,
    }
  )
}

export default class Pools {
  constructor(app) {
    this._app = app
  }

  async mergeInto($defer, { sources: sourceIds, target, force }) {
    const { _app } = this
    const targetHost = _app.getObject(target.master)
    const sources = []
    const sourcePatches = {}

    // Check hosts compatibility.
    for (const sourceId of sourceIds) {
      const source = _app.getObject(sourceId)
      const sourceHost = _app.getObject(source.master)
      if (sourceHost.productBrand !== targetHost.productBrand) {
        throw new Error(`a ${sourceHost.productBrand} pool cannot be merged into a ${targetHost.productBrand} pool`)
      }
      if (sourceHost.version !== targetHost.version) {
        throw new Error('The hosts are not compatible')
      }
      sources.push(source)
      sourcePatches[sourceId] = sourceHost.patches
    }

    const hasLinstorSr = some(_app.objects.all, { SR_type: 'linstor', $pool: target.uuid })
    if (hasLinstorSr) {
      const xcpLicenses = await _app.getLicenses({ productType: 'xcpng' })
      const xcpLicenseByHostId = keyBy(xcpLicenses, 'boundObjectId')
      const hostIdsWithoutXcpLicense = sourceIds.filter(hostId => xcpLicenseByHostId[hostId] === undefined)

      if (hostIdsWithoutXcpLicense.length !== 0) {
        await processLicenses($defer, _app, 'xcpng', xcpLicenses, hostIdsWithoutXcpLicense)
      }
      await processLicenses($defer, _app, 'xostor', await _app.getLicenses({ productType: 'xostor' }), sourceIds)
    }

    // Find missing patches on the target.
    const targetRequiredPatches = uniq(
      flatten(await Promise.all(sources.map(({ master }) => _app.getPatchesDifference(master, target.master))))
    )

    // Find missing patches on the sources.
    const allRequiredPatches = targetRequiredPatches.concat(
      targetHost.patches.map(patchId => _app.getObject(patchId).name)
    )
    const sourceRequiredPatches = {}
    for (const sourceId of sourceIds) {
      const _sourcePatches = sourcePatches[sourceId].map(patchId => _app.getObject(patchId).name)
      const requiredPatches = difference(allRequiredPatches, _sourcePatches)
      if (requiredPatches.length > 0) {
        sourceRequiredPatches[sourceId] = requiredPatches
      }
    }

    // On XCP-ng, "installPatches" installs *all* the patches
    // whatever the patches argument is.
    // So we must not call it if there are no patches to install.
    if (targetRequiredPatches.length > 0 || !isEmpty(sourceRequiredPatches)) {
      // Find patches in parallel.
      const findPatchesPromises = []
      const sourceXapis = {}
      const targetXapi = _app.getXapi(target)
      for (const sourceId of sourceIds) {
        const sourceXapi = (sourceXapis[sourceId] = _app.getXapi(sourceId))
        findPatchesPromises.push(sourceXapi.findPatches(sourceRequiredPatches[sourceId] ?? []))
      }
      const patchesName = await Promise.all([targetXapi.findPatches(targetRequiredPatches), ...findPatchesPromises])

      const { xsCredentials } = _app.apiContext.user.preferences

      // Install patches in parallel.
      const installPatchesPromises = []
      installPatchesPromises.push(
        targetXapi.installPatches({
          patches: patchesName[0],
          xsCredentials,
        })
      )
      let i = 1
      for (const sourceId of sourceIds) {
        installPatchesPromises.push(
          sourceXapis[sourceId].installPatches({
            patches: patchesName[i++],
            xsCredentials,
          })
        )
      }

      await Promise.all(installPatchesPromises)
    }

    // Merge the sources into the target sequentially to be safe.
    for (const source of sources) {
      await _app.mergeXenPools(source._xapiId, target._xapiId, force)
    }
  }

  async listPoolsMatchingCriteria({
    minAvailableHostMemory = 0,
    minAvailableSrSize = 0,
    minHostCpus = 0,
    minHostVersion,
    poolNameRegExp,
    srNameRegExp,
  }) {
    const hostsByPool = {}
    const srsByPool = {}
    const pools = []
    for (const obj of this._app.objects.values()) {
      if (obj.type === 'host') {
        if (hostsByPool[obj.$pool] === undefined) {
          hostsByPool[obj.$pool] = []
        }
        hostsByPool[obj.$pool].push(obj)
      } else if (obj.type === 'SR') {
        if (srsByPool[obj.$pool] === undefined) {
          srsByPool[obj.$pool] = []
        }
        srsByPool[obj.$pool].push(obj)
      } else if (obj.type === 'pool') {
        pools.push(obj)
      }
    }

    const checkPoolName =
      poolNameRegExp === undefined ? stubTrue : RegExp.prototype.test.bind(new RegExp(poolNameRegExp))
    const checkSrName = srNameRegExp === undefined ? stubTrue : RegExp.prototype.test.bind(new RegExp(srNameRegExp))

    return pools.filter(
      pool =>
        checkPoolName(pool.name_label) &&
        hostsByPool[pool.id].some(
          host =>
            (minHostVersion === undefined || semver.satisfies(host.version, `>=${minHostVersion}`)) &&
            host.cpus.cores >= minHostCpus &&
            host.memory.size - host.memory.usage >= minAvailableHostMemory
        ) &&
        srsByPool[pool.id].some(sr => sr.size - sr.physical_usage >= minAvailableSrSize && checkSrName(sr.name_label))
    )
  }

  async rollingPoolReboot(pool) {
    const { _app } = this
    await _app.checkFeatureAuthorization('ROLLING_POOL_REBOOT')
    await _app.getXapi(pool).rollingPoolReboot()
  }
}

decorateMethodsWith(Pools, {
  mergeInto: defer,
})
