import { isEmpty } from '../../utils'

import { makeEditObject } from '../utils'

export default {
  editVif: makeEditObject({
    ipv4Allowed: {
      get: true,
      set: [
        'ipv4Allowed',
        function (value, vif) {
          const lockingMode = isEmpty(value) && isEmpty(vif.ipv6_allowed)
            ? 'network_default'
            : 'locked'

          if (lockingMode !== vif.locking_mode) {
            return this._set('locking_mode', lockingMode)
          }
        }
      ]
    },
    ipv6Allowed: {
      get: true,
      set: [
        'ipv6Allowed',
        function (value, vif) {
          const lockingMode = isEmpty(value) && isEmpty(vif.ipv4_allowed)
            ? 'network_default'
            : 'locked'

          if (lockingMode !== vif.locking_mode) {
            return this._set('locking_mode', lockingMode)
          }
        }
      ]
    }
  })
}
