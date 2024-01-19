// TODO: too low level, move into host.

import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

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

  await xapi.callAsync('PIF.forget', pif._xapiRef)
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

export async function reconfigureIp({ pif, mode, ip = '', netmask = '', gateway = '', dns = '', ipv6, ipv6Mode }) {
  const task = this.tasks.create({
    name: `reconfigure ip of: ${pif.device}`,
    objectId: pif.uuid,
    type: 'xo:pif:reconfigureIp',
  })
  await task.run(async () => {
    const xapi = this.getXapi(pif)

    if ((ipv6 !== '' && pif.ipv6?.[0] !== ipv6) || (ipv6Mode !== undefined && ipv6Mode !== pif.ipv6Mode)) {
      await Task.run(
        { properties: { name: 'reconfigure IPv6', mode: ipv6Mode, ipv6, gateway, dns, objectId: pif.uuid } },
        () => xapi.call('PIF.reconfigure_ipv6', pif._xapiRef, ipv6Mode, ipv6, gateway, dns)
      )
    }

    if (
      (mode !== undefined && mode !== pif.mode) ||
      ip !== pif.ip ||
      netmask !== pif.netmask ||
      gateway !== pif.gateway ||
      dns !== pif.dns
    ) {
      await Task.run(
        { properties: { name: 'reconfigure IPv4', mode, ip, netmask, gateway, dns, objectId: pif.uuid } },
        () => xapi.call('PIF.reconfigure_ip', pif._xapiRef, mode, ip, netmask, gateway, dns)
      )
    }
    if (pif.management) {
      await Task.run({ properties: { name: 'reconfigure PIF management', objectId: pif.uuid } }, () =>
        xapi.call('host.management_reconfigure', pif._xapiRef)
      )
    }
  })
}

reconfigureIp.params = {
  id: { type: 'string', optional: true },
  mode: { type: 'string', optional: true },
  ip: { type: 'string', minLength: 0, optional: true },
  netmask: { type: 'string', minLength: 0, optional: true },
  gateway: { type: 'string', minLength: 0, optional: true },
  dns: { type: 'string', minLength: 0, optional: true },
  ipv6: { type: 'string', minLength: 0, default: '' },
  ipv6Mode: { enum: getIpv6ConfigurationModes(), optional: true },
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
