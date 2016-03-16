// TODO: too low level, move into host.

// ===================================================================
// Delete

async function delete_ ({pif}) {
  // TODO: check if PIF is attached before
  await this.getXapi(pif).call('PIF.destroy', pif._xapiRef)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  pif: ['id', 'PIF', 'administrate']
}

// ===================================================================
// Disconnect

export async function disconnect ({pif}) {
  // TODO: check if PIF is attached before
  await this.getXapi(pif).call('PIF.unplug', pif._xapiRef)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  pif: ['id', 'PIF', 'administrate']
}
// ===================================================================
// Connect

export async function connect ({pif}) {
  // TODO: check if PIF is attached before
  await this.getXapi(pif).call('PIF.plug', pif._xapiRef)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  pif: ['id', 'PIF', 'administrate']
}
// ===================================================================
// Reconfigure IP

export async function reconfigureIp ({ pif, mode = 'DHCP', ip, netmask, gateway, dns }) {
  await this.getXapi(pif).call('PIF.reconfigure_ip', pif._xapiRef, mode, ip, netmask, gateway, dns)
}

reconfigureIp.params = {
  id: { type: 'string', optional: true },
  mode: { type: 'string', optional: true },
  ip: { type: 'string', optional: true },
  netmask: { type: 'string', optional: true },
  gateway: { type: 'string', optional: true },
  dns: { type: 'string', optional: true }
}

reconfigureIp.resolve = {
  pif: ['id', 'PIF', 'administrate']
}
