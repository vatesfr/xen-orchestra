import { invalidParameters } from 'xo-common/api-errors.js'

import isVmRunning from './_isVmRunning.mjs'

export default class Vif {
  // A pool without VLAN filtering (xapi < 26.1.16) ignores the unknown `trunks` field, and its records lack it: the
  // VIF would see every VLAN, the opposite of what was asked. Such a VIF is destroyed before it is plugged
  async create(
    {
      currently_attached = true,
      device,
      ipv4_allowed,
      ipv6_allowed,
      locking_mode,
      MTU,
      network,
      other_config = {},
      qos_algorithm_params = {},
      qos_algorithm_type = '',
      trunks,
      VM,
    },
    {
      // duplicated MAC addresses can lead to issues,
      // therefore it should be passed explicitly
      MAC = '',
    } = {}
  ) {
    if (device === undefined) {
      const allowedDevices = await this.call('VM.get_allowed_VIF_devices', VM)
      if (allowedDevices.length === 0) {
        const error = new Error('could not find an allowed VIF device')
        error.poolUuid = this.pool.uuid
        error.vmRef = VM
        throw error
      }

      device = allowedDevices[0]
    }

    const [powerState, ...rest] = await Promise.all([
      this.getField('VM', VM, 'power_state'),
      MTU ?? this.getField('network', network, 'MTU'),
    ])
    ;[MTU] = rest

    const vifRef = await this.call('VIF.create', {
      currently_attached: powerState === 'Suspended' ? currently_attached : undefined,
      device,
      ipv4_allowed,
      ipv6_allowed,
      locking_mode,
      MAC,
      MTU,
      network,
      other_config,
      qos_algorithm_params,
      qos_algorithm_type,
      trunks,
      VM,
    })

    if (trunks !== undefined && trunks.length !== 0 && (await this.getRecord('VIF', vifRef)).trunks === undefined) {
      await this.call('VIF.destroy', vifRef)
      throw invalidParameters('VLAN filtering needs XCP-ng 8.3 with xapi 26.1.16 or later', [
        { field: 'trunks', message: `pool ${this.pool.uuid} has no VLAN filtering` },
      ])
    }

    if (currently_attached && isVmRunning(powerState)) {
      await this.callAsync('VIF.plug', vifRef)
    }

    return vifRef
  }
}
