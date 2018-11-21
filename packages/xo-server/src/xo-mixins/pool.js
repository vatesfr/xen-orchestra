import { difference, flatten, uniq } from 'lodash'

export default class Pools {
  constructor(xo) {
    this._xo = xo
  }

  async mergeInto({ sources: sourceIds, target, force }) {
    const { _xo } = this
    const targetHost = _xo.getObject(target.master)
    const sources = []
    const sourcePatches = {}
    for (const sourceId of sourceIds) {
      const source = _xo.getObject(sourceId)
      const sourceHost = _xo.getObject(source.master)
      if (sourceHost.productBrand !== targetHost.productBrand) {
        throw new Error(
          `a ${sourceHost.productBrand} pool cannot be merged into a ${
            targetHost.productBrand
          } pool`
        )
      }
      sources.push(source)
      sourcePatches[sourceId] = sourceHost.patches
    }

    const targetRequiredPatches = uniq(
      flatten(
        await Promise.all(
          sources.map(({ master }) =>
            _xo.getPatchesDifference(master, target.master)
          )
        )
      )
    )

    const promises = []
    if (targetRequiredPatches.length > 0) {
      const targetXapi = _xo.getXapi(target)
      promises.push(
        targetXapi.installPatches({
          patches: await targetXapi.findPatches(targetRequiredPatches),
        })
      )
    }

    const allRequiredPatches = targetRequiredPatches.concat(
      targetHost.patches.map(patchId => _xo.getObject(patchId).name)
    )

    for (const sourceId of sourceIds) {
      const _sourcePatches = sourcePatches[sourceId].map(
        patchId => _xo.getObject(patchId).name
      )
      const sourceRequiredPatches = difference(
        allRequiredPatches,
        _sourcePatches
      )
      if (sourceRequiredPatches.length > 0) {
        const sourceXapi = _xo.getXapi(sourceId)
        promises.push(
          sourceXapi.installPatches({
            patches: await sourceXapi.findPatches(sourceRequiredPatches),
          })
        )
      }
    }

    await Promise.all(promises)

    for (const source of sources) {
      await _xo.mergeXenPools(source._xapiId, target._xapiId, force)
    }
  }
}
