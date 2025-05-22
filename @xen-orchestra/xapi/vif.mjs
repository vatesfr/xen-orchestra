import isVmRunning from './_isVmRunning.mjs'

export default class Vif {
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
      VM,
    })

    if (currently_attached && isVmRunning(powerState)) {
      await this.callAsync('VIF.plug', vifRef)
    }

    return vifRef
  }
}
