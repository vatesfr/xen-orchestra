import { mapToArray } from '../utils'

export function getBondModes() {
  return ['balance-slb', 'active-backup', 'lacp']
}

export async function create({
  pool,
  name,
  description,
  pif,
  mtu = 1500,
  vlan = 0,
}) {
  return this.getXapi(pool).createNetwork({
    name,
    description,
    pifId: pif && this.getObject(pif, 'PIF')._xapiId,
    mtu: +mtu,
    vlan: +vlan,
  })
}

create.params = {
  pool: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string', optional: true },
  pif: { type: 'string', optional: true },
  mtu: { type: ['integer', 'string'], optional: true },
  vlan: { type: ['integer', 'string'], optional: true },
}

create.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}
create.permission = 'admin'

// =================================================================

export async function createBonded({
  pool,
  name,
  description,
  pifs,
  mtu = 1500,
  mac,
  bondMode,
}) {
  return this.getXapi(pool).createBondedNetwork({
    name,
    description,
    pifIds: mapToArray(pifs, pif => this.getObject(pif, 'PIF')._xapiId),
    mtu: +mtu,
    mac,
    bondMode,
  })
}

createBonded.params = {
  pool: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string', optional: true },
  pifs: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  mtu: { type: ['integer', 'string'], optional: true },
  mac: { type: 'string', optional: true },
  // RegExp since schema-inspector does not provide a param check based on an enumeration
  bondMode: {
    type: 'string',
    pattern: new RegExp(`^(${getBondModes().join('|')})$`),
  },
}

createBonded.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}
createBonded.permission = 'admin'
createBonded.description =
  'Create a bonded network. bondMode can be balance-slb, active-backup or lacp'

// ===================================================================

export async function set({
  defaultIsLocked,
  id,
  name_description: nameDescription,
  name_label: nameLabel,
  network,
  other_config: otherConfig,
}) {
  await this.getXapi(network).setNetworkProperties(network._xapiId, {
    defaultIsLocked,
    nameDescription,
    nameLabel,
    otherConfig,
  })
}

set.params = {
  defaultIsLocked: {
    type: 'boolean',
    optional: true,
  },
  id: {
    type: 'string',
  },
  name_description: {
    type: 'string',
    optional: true,
  },
  name_label: {
    type: 'string',
    optional: true,
  },
  other_config: {
    type: 'object',
    optional: true,
  },
}

set.resolve = {
  network: ['id', 'network', 'administrate'],
}

// =================================================================

export async function delete_({ network }) {
  return this.getXapi(network).deleteNetwork(network._xapiId)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  network: ['id', 'network', 'administrate'],
}
