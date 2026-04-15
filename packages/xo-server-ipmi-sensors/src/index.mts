/**
 * XO Server IPMI Sensors Plugin
 *
 * This plugin exposes IPMI sensor data from XenServer/XCP-ng hosts.
 * It collects vendor-specific sensor readings and categorizes them
 * using configurable regex rules for supported products.
 */

import type { Branded, XoApp, XoHost } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { DEFAULT_IPMI_SENSOR_REGEX_CONFIG_STRINGIFIED } from './default-rules.mjs'
import { addIpmiSensorDataType, containsDigit, isRelevantIpmiSensor, parseRegexConfig } from './ipmi-rules.mjs'
import { addCustomIpmiSensors } from './legacy-computed-rules.mjs'
import {
  IPMI_SENSOR_DATA_TYPE,
  SensorRegexByProduct,
  ReturnedSensorData,
  FinalSensorData,
  PluginConfiguration,
} from './types.mjs'

// ============================================================================
// Constants
// ============================================================================

const logger = createLogger('xo:xo-server-ipmi-sensors')

// ============================================================================
// Configuration Schema (exported for xo-server)
// ============================================================================

export const sensorRegexProperties = Object.fromEntries(
  Object.values(IPMI_SENSOR_DATA_TYPE).map(key => [key, { type: 'string', default: '' }])
)

export const configurationSchema = {
  type: 'object',
  properties: {
    vendors: {
      type: 'array',
      title: 'Supported vendors',
      description: 'List of supported product names for IPMI sensor regex matching',
      default: DEFAULT_IPMI_SENSOR_REGEX_CONFIG_STRINGIFIED,

      items: {
        type: 'object',
        title: 'Sensor regex by product',
        description: 'Map of product name > sensor data type > regex pattern (string)',
        properties: {
          vendor: {
            type: 'string',
            default: 'generic',
          },
          sensorRegexps: {
            type: 'object',
            description: 'Map of sensor data type > regex pattern with format /pattern/flags (e.g. /^fan[0-9]+$/i)',
            properties: sensorRegexProperties,
          },
        },
      },
    },
  },
  additionalProperties: false,
} as const

export const configurationPresets = {
  default: {
    vendors: DEFAULT_IPMI_SENSOR_REGEX_CONFIG_STRINGIFIED,
  },
} as const

// ============================================================================
// Plugin Class
// ============================================================================

class IpmiSensorsPlugin {
  #configuration: PluginConfiguration | undefined
  #configuredRulesByProduct: SensorRegexByProduct[]
  readonly #xo: XoApp
  #unloadApiMethods: (() => void)[] = []
  constructor(xo: XoApp) {
    this.#xo = xo
    this.#configuredRulesByProduct = []
    logger.info('Plugin initialized')
  }

  /**
   * Configure the plugin with the provided configuration.
   */
  async configure(configuration: PluginConfiguration): Promise<void> {
    this.#configuration = configuration
    this.#configuredRulesByProduct = configuration.vendors ? parseRegexConfig(configuration.vendors) : []
    logger.debug('Plugin configured')
  }

  /**
   * Load and start the plugin.
   */
  async load(): Promise<void> {
    this.#unloadApiMethods.push(
      this.#xo.addApiMethod<[{ id: XoHost | Branded<'host'> }], FinalSensorData>(
        'ipmi-sensors.get_ipmi_sensors',
        this.getIpmiSensors.bind(this)
      ),
      // replacement for the method in packages/xo-server/src/api/host.mjs
      this.#xo.addApiMethod<[{ id: XoHost | Branded<'host'> }], FinalSensorData>(
        'host.get_ipmi_sensors',
        this.getIpmiSensors.bind(this)
      )
    )
  }

  async getIpmiSensors(ref: { id: XoHost | Branded<'host'> }) {
    const xApiHost = this.#xo.getXapiObject<XoHost>(ref.id, 'host')
    const biosStrings = xApiHost.bios_strings
    let productName = biosStrings['system-product-name']?.toLowerCase() || ''
    const systemManufacturer = biosStrings['system-manufacturer']?.toLowerCase() || ''
    // Olivier.L request: consider all DELL and Lenovo servers in the same way
    if (systemManufacturer.includes('dell')) productName = 'dell'
    if (systemManufacturer.includes('lenovo')) productName = 'lenovo'

    const data = this.#configuredRulesByProduct

    const callIpmiPlugin = async function <T>(fn: string): Promise<T> {
      return await xApiHost.$call<T>('call_plugin', 'ipmitool.py', fn, {})
    }

    const ipmiDeviceAvailable = await callIpmiPlugin<string>('is_ipmi_device_available')

    if (!data.some(s => s.vendor.toLowerCase() === productName) || ipmiDeviceAvailable === 'false') {
      logger.info('No IPMI device available or no rules configured for this product, skipping IPMI sensor fetching', {
        productName,
        ipmiDeviceAvailable,
      })
      return {}
    }

    const [stringifiedIpmiSensors, stringifiedIpmiLan] = await Promise.all([
      callIpmiPlugin<string>('get_all_sensors'),
      callIpmiPlugin<string>('get_ipmi_lan'),
    ])
    const ipmiSensors = JSON.parse(stringifiedIpmiSensors) as ReturnedSensorData[]
    const ipmiLan = JSON.parse(stringifiedIpmiLan) as ReturnedSensorData[]
    const ipmiSensorsByDataType: FinalSensorData = {}
    for (const ipmiSensor of [...ipmiSensors, ...ipmiLan]) {
      if (!isRelevantIpmiSensor(ipmiSensor, productName, this.#configuredRulesByProduct)) {
        continue
      }

      addIpmiSensorDataType(ipmiSensor, productName, this.#configuredRulesByProduct)
      const dataType = ipmiSensor.dataType

      const sensorsByDataType = ipmiSensorsByDataType[dataType]
      if (sensorsByDataType === undefined) {
        ipmiSensorsByDataType[dataType] = containsDigit(ipmiSensor.name) ? [] : ipmiSensor
      } else if (!Array.isArray(sensorsByDataType)) {
        // it can happen various sensors have the same name (e.g. temp for dell cpu temp)
        // in such case, consider it as an array instead of single value
        ipmiSensorsByDataType[dataType] = [sensorsByDataType]
      }

      if (Array.isArray(ipmiSensorsByDataType[dataType])) {
        ipmiSensorsByDataType[dataType].push(ipmiSensor)
      }
    }

    addCustomIpmiSensors(ipmiSensorsByDataType, productName)

    return ipmiSensorsByDataType
  }
  /**
   * Unload and stop the plugin.
   */
  async unload(): Promise<void> {
    logger.info('Stopping IPMI sensors server')
    for (const unloadApiMethod of this.#unloadApiMethods) {
      unloadApiMethod()
    }
    this.#unloadApiMethods = []
  }
}

// ============================================================================
// Plugin Factory (exported for xo-server)
// ============================================================================

interface PluginOptions {
  xo: XoApp
}

function pluginFactory({ xo }: PluginOptions): IpmiSensorsPlugin {
  return new IpmiSensorsPlugin(xo)
}
pluginFactory.configurationSchema = configurationSchema
pluginFactory.configurationPresets = configurationPresets

export default pluginFactory
