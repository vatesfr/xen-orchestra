import { ignoreErrors } from 'promise-toolbox'

import { diffItems } from '../utils'

// ===================================================================

// TODO: move into vm and rename to removeInterface
async function delete_ ({vif}) {
  this.allocIpAddresses(
    vif.id,
    null,
    vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses)
  )::ignoreErrors()

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
  await this.getXapi(vif).disconnectVif(vif._xapiId)
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
  await this.getXapi(vif).connectVif(vif._xapiId)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vif: ['id', 'VIF', 'operate']
}

// -------------------------------------------------------------------

export async function set ({
  vif,
  network,
  mac,
  allowedIpv4Addresses,
  allowedIpv6Addresses,
  attached
}) {
  const oldIpAddresses = vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses)
  const newIpAddresses = []
  {
    const { push } = newIpAddresses
    push.apply(newIpAddresses, allowedIpv4Addresses || vif.allowedIpv4Addresses)
    push.apply(newIpAddresses, allowedIpv6Addresses || vif.allowedIpv6Addresses)
  }

  if (network || mac) {
    const xapi = this.getXapi(vif)

    const vm = xapi.getObject(vif.$VM)
    mac == null && (mac = vif.MAC)
    network = xapi.getObject((network && network.id) || vif.$network)
    attached == null && (attached = vif.attached)

    await this.allocIpAddresses(vif.id, null, oldIpAddresses)
    await xapi.deleteVif(vif._xapiId)

    // create new VIF with new parameters
    const newVif = await xapi.createVif(vm.$id, network.$id, {
      mac,
      currently_attached: attached,
      ipv4_allowed: newIpAddresses
    })

    await this.allocIpAddresses(newVif.$id, newIpAddresses)

    return
  }

  const [ addAddresses, removeAddresses ] = diffItems(
    newIpAddresses,
    oldIpAddresses
  )
  await this.allocIpAddresses(
    vif.id,
    addAddresses,
    removeAddresses
  )

  return this.getXapi(vif).editVif(vif._xapiId, {
    ipv4Allowed: allowedIpv4Addresses,
    ipv6Allowed: allowedIpv6Addresses
  })
}

set.params = {
  id: { type: 'string' },
  network: { type: 'string', optional: true },
  mac: { type: 'string', optional: true },
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
  },
  attached: { type: 'boolean', optional: true }
}

set.resolve = {
  vif: ['id', 'VIF', 'operate'],
  network: ['network', 'network', 'operate']
}
