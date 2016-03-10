export async function create ({ pool, name, description, pif, mtu = 1500, vlan = 0 }) {
  return this.getXapi(pool).createNetwork({
    name,
    description,
    pifId: pif && this.getObject(pif, 'PIF')._xapiId,
    mtu: +mtu,
    vlan: +vlan
  })
}

create.params = {
  pool: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string', optional: true },
  pif: { type: 'string', optional: true },
  mtu: { type: ['integer', 'string'], optional: true },
  vlan: { type: ['integer', 'string'], optional: true }
}

create.resolve = {
  pool: ['pool', 'pool', 'administrate']
}
create.permission = 'admin'

// =================================================================

export async function delete_ ({ network }) {
  return this.getXapi(network).deleteNetwork(network._xapiId)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  network: ['id', 'network', 'administrate']
}
