import {
  mapToArray
} from '../utils'

export default {
  _disconnectAllSrPbds (sr) {
    return Promise.all(
      mapToArray(sr.$PBDs, pbd => this._unplugPbd(pbd))
    )
  },

  async disconnectAllSrPbds (id) {
    await this._disconnectAllSrPbds(this.getObject(id))
  },

  async destroySr (id) {
    const sr = this.getObject(id)
    await this._disconnectAllSrPbds(sr)
    await this.call('SR.destroy', sr.$ref)
  },

  async forgetSr (id) {
    const sr = this.getObject(id)
    await this._disconnectAllSrPbds(sr)
    await this.call('SR.forget', sr.$ref)
  },

  _unplugPbd (pbd) {
    return this.call('PBD.unplug', pbd.$ref)
  },

  async unplugPbd (id) {
    await this._unplugPbd(this.getObject(id))
  }
}
