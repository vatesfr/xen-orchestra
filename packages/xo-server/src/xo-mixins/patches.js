import { differenceBy } from 'lodash'

export default class {
  constructor(xo) {
    this._xo = xo
  }

  getPatchesDifference(hostA, hostB) {
    const patchesA = this._xo.getObject(hostA).patches.map(patchId => this._xo.getObject(patchId))
    const patchesB = this._xo.getObject(hostB).patches.map(patchId => this._xo.getObject(patchId))

    return differenceBy(patchesA, patchesB, 'name').map(patch => patch.name)
  }
}
