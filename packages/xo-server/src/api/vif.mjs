import { ignoreErrors } from 'promise-toolbox'

import { diffItems } from '../utils.mjs'

// ===================================================================

export function getLockingModeValues() {
  return ['disabled', 'locked', 'network_default', 'unlocked']
}

// -------------------------------------------------------------------

// TODO: move into vm and rename to removeInterface
async function delete_({ vif }) {
  this.allocIpAddresses(vif.id, null, vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses))::ignoreErrors()

  await this.getXapi(vif).deleteVif(vif._xapiId)
}
export { delete_ as delete }

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  vif: ['id', 'VIF', 'administrate'],
}

// -------------------------------------------------------------------

// TODO: move into vm and rename to disconnectInterface
export async function disconnect({ vif }) {
  // TODO: check if VIF is attached before
  await this.getXapi(vif).disconnectVif(vif._xapiId)
}

disconnect.params = {
  id: { type: 'string' },
}

disconnect.resolve = {
  vif: ['id', 'VIF', 'operate'],
}

// -------------------------------------------------------------------
// TODO: move into vm and rename to connectInterface
export async function connect({ vif }) {
  // TODO: check if VIF is attached before
  await this.getXapi(vif).connectVif(vif._xapiId)
}

connect.params = {
  id: { type: 'string' },
}

connect.resolve = {
  vif: ['id', 'VIF', 'operate'],
}

// -------------------------------------------------------------------

