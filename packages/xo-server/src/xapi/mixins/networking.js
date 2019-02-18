import { isEmpty } from '../../utils'

import { makeEditObject } from '../utils'

export default {
  async _connectVif(vif) {
    await this.call('VIF.plug', vif.$ref)
  },
  async connectVif(vifId) {
    await this._connectVif(this.getObject(vifId))
  },
  async _deleteVif(vif) {
    await this.call('VIF.destroy', vif.$ref)
  },
  async deleteVif(vifId) {
    const vif = this.getObject(vifId)
    if (vif.currently_attached) {
      await this._disconnectVif(vif)
    }
    await this._deleteVif(vif)
  },
  async _disconnectVif(vif) {
    await this.call('VIF.unplug_force', vif.$ref)
  },
  async disconnectVif(vifId) {
    await this._disconnectVif(this.getObject(vifId))
  },
  async _editNetwork(
    id,
    { automatic, defaultIsLocked, nameDescription, nameLabel, otherConfig }
  ) {
    await this._setObjectProperties(this.getObject(id), {
      defaultIsLocked,
      nameDescription,
      otherConfig: {
        ...otherConfig,
        automatic: automatic.toString(),
      },
    })
  },
  editVif: makeEditObject({
    ipv4Allowed: {
      get: true,
      set: [
        'ipv4Allowed',
        function(value, vif) {
          const lockingMode =
            isEmpty(value) && isEmpty(vif.ipv6_allowed)
              ? 'network_default'
              : 'locked'

          if (lockingMode !== vif.locking_mode) {
            return this._set('locking_mode', lockingMode)
          }
        },
      ],
    },
    ipv6Allowed: {
      get: true,
      set: [
        'ipv6Allowed',
        function(value, vif) {
          const lockingMode =
            isEmpty(value) && isEmpty(vif.ipv4_allowed)
              ? 'network_default'
              : 'locked'

          if (lockingMode !== vif.locking_mode) {
            return this._set('locking_mode', lockingMode)
          }
        },
      ],
    },
  }),
}
