import differenceBy from 'lodash/differenceBy.js'

export default class {
  constructor(app) {
    this._app = app
  }

  getPatchesDifference(hostA, hostB) {
    const patchesA = this._app.getObject(hostA).patches.map(patchId => this._app.getObject(patchId))
    const patchesB = this._app.getObject(hostB).patches.map(patchId => this._app.getObject(patchId))

    return differenceBy(patchesA, patchesB, 'name').map(patch => patch.name)
  }
}
