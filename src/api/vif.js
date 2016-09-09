import forEach from 'lodash/forEach'

import {
  diffItems,
  noop,
  pCatch
} from '../utils'

// ===================================================================

// TODO: move into vm and rename to removeInterface
async function delete_ ({vif}) {
  const { id } = vif
  const dealloc = address => {
    this.deallocIpAddress(address, id)::pCatch(noop)
  }
  forEach(vif.allowedIpv4Addresses, dealloc)
  forEach(vif.allowedIpv6Addresses, dealloc)

  await this.getXapi(vif).deleteVif(vif._xapiId)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vif: ['id', 'VIF', 'administrate']
}

// -------------------------------------------------------------------

// TODO: move into vm and rename to disconnectInterface
export async function disconnect ({vif}) {
  // TODO: check if VIF is attached before
  await this.getXapi(vif).call('VIF.unplug_force', vif._xapiRef)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vif: ['id', 'VIF', 'operate']
}

// -------------------------------------------------------------------
// TODO: move into vm and rename to connectInterface
export async function connect ({vif}) {
  // TODO: check if VIF is attached before
  await this.getXapi(vif).call('VIF.plug', vif._xapiRef)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vif: ['id', 'VIF', 'operate']
}

// -------------------------------------------------------------------

export function set ({ vif, allowedIpv4Addresses, allowedIpv6Addresses }) {
  const { id } = vif
  const handle = ([ newAddresses, oldAddresses ]) => {
    forEach(newAddresses, address => {
      this.allocIpAddress(address, id)::pCatch(noop)
    })
    forEach(oldAddresses, address => {
      this.deallocIpAddress(address, id)::pCatch(noop)
    })
  }
  handle(diffItems(allowedIpv4Addresses, vif.allowedIpv4Addresses))
  handle(diffItems(allowedIpv6Addresses, vif.allowedIpv6Addresses))

  return this.getXapi(vif).editVif(vif._xapiId, {
    ipv4Allowed: allowedIpv4Addresses,
    ipv6Allowed: allowedIpv6Addresses
  })
}

set.params = {
  allowedIpv4Addresses: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  },
  allowedIpv6Addresses: {
    type: 'array',
    items: {
      type: 'string'
    },
    optional: true
  }
}

set.resolve = {
  vif: ['id', 'VIF', 'operate']
}
