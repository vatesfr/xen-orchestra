import TTLCache from '@isaacs/ttlcache'
import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { incorrectState, operationFailed } from 'xo-common/api-errors.js'

import { getCurrentVmUuid } from './_XenStore.mjs'

const IPMI_CACHE_TTL = 6e4

const IPMI_SENSOR_DATA_TYPE = {
  totalPower: 'totalPower',
  outletTemp: 'outletTemp',
  bmcStatus: 'bmcStatus',
  inletTemp: 'inletTemp',
  cpuTemp: 'cpuTemp',
  fanStatus: 'fanStatus',
  fanSpeed: 'fanSpeed',
  psuStatus: 'psuStatus',
  generalInfo: 'generalInfo',
  unknown: 'unknown',
}

const IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME = {
  'mona_1.44gg': {
    [IPMI_SENSOR_DATA_TYPE.totalPower]: /^total_power$/i,
    [IPMI_SENSOR_DATA_TYPE.outletTemp]: /^outlet_temp$/i,
    [IPMI_SENSOR_DATA_TYPE.bmcStatus]: /^bmc_status$/i,
    [IPMI_SENSOR_DATA_TYPE.inletTemp]: /^psu_inlet_temp$/i,
    [IPMI_SENSOR_DATA_TYPE.cpuTemp]: /^cpu[0-9]+_temp$/i,
    [IPMI_SENSOR_DATA_TYPE.fanStatus]: /^fan[0-9]+_status$/i,
    [IPMI_SENSOR_DATA_TYPE.fanSpeed]: /^fan[0-9]+_r_speed$/i,
    [IPMI_SENSOR_DATA_TYPE.psuStatus]: /^psu[0-9]+_status$/i,
  },
}
const IPMI_SENSOR_REGEX_BY_PRODUCT_NAME = Object.keys(IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME).reduce(
  (acc, productName) => {
    const regexes = Object.values(IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName])
    const combinedRegex = new RegExp(regexes.map(regex => regex.source).join('|'), 'i')
    acc[productName] = combinedRegex
    return acc
  },
  {}
)

const IPMI_CACHE = new TTLCache({
  ttl: IPMI_CACHE_TTL,
  max: 1000
})

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

const isRelevantIpmiSensor = (data, productName) => IPMI_SENSOR_REGEX_BY_PRODUCT_NAME[productName].test(data.Name)
const addIpmiSensorDataType = (data, productName) => {
  const name = data.Name
  const ipmiRegexByDataType = IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName]

  for (const dataType in ipmiRegexByDataType) {
    const regex = ipmiRegexByDataType[dataType]
    if (regex.test(name)) {
      data.dataType = dataType
      return
    }
  }

  data.dataType = IPMI_SENSOR_DATA_TYPE.unknown
}
const containsDigit = str => /\d/.test(str)

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

  async getIpmiSensors(ref) {
    const productName = (await this.getField('host', ref, 'bios_strings'))['system-product-name']?.toLowerCase()
    if (IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName] === undefined) {
      return {}
    }
    const callSensorPlugin = fn => this.call(IPMI_CACHE, 'host.call_plugin', ref, '2crsi-sensors.py', fn, {})
    // https://github.com/AtaxyaNetwork/xcp-ng-xapi-plugins/tree/ipmi-sensors?tab=readme-ov-file#ipmi-sensors-parser
    const [stringifiedIpmiSensors, ip] = await Promise.all([callSensorPlugin('get_info'), callSensorPlugin('get_ip')])
    const ipmiSensors = JSON.parse(stringifiedIpmiSensors)

    const ipmiSensorsByDataType = {}
    ipmiSensors.forEach(ipmiSensor => {
      if (!isRelevantIpmiSensor(ipmiSensor, productName)) {
        return
      }

      addIpmiSensorDataType(ipmiSensor, productName)
      const dataType = ipmiSensor.dataType

      if (ipmiSensorsByDataType[dataType] === undefined) {
        ipmiSensorsByDataType[dataType] = containsDigit(ipmiSensor.Name) ? [] : ipmiSensor
      }

      if (Array.isArray(ipmiSensorsByDataType[ipmiSensor.dataType])) {
        ipmiSensorsByDataType[dataType].push(ipmiSensor)
      }
    })

    ipmiSensorsByDataType[IPMI_SENSOR_DATA_TYPE.generalInfo] = { ip }

    return ipmiSensorsByDataType
  }
}
export default Host

decorateClass(Host, {
  smartReboot: defer,
})
