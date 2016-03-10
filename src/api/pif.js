// TODO: too low level, move into host.

// ===================================================================
// Delete

async function delete_ ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXapi(PIF).call('PIF.destroy', PIF._xapiRef)
}
export {delete_ as delete}

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}

// ===================================================================
// Disconnect

export async function disconnect ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXapi(PIF).call('PIF.unplug', PIF._xapiRef)
}

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}
// ===================================================================
// Connect

export async function connect ({PIF}) {
  // TODO: check if PIF is attached before
  await this.getXapi(PIF).call('PIF.plug', PIF._xapiRef)
}

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  PIF: ['id', 'PIF', 'administrate']
}
// ===================================================================
// Reconfigure IP

export async function reconfigureIp ({ PIF, mode = 'DHCP', ip, netmask, gateway, dns }) {
  await this.getXapi(PIF).call('PIF.reconfigure_ip', PIF._xapiRef, mode, ip, netmask, gateway, dns)
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
  PIF: ['id', 'PIF', 'administrate']
}
