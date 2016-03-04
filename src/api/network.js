<<<<<<< 91431201771f54434ebda173c26bda1c3df405d4
export async function create ({ pool, name, description, pif, mtu = 1500, vlan = 0 }) {
  return this.getXapi(pool).createNetwork({
    name,
    description,
    pifId: pif && this.getObject(pif, 'PIF')._xapiId,
    mtu: +mtu,
    vlan: +vlan
  })
=======
export async function create ({ pool, name, description, pif, mtu, vlan }) {
  if (pif) {
    pif = this.getObject(pif, 'PIF')
  }
  const params = {
    name,
    description,
    pif: pif && pif._xapiRef,
    mtu: mtu || '1500',
    vlan: vlan || '0'
  }
  return this.getXapi(pool).createNetwork(params)
>>>>>>> `network.create` instead of `createNetwork` for host and pool
}

create.params = {
  pool: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string', optional: true },
  pif: { type: 'string', optional: true },
<<<<<<< 91431201771f54434ebda173c26bda1c3df405d4
  mtu: { type: ['integer', 'string'], optional: true },
  vlan: { type: ['integer', 'string'], optional: true }
=======
  mtu: { type: 'string', optional: true },
  vlan: { type: 'string', optional: true }
>>>>>>> `network.create` instead of `createNetwork` for host and pool
}

create.resolve = {
  pool: ['pool', 'pool', 'administrate']
}
create.permission = 'admin'
<<<<<<< 91431201771f54434ebda173c26bda1c3df405d4
=======
exports.create = create
>>>>>>> `network.create` instead of `createNetwork` for host and pool
