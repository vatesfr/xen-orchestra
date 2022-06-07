'use strict'

const identity = require('lodash/identity.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { Ref } = require('xen-api')

const isVmRunning = require('./_isVmRunning.js')

const { warn } = require('@xen-orchestra/log').createLogger('xo:xapi:vbd')

const noop = Function.prototype

module.exports = class Vbd {
  async create({
    bootable = false,
    currently_attached = false,
    device = '',
    other_config = {},
    qos_algorithm_params = {},
    qos_algorithm_type = '',
    type = 'Disk',
    unpluggable = false,
    userdevice,
    VDI,
    VM,

    empty = !Ref.isNotEmpty(VDI),
    mode = type === 'Disk' ? 'RW' : 'RO',
  }) {
    if (userdevice == null) {
      const allowed = await this.call('VM.get_allowed_VBD_devices', VM)
      const { length } = allowed
      if (length === 0) {
        throw new Error('no allowed VBD devices')
      }

      if (type === 'CD') {
        // Choose position 3 if allowed.
        userdevice = allowed.includes('3') ? '3' : allowed[0]
      } else {
        userdevice = allowed[0]

        // Avoid userdevice 3 if possible.
        if (userdevice === '3' && length > 1) {
          userdevice = allowed[1]
        }
      }
    }

    const powerState = await this.getField('VM', VM, 'power_state')
    const ifVmSuspended = powerState === 'Suspended' ? identity : noop

    // By default a VBD is unpluggable.
    const vbdRef = await this.call('VBD.create', {
      bootable,
      currently_attached: ifVmSuspended(currently_attached),
      device: ifVmSuspended(device),
      empty,
      mode,
      other_config,
      qos_algorithm_params,
      qos_algorithm_type,
      type,
      unpluggable,
      userdevice,
      VDI,
      VM,
    })

    if (isVmRunning(powerState)) {
      this.callAsync('VBD.plug', vbdRef).catch(warn)
    }

    return vbdRef
  }

  async unplug(ref) {
    // TODO: check if VBD is attached before
    try {
      await this.call('VBD.unplug_force', ref)
    } catch (error) {
      if (error.code !== 'VBD_NOT_UNPLUGGABLE') {
        throw error
      }

      await this.setField('VBD', ref, 'unpluggable', true)
      await this.call('VBD.unplug_force', ref)
    }
  }

  async destroy(ref) {
    await ignoreErrors.call(this.VBD_unplug(ref))
    await this.call('VBD.destroy', ref)
  }
}
