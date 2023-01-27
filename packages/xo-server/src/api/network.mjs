import xapiObjectToXo from '../xapi-object-to-xo.mjs'

export function getBondModes() {
  return ['balance-slb', 'active-backup', 'lacp']
}

export async function create({ pool, name, description, pif, mtu = 1500, vlan = 0, nbd }) {
  const network = xapiObjectToXo(
    await this.getXapi(pool).createNetwork({
      name,
      description,
      pifId: pif && this.getObject(pif, 'PIF')._xapiId,
      mtu: +mtu,
      vlan: +vlan,
    })
  )

  if (nbd) {
    await this.getXapiObject(network._xapiRef).add_purpose('nbd')
  }

  return network.id
}

create.params = {
  pool: { type: 'string' },
  name: { type: 'string' },
  nbd: { type: 'boolean', optional: true },
  description: { type: 'string', optional: true },
  pif: { type: 'string', optional: true },
  mtu: { type: ['integer', 'string'], optional: true },
  vlan: { type: ['integer', 'string'], optional: true },
}

create.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}

// =================================================================

export async function createBonded({ pool, name, description, pifs, mtu = 1500, bondMode }) {
  return this.getXapi(pool).createBondedNetwork({
    name,
    description,
    pifIds: pifs.map(pif => this.getObject(pif, 'PIF')._xapiId),
    mtu: +mtu,
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
  bondMode: { enum: getBondModes() },
}

createBonded.resolve = {
  pool: ['pool', 'pool', 'administrate'],
}
createBonded.description = 'Create a bonded network. bondMode can be balance-slb, active-backup or lacp'

// ===================================================================

export async function set({
  network,

  automatic,
  defaultIsLocked,
  name_description: nameDescription,
  name_label: nameLabel,
  nbd,
}) {
  network = this.getXapiObject(network)

  async function updateNbd(nbd){
    if(nbd){
      if (network.purpose.includes('insecure_nbd')){
        await network.remove_purpose('insecure_nbd')
      }
      await network.add_purpose('nbd')
    } else {
      await network.remove_purpose('nbd')
    }
  }
  await Promise.all([
    automatic !== undefined && network.update_other_config('automatic', automatic ? 'true' : null),
    defaultIsLocked !== undefined && network.set_default_locking_mode(defaultIsLocked ? 'disabled' : 'unlocked'),
    nameDescription !== undefined && network.set_name_description(nameDescription),
    nameLabel !== undefined && network.set_name_label(nameLabel),
    nbd !== undefined && updateNbd(),
  ])
}

set.params = {
  automatic: {
    type: 'boolean',
    optional: true,
  },
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
  nbd: {
    type: 'boolean',
    optional: true,
  },
}

set.resolve = {
  network: ['id', 'network', 'administrate'],
}

// =================================================================

async function delete_({ network }) {
  return this.getXapi(network).deleteNetwork(network._xapiId)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  network: ['id', 'network', 'administrate'],
}
