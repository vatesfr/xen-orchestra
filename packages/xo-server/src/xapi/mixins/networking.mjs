import { makeEditObject } from '../utils.mjs'

export default {
  async _connectVif(vif) {
    await this.callAsync('VIF.plug', vif.$ref)
  },
  async connectVif(vifId) {
    await this._connectVif(this.getObject(vifId))
  },
  async _deleteVif(vif) {
    await this.callAsync('VIF.destroy', vif.$ref)
  },
  async deleteVif(vifId) {
    const vif = this.getObject(vifId)
    if (vif.currently_attached) {
      await this._disconnectVif(vif)
    }
    await this._deleteVif(vif)
  },
  async _disconnectVif(vif) {
    await this.callAsync('VIF.unplug_force', vif.$ref)
  },
  async disconnectVif(vifId) {
    await this._disconnectVif(this.getObject(vifId))
  },
  editVif: makeEditObject({
    ipv4Allowed: {
      get: true,
      set: [
        'ipv4Allowed',
        function (value, vif) {
          if (value.length !== 0 && vif.locking_mode !== 'locked') {
            return vif.set_locking_mode('locked')
          }
        },
      ],
    },
    ipv6Allowed: {
      get: true,
      set: [
        'ipv6Allowed',
        function (value, vif) {
          if (value.length !== 0 && vif.locking_mode !== 'locked') {
            return vif.set_locking_mode('locked')
          }
        },
      ],
    },
    lockingMode: {
      set: (value, vif) => vif.set_locking_mode(value),
    },

    // in kB/s
    rateLimit: {
      get: vif => {
        if (vif.qos_algorithm_type === 'ratelimit') {
          const { kbps } = vif.qos_algorithm_params
          if (kbps !== undefined) {
            return +kbps
          }
        }

        // null is value used to remove the existing value
        //
        // we need to match this, to allow avoiding the `set` if the value is
        // already missing.
        return null
      },
      set: (value, vif) =>
        Promise.all([
          vif.set_qos_algorithm_type(value === null ? '' : 'ratelimit'),
          vif.update_qos_algorithm_params('kbps', value === null ? null : String(value)),
        ]),
    },

    txChecksumming: {
      set: (value, vif) => vif.update_other_config('ethtool-tx', value === null ? null : String(value)),
    },
  }),
}
