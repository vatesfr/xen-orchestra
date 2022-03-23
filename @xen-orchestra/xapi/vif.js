'use strict'

const isVmRunning = require('./_isVmRunning.js')

module.exports = class Vif {
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
      VM,
    },
    {
      // duplicated MAC addresses can lead to issues,
      // therefore it should be passed explicitely
      MAC = '',
    } = {}
  ) {
    const [powerState, ...rest] = await Promise.all([
      this.getField('VM', VM, 'power_state'),
      device ?? (await this.call('VM.get_allowed_VIF_devices', VM))[0],
      MTU ?? (await this.getField('network', network, 'MTU')),
    ])
    ;[device, MTU] = rest

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
      VM,
    })

    if (currently_attached && isVmRunning(powerState)) {
      await this.callAsync('VIF.plug', vifRef)
    }

    return vifRef
  }
}