export async function set({
  vif,

  allowedIpv4Addresses,
  allowedIpv6Addresses,
  attached,
  lockingMode,
  mac,
  network,
  rateLimit,
  resourceSet,
  txChecksumming,
}) {
  const isNetworkChanged = network !== undefined && network.id !== vif.$network

  // - If allowed IPs were explicitly passed: use them
  // - Else if the network is changing: remove the existing allowed IPs
  // - Else: use the old IPs
  const newIpv4Addresses = allowedIpv4Addresses ?? (isNetworkChanged ? [] : vif.allowedIpv4Addresses)
  const newIpv6Addresses = allowedIpv6Addresses ?? (isNetworkChanged ? [] : vif.allowedIpv6Addresses)

  const oldIpAddresses = vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses)
  const newIpAddresses = newIpv4Addresses.concat(newIpv6Addresses)

  if (lockingMode !== undefined) {
    await this.checkPermissions([[network?.id ?? vif.$network, 'operate']])
  }

  // Handle network and/or MAC address changes
  if (isNetworkChanged || mac !== undefined) {
    const networkId = network?.id
    if (mac !== undefined && this.apiContext.permission !== 'admin') {
      await this.checkPermissions([[networkId ?? vif.$network, 'administrate']])
    }
    if (networkId !== undefined && this.apiContext.permission !== 'admin') {
      if (resourceSet !== undefined) {
        await this.checkResourceSetConstraints(resourceSet, this.apiContext.user.id, [networkId])
      } else {
        await this.checkPermissions([[networkId, 'operate']])
      }
    }

    const xapi = this.getXapi(vif)

    // If only the network is changing (not MAC), try to use VIF.move which is non-destructive
    // VIF.move was introduced in XenServer 7.1 and keeps the VIF UUID, avoiding network downtime
    if (isNetworkChanged && mac === undefined) {
      const targetNetwork = xapi.getObject(networkId)

      try {
        // Try VIF.move first (XenServer 7.1+)
        await xapi.moveVif(vif._xapiId, targetNetwork._xapiId)

        this.log.info('VIF moved to new network using VIF.move', {
          vifId: vif.id,
          oldNetworkId: vif.$network,
          newNetworkId: networkId,
        })

        // Update IP addresses allocation
        const [addAddresses, removeAddresses] = diffItems(newIpAddresses, oldIpAddresses)
        await this.allocIpAddresses(vif.id, addAddresses, removeAddresses)

        // Update other VIF properties if needed
        await xapi.editVif(vif._xapiId, {
          ipv4Allowed: newIpv4Addresses.length > 0 ? newIpv4Addresses : undefined,
          ipv6Allowed: newIpv6Addresses.length > 0 ? newIpv6Addresses : undefined,
          lockingMode: lockingMode ?? 'network_default',
          rateLimit,
          txChecksumming,
        })

        return vif.id // VIF ID is preserved with VIF.move
      } catch (error) {
        // Fallback to delete+create for XenServer < 7.1 or if VIF.move fails
        if (error.code === 'MESSAGE_METHOD_UNKNOWN') {
          this.log.warn('VIF.move not available, falling back to delete+create', {
            vifId: vif.id,
            xenServerVersion: 'pre-7.1',
          })
        } else {
          this.log.warn('VIF.move failed, falling back to delete+create', {
            vifId: vif.id,
            error: error.message,
          })
        }
        // Continue to delete+create fallback below
      }
    }

    // Fallback: delete and recreate VIF
    // This path is used when:
    // 1. MAC address is changing (VIF.move doesn't support MAC changes)
    // 2. VIF.move is not available (XenServer < 7.1)
    // 3. VIF.move failed for some reason
    const vm = xapi.getObject(vif.$VM)
    mac == null && (mac = vif.MAC)
    network = xapi.getObject(networkId ?? vif.$network)
    attached == null && (attached = vif.attached)

    await this.allocIpAddresses(vif.id, null, oldIpAddresses)
    await xapi.deleteVif(vif._xapiId)

    // create new VIF with new parameters
    const newVif = await xapi._getOrWaitObject(
      await xapi.VIF_create(
        {
          currently_attached: attached,
          ipv4_allowed: newIpv4Addresses,
          ipv6_allowed: newIpv6Addresses,
          // - If locking mode has explicitly passed: use it
          // - Else if the network is changing: config it to 'network_default'
          // - Else: use the old locking mode
          locking_mode: lockingMode ?? (isNetworkChanged ? 'network_default' : vif.lockingMode),
          qos_algorithm_type: rateLimit != null ? 'ratelimit' : undefined,
          qos_algorithm_params: rateLimit != null ? { kbps: String(rateLimit) } : undefined,
          network: network.$ref,
          other_config: {
            'ethtool-tx': txChecksumming !== undefined ? String(txChecksumming) : undefined,
          },
          VM: vm.$ref,
        },
        {
          MAC: mac,
        }
      )
    )

    await this.allocIpAddresses(newVif.$id, newIpAddresses)

    return newVif.$id
  }

  const [addAddresses, removeAddresses] = diffItems(newIpAddresses, oldIpAddresses)
  await this.allocIpAddresses(vif.id, addAddresses, removeAddresses)

  await this.getXapi(vif).editVif(vif._xapiId, {
    ipv4Allowed: allowedIpv4Addresses,
    ipv6Allowed: allowedIpv6Addresses,
    lockingMode,
    rateLimit,
    txChecksumming,
  })

  return vif.id
}

set.description = 'Change properties of a VIF, its identifier is returned because it might change during the update'

set.params = {
  id: { type: 'string' },
  network: { type: 'string', optional: true },
  mac: { type: 'string', optional: true },
  allowedIpv4Addresses: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  allowedIpv6Addresses: {
    type: 'array',
    items: {
      type: 'string',
    },
    optional: true,
  },
  attached: { type: 'boolean', optional: true },
  lockingMode: { type: 'string', optional: true },
  rateLimit: {
    description: 'in kilobytes per seconds',
    optional: true,
    type: ['number', 'null'],
  },
  resourceSet: { type: 'string', optional: true },
  txChecksumming: {
    type: 'boolean',
    optional: true,
  },
}

set.resolve = {
  vif: ['id', 'VIF', 'operate'],
  network: ['network', 'network', false],
}
