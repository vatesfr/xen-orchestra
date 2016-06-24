import {
  mapToArray
} from '../../utils'

export default {
  _connectAllSrPbds (sr) {
    return Promise.all(
      mapToArray(sr.$PBDs, pbd => this._plugPbd(pbd))
    )
  },

  async connectAllSrPbds (id) {
    await this._connectAllSrPbds(this.getObject(id))
  },

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

  _plugPbd (pbd) {
    return this.call('PBD.plug', pbd.$ref)
  },

  async plugPbd (id) {
    await this._plugPbd(this.getObject(id))
  },

  _unplugPbd (pbd) {
    return this.call('PBD.unplug', pbd.$ref)
  },

  async unplugPbd (id) {
    await this._unplugPbd(this.getObject(id))
  }
}
