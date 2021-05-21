// TODO: too low level, move into host.

import filter from 'lodash/filter.js'
import find from 'lodash/find.js'

import { IPV4_CONFIG_MODES, IPV6_CONFIG_MODES } from '../xapi/index.mjs'

export function getIpv4ConfigurationModes() {
  return IPV4_CONFIG_MODES
}

export function getIpv6ConfigurationModes() {
  return IPV6_CONFIG_MODES
}

// ===================================================================
// Delete

async function delete_({ pif }) {
  // TODO: check if PIF is attached before
  const xapi = this.getXapi(pif)

  const tunnels = filter(xapi.objects.all, { $type: 'tunnel' })
  const tunnel = find(tunnels, { access_PIF: pif._xapiRef })
  if (tunnel != null) {
    await xapi.callAsync('PIF.unplug', pif._xapiRef)
    await xapi.callAsync('tunnel.destroy', tunnel.$ref)
    return
  }

  await xapi.callAsync('PIF.destroy', pif._xapiRef)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  pif: ['id', 'PIF', 'administrate'],
}

// ===================================================================
// Disconnect

export async function disconnect({ pif }) {
  // TODO: check if PIF is attached before
  await this.getXapi(pif).callAsync('PIF.unplug', pif._xapiRef)
}

disconnect.params = {
  id: { type: 'string' },
}

disconnect.resolve = {
  pif: ['id', 'PIF', 'administrate'],
}
// ===================================================================
// Connect

export async function connect({ pif }) {
  // TODO: check if PIF is attached before
  await this.getXapi(pif).callAsync('PIF.plug', pif._xapiRef)
}

connect.params = {
  id: { type: 'string' },
}

connect.resolve = {
  pif: ['id', 'PIF', 'administrate'],
}
// ===================================================================
// Reconfigure IP

export async function reconfigureIp({ pif, mode = 'DHCP', ip = '', netmask = '', gateway = '', dns = '' }) {
  const xapi = this.getXapi(pif)
  await xapi.call('PIF.reconfigure_ip', pif._xapiRef, mode, ip, netmask, gateway, dns)
  if (pif.management) {
    await xapi.call('host.management_reconfigure', pif._xapiRef)
  }
}

reconfigureIp.params = {
  id: { type: 'string', optional: true },
  mode: { type: 'string', optional: true },
  ip: { type: 'string', optional: true },
  netmask: { type: 'string', optional: true },
  gateway: { type: 'string', optional: true },
  dns: { type: 'string', optional: true },
}

reconfigureIp.resolve = {
  pif: ['id', 'PIF', 'administrate'],
}

// ===================================================================

export async function editPif({ pif, vlan }) {
  await this.getXapi(pif).editPif(pif._xapiId, { vlan })
}

editPif.params = {
  id: { type: 'string' },
  vlan: { type: ['integer', 'string'] },
}

editPif.resolve = {
  pif: ['id', 'PIF', 'administrate'],
}
