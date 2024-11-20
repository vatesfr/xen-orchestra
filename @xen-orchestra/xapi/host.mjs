import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { incorrectState, operationFailed } from 'xo-common/api-errors.js'

import { getCurrentVmUuid } from './_XenStore.mjs'
import {
  addIpmiSensorDataType,
  containsDigit,
  IPMI_SENSOR_DATA_TYPE,
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
    const vmsWithSuspendBlocked = await asyncMap(residentVmRefs, ref => this.getRecord('VM', ref)).filter(
      vm =>
        vm.$ref !== currentVmRef &&
        !vm.is_control_domain &&
        vm.power_state !== 'Halted' &&
        vm.power_state !== 'Suspended' &&
        vm.blocked_operations.suspend !== undefined
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

          throw error
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

    if (IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName] === undefined) {
      return {}
    }

    const callSensorPlugin = fn => this.call(cache, 'host.call_plugin', ref, '2crsi-sensors.py', fn, {})
    // https://github.com/AtaxyaNetwork/xcp-ng-xapi-plugins/tree/ipmi-sensors?tab=readme-ov-file#ipmi-sensors-parser
    const [stringifiedIpmiSensors, ip] = await Promise.all([callSensorPlugin('get_info'), callSensorPlugin('get_ip')])
    const ipmiSensors = JSON.parse(stringifiedIpmiSensors)

    const ipmiSensorsByDataType = {}
    for (const ipmiSensor of ipmiSensors) {
      if (!isRelevantIpmiSensor(ipmiSensor, productName)) {
        continue
      }

      addIpmiSensorDataType(ipmiSensor, productName)
      const dataType = ipmiSensor.dataType

      if (ipmiSensorsByDataType[dataType] === undefined) {
        ipmiSensorsByDataType[dataType] = containsDigit(ipmiSensor.Name) ? [] : ipmiSensor
      }

      if (Array.isArray(ipmiSensorsByDataType[ipmiSensor.dataType])) {
        ipmiSensorsByDataType[dataType].push(ipmiSensor)
      }
    }

    ipmiSensorsByDataType[IPMI_SENSOR_DATA_TYPE.generalInfo] = { ip }

    return ipmiSensorsByDataType
  }

  async checkBiosUpdate(ref) {
    const biosData = await this.call('host.get_bios_strings', ref)
    const { 'bios-version': currentBiosVersion } = biosData

    const response = await fetch(
      'https://pictures.2cr.si/Images_site_web_Odoo/Pages_produit/VATES-BIOS_BMC_last-version.json'
    )

    const parsedData = (await response.json())[0]?.['2CRSi_Servers']

    const serverData = parsedData.find(server => server.Server_Name)

    const { 'BIOS-Version': latestBiosVersion, 'BIOS-link': biosLink } = serverData
    const isUpToDate = currentBiosVersion === latestBiosVersion

    return { currentBiosVersion, latestBiosVersion, biosLink, isUpToDate }
  }
}
export default Host

decorateClass(Host, {
  smartReboot: defer,
})
