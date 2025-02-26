import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { incorrectState, operationFailed } from 'xo-common/api-errors.js'

import { getCurrentVmUuid } from './_XenStore.mjs'
import {
  addIpmiSensorDataType,
  containsDigit,
  IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME,
  isRelevantIpmiSensor,
} from './host/_ipmi.mjs'

const waitAgentRestart = (xapi, hostRef, prevAgentStartTime) =>
  new Promise(resolve => {
    // even though the ref could change in case of pool master restart, tests show it stays the same
    const stopWatch = xapi.watchObject(hostRef, host => {
      if (+host.other_config.agent_start_time > prevAgentStartTime && host.enabled) {
        stopWatch()
        resolve()
      }
    })
  })

class Host {
  async restartAgent(ref) {
    const agentStartTime = +(await this.getField('host', ref, 'other_config')).agent_start_time

    await this.call('host.restart_agent', ref)

    await waitAgentRestart(this, ref, agentStartTime)
  }

  /**
   * Suspend all resident VMS, reboot the host and resume the VMs
   *
   * The current VM is not suspended as to not interrupt the process.
   *
   * @param {string} ref - Opaque reference of the host
   */
  async smartReboot($defer, ref, bypassBlockedSuspend = false, bypassCurrentVmCheck = false) {
    await this.callAsync('host.disable', ref)

    // host may have been re-enabled already, this is not an problem
    $defer.onFailure(() => this.callAsync('host.enable', ref))

    let currentVmRef
    try {
      currentVmRef = await this.call('VM.get_by_uuid', await getCurrentVmUuid())
    } catch (error) {}

    const residentVmRefs = await this.getField('host', ref, 'resident_VMs')

    // check the VMs with PCI passthrough
    const vms = await asyncMap(residentVmRefs, ref => this.getRecord('VM', ref))
    const vmsNotSuspendable = vms.filter(async vm => {
      try {
        await this.call('VM.assert_operation_valid', vm.$ref, 'suspend')
        return false
      } catch (err) {
        return true
      }
    })
    const vmsNotSuspendableRefs = new Set(vmsNotSuspendable.map(vm => vm.$ref))

    const vmsWithSuspendBlocked = await asyncMap(residentVmRefs, ref => this.getRecord('VM', ref)).filter(
      vm =>
        vm.$ref !== currentVmRef &&
        !vm.is_control_domain &&
        vm.power_state !== 'Halted' &&
        vm.power_state !== 'Suspended' &&
        (vm.blocked_operations.suspend !== undefined || vmsNotSuspendableRefs.has(vm.$ref))
    )

    if (!bypassBlockedSuspend && vmsWithSuspendBlocked.length > 0) {
      throw incorrectState({ actual: vmsWithSuspendBlocked.map(vm => vm.uuid), expected: [], object: 'suspendBlocked' })
    }

    if (!bypassCurrentVmCheck && residentVmRefs.includes(currentVmRef)) {
      throw operationFailed({
        objectId: await this.getField('VM', currentVmRef, 'uuid'),
        code: 'xoaOnHost',
      })
    }

    await asyncEach(vmsWithSuspendBlocked, vm => {
      $defer(() => vm.update_blocked_operations('suspend', vm.blocked_operations.suspend ?? null))
      return vm.update_blocked_operations('suspend', null)
    })

    const suspendedVms = []

    // Resuming VMs should occur after host enabling to avoid triggering a 'NO_HOSTS_AVAILABLE' error
    //
    // The defers are running in reverse order.
    $defer(() => asyncEach(suspendedVms, vmRef => this.callAsync('VM.resume', vmRef, false, false)))
    $defer.onFailure(() =>
      // if the host has not been rebooted, it might still be disabled and need to be enabled manually
      this.callAsync('host.enable', ref)
    )

    await asyncEach(
      residentVmRefs,
      async vmRef => {
        if (vmRef === currentVmRef) {
          return
        }

        try {
          await this.callAsync('VM.suspend', vmRef)
          suspendedVms.push(vmRef)
        } catch (error) {
          const { code } = error

          // operation is not allowed on a control domain, ignore
          if (code === 'OPERATION_NOT_ALLOWED') {
            return
          }

          // ignore if the VM is already halted or suspended
          if (code === 'VM_BAD_POWER_STATE') {
            // power state is usually capitalized in XAPI but is lowercased in this error
            //
            // don't rely on it to be future proof
            const powerState = error.params[2].toLowerCase()
            if (powerState === 'halted' || powerState === 'suspended') {
              return
            }
          }

          // fallback on suspend error
          try {
            await this.callAsync('VM.clean_shutdown', vmRef)
          } catch (error) {
            await this.callAsync('VM.hard_shutdown', vmRef)
          }
        }
      },
      { stopOnError: false }
    )

    const agentStartTime = +(await this.getField('host', ref, 'other_config')).agent_start_time
    await this.callAsync('host.reboot', ref)
    await waitAgentRestart(this, ref, agentStartTime)
  }

  async getIpmiSensors(ref, { cache } = {}) {
    const productName = (await this.call(cache, 'host.get_bios_strings', ref))['system-product-name']?.toLowerCase()
    const callIpmiPlugin = fn => this.call(cache, 'host.call_plugin', ref, 'ipmitool.py', fn, {})

    if (
      IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName] === undefined ||
      (await callIpmiPlugin('is_ipmi_device_available')) === 'false'
    ) {
      return {}
    }

    const [stringifiedIpmiSensors, stringifiedIpmiLan] = await Promise.all([
      callIpmiPlugin('get_all_sensors'),
      callIpmiPlugin('get_ipmi_lan'),
    ])
    const ipmiSensors = JSON.parse(stringifiedIpmiSensors)
    const ipmiLan = JSON.parse(stringifiedIpmiLan)

    const ipmiSensorsByDataType = {}
    for (const ipmiSensor of [...ipmiSensors, ...ipmiLan]) {
      if (!isRelevantIpmiSensor(ipmiSensor, productName)) {
        continue
      }

      addIpmiSensorDataType(ipmiSensor, productName)
      const dataType = ipmiSensor.dataType

      if (ipmiSensorsByDataType[dataType] === undefined) {
        ipmiSensorsByDataType[dataType] = containsDigit(ipmiSensor.name) ? [] : ipmiSensor
      }

      if (Array.isArray(ipmiSensorsByDataType[ipmiSensor.dataType])) {
        ipmiSensorsByDataType[dataType].push(ipmiSensor)
      }
    }

    return ipmiSensorsByDataType
  }

  async getMdadmHealth(ref) {
    try {
      const result = await this.callAsync('host.call_plugin', ref, 'raid.py', 'check_raid_pool', {})
      const parsedResult = JSON.parse(result)

      return parsedResult
    } catch (error) {
      if (error.code === 'XENAPI_MISSING_PLUGIN' || error.code === 'UNKNOWN_XENAPI_PLUGIN_FUNCTION') {
        return null
      } else {
        throw error
      }
    }
  }
}
export default Host

decorateClass(Host, {
  smartReboot: defer,
})
