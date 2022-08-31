import filter from 'lodash/filter.js'
import forEach from 'lodash/forEach.js'
import groupBy from 'lodash/groupBy.js'
import { decorateWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'

export default {
  _connectAllSrPbds(sr) {
    return Promise.all(sr.$PBDs.map(pbd => this._plugPbd(pbd)))
  },

  async connectAllSrPbds(id) {
    await this._connectAllSrPbds(this.getObject(id))
  },

  _disconnectAllSrPbds(sr) {
    return Promise.all(sr.$PBDs.map(pbd => this._unplugPbd(pbd)))
  },

  async disconnectAllSrPbds(id) {
    await this._disconnectAllSrPbds(this.getObject(id))
  },

  async destroySr(id) {
    const sr = this.getObject(id)
    await this._disconnectAllSrPbds(sr)
    await this.call('SR.destroy', sr.$ref)
  },

  async forgetSr(id) {
    const sr = this.getObject(id)
    await this._disconnectAllSrPbds(sr)
    await this.call('SR.forget', sr.$ref)
  },

  _plugPbd(pbd) {
    return this.callAsync('PBD.plug', pbd.$ref)
  },

  async plugPbd(id) {
    await this._plugPbd(this.getObject(id))
  },

  _unplugPbd(pbd) {
    return this.callAsync('PBD.unplug', pbd.$ref)
  },

  async unplugPbd(id) {
    await this._unplugPbd(this.getObject(id))
  },

  _getVdiChainsInfo(uuid, childrenMap, cache) {
    let length = cache[uuid]?.length
    if (length === undefined) {
      const children = childrenMap[uuid]
      length = children !== undefined && children.length === 1 ? 1 : 0

      const vdi = this.getObjectByUuid(uuid, undefined)
      // invalid uuid
      if (vdi === undefined) {
        cache[children[0].uuid] = {
          ...cache[children[0].uuid],
          unknownVhdParent: uuid,
        }
        return length
      }

      const parent = vdi.sm_config['vhd-parent']
      if (parent !== undefined) {
        length += this._getVdiChainsInfo(parent, childrenMap, cache)
      }

      cache[uuid] = {
        ...cache[uuid],
        length,
      }
    }
    return length
  },

  getVdiChainsInfo(sr) {
    const vdis = this.getObject(sr).$VDIs
    const unhealthyVdis = { __proto__: null }
    const children = groupBy(vdis, 'sm_config.vhd-parent')
    const vdisWithUnknownVhdParent = []

    const cache = { __proto__: null }
    forEach(vdis, vdi => {
      if (vdi.managed && !vdi.is_a_snapshot) {
        const { uuid } = vdi
        const length = this._getVdiChainsInfo(uuid, children, cache)

        if (length !== 0) {
          unhealthyVdis[uuid] = length
        }
        if (cache[uuid].unknownVhdParent !== undefined) {
          vdisWithUnknownVhdParent.push(uuid)
        }
      }
    })

    return {
      vdisWithUnknownVhdParent,
      unhealthyVdis,
    }
  },

  // This function helps to reattach a forgotten NFS/iSCSI/HBA SR
  @decorateWith(defer)
  async reattachSr($defer, { uuid, nameLabel, nameDescription, type, deviceConfig }) {
    const srRef = await this.call('SR.introduce', uuid, nameLabel, nameDescription, type, 'user', true, {})
    $defer.onFailure(() => this.forgetSr(srRef))

    // XenCenter SR reattach:
    // https://github.com/xenserver/xenadmin/blob/90e6cb0dc950ce747b7b6b689b0ad00cf28898d2/XenModel/Actions/SR/SrReattachAction.cs#L77-L99
    const hosts = filter(this.objects.all, object => object.$type === 'host')
    await Promise.all(
      hosts.map(async host => {
        const pbdRef = await this.call('PBD.create', {
          host: host.$ref,
          SR: srRef,
          device_config: deviceConfig,
        })
        await this.call('PBD.plug', pbdRef)
      })
    )

    const sr = await this.call('SR.get_record', srRef)
    return sr.uuid
  },
}
