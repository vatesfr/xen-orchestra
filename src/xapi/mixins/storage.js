import {
  forEach,
  groupBy
} from 'lodash'

import {
  createRawObject,
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
  },

  _getUnhealthyVdiChainLength (uuid, childrenMap, cache) {
    let length = cache[uuid]
    if (length === undefined) {
      const children = childrenMap[uuid]
      length = children !== undefined && children.length === 1
        ? 1
        : 0
      try {
        const parent = this.getObjectByUuid(uuid).sm_config['vhd-parent']
        if (parent !== undefined) {
          length += this._getUnhealthyVdiChainLength(parent, childrenMap, cache)
        }
      } catch (error) {
        console.warn('Xapi#_getUnhealthyVdiChainLength(%s)', uuid, error)
      }
      cache[uuid] = length
    }
    return length
  },

  getUnhealthyVdiChainsLength (sr) {
    const vdis = this.getObject(sr).$VDIs
    const unhealthyVdis = createRawObject()
    const children = groupBy(vdis, 'sm_config.vhd-parent')
    const cache = createRawObject()
    forEach(vdis, vdi => {
      if (vdi.managed && !vdi.is_a_snapshot) {
        const { uuid } = vdi
        const length = this._getUnhealthyVdiChainLength(uuid, children, cache)
        if (length !== 0) {
          unhealthyVdis[uuid] = length
        }
      }
    })
    return unhealthyVdis
  }
}
