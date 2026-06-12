/**
 * XO Server IPMI Sensors Plugin
 *
 * This plugin exposes IPMI sensor data from XenServer/XCP-ng hosts.
 * It collects vendor-specific sensor readings and categorizes them
 * using configurable regex rules for supported products.
 */

import type { XoApp, XoHost } from '@vates/types'
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
  AvailableIpmiSensors,
} from './types.mjs'
import TTLCache from '@isaacs/ttlcache'
import { createIpmiRestRoutes } from './rest-api.mjs'

// ============================================================================
// Constants
// ============================================================================
const IPMI_CACHE_TTL = 6e4
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
export class IpmiSensorsPlugin {
  #configuredRulesByProduct: SensorRegexByProduct[]
  readonly xo: XoApp
  // cache is type any because it handles itself
  #cache: TTLCache<any, any> = new TTLCache({
    ttl: IPMI_CACHE_TTL,
    max: 1000,
  })

  #unloadApiMethods: (() => void)[] = []
  constructor(xo: XoApp) {
    this.xo = xo
    this.#configuredRulesByProduct = []
    logger.info('Plugin initialized')
  }

  /**
   * Configure the plugin with the provided configuration.
   */
  async configure(configuration: PluginConfiguration): Promise<void> {
    this.#configuredRulesByProduct = parseRegexConfig(configuration.vendors)
    logger.debug('Plugin configured')
  }

  /**
   * Load and start the plugin.
   */
  async load(): Promise<void> {
    this.#unloadApiMethods.push(
      this.xo.addApiMethod<[{ host: XoHost }], FinalSensorData>(
        'ipmi-sensors.get_ipmi_sensors',
        this.getIpmiSensors.bind(this),
        {
          resolve: { host: ['id', 'host', 'administrate'] },
          params: { id: { type: 'string' } },
        }
      ),
      // replacement for the method in packages/xo-server/src/api/host.mjs
      this.xo.addApiMethod<[{ host: XoHost }], FinalSensorData>('host.getIpmiSensors', this.getIpmiSensors.bind(this), {
        resolve: { host: ['id', 'host', 'administrate'] },
        params: { id: { type: 'string' } },
      }),
      this.xo.registerRestRoutes(createIpmiRestRoutes(this))
    )
  }

  async #fetchRawSensors(callIpmiPlugin: <T>(fn: string) => Promise<T>): Promise<ReturnedSensorData[]> {
    const [stringifiedIpmiSensors, stringifiedIpmiLan] = await Promise.all([
      callIpmiPlugin<string>('get_all_sensors'),
      callIpmiPlugin<string>('get_ipmi_lan'),
    ])
    return [
      ...(JSON.parse(stringifiedIpmiSensors) as ReturnedSensorData[]),
      ...(JSON.parse(stringifiedIpmiLan) as ReturnedSensorData[]),
    ]
  }

  #getIpmiContext(host: XoHost): {
    productName: string
    systemManufacturer: string
    callIpmiPlugin: <T>(fn: string) => Promise<T>
  } {
    const xApiHost = this.xo.getXapiObject<XoHost>(host, 'host')
    const biosStrings = xApiHost.bios_strings
    let productName = biosStrings['system-product-name']?.toLowerCase() || ''
    const systemManufacturer = biosStrings['system-manufacturer']?.toLowerCase() || ''
    // Olivier.L request: consider all DELL and Lenovo servers in the same way
    if (systemManufacturer.includes('dell')) productName = 'dell'
    if (systemManufacturer.includes('lenovo')) productName = 'lenovo'

    const callIpmiPlugin = async <T,>(fn: string): Promise<T> => {
      return await xApiHost.$xapi.call<T>(this.#cache, 'host.call_plugin', xApiHost.$ref, 'ipmitool.py', fn, {})
    }

    return { productName, systemManufacturer, callIpmiPlugin }
  }

  async getIpmiSensors({ host }: { host: XoHost }): Promise<FinalSensorData> {
    const { productName, callIpmiPlugin } = this.#getIpmiContext(host)

    const data = this.#configuredRulesByProduct

    const ipmiDeviceAvailable = await callIpmiPlugin<string>('is_ipmi_device_available')

    if (!data.some(s => s.vendor.toLowerCase() === productName) || ipmiDeviceAvailable === 'false') {
      logger.info('No IPMI device available or no rules configured for this product, skipping IPMI sensor fetching', {
        productName,
        ipmiDeviceAvailable,
      })
      return {}
    }

    const sensors = await this.#fetchRawSensors(callIpmiPlugin)
    const ipmiSensorsByDataType: FinalSensorData = {}
    for (const ipmiSensor of sensors) {
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
      const bucket = ipmiSensorsByDataType[dataType]!
      if (Array.isArray(bucket)) {
        bucket.push(ipmiSensor)
      }
    }

    addCustomIpmiSensors(ipmiSensorsByDataType, productName)

    return ipmiSensorsByDataType
  }

  async getAvailableIpmiSensors({ host }: { host: XoHost }): Promise<AvailableIpmiSensors> {
    const { productName, systemManufacturer, callIpmiPlugin } = this.#getIpmiContext(host)

    const ipmiDeviceAvailable = (await callIpmiPlugin<string>('is_ipmi_device_available')) !== 'false'
    if (!ipmiDeviceAvailable) {
      return { productName, systemManufacturer, ipmiDeviceAvailable: false, sensors: [] }
    }

    const sensors = await this.#fetchRawSensors(callIpmiPlugin)
    for (const sensor of sensors) {
      // tags `sensor.dataType` with the matching data type, or 'unknown'
      addIpmiSensorDataType(sensor, productName, this.#configuredRulesByProduct)
    }

    return {
      productName,
      systemManufacturer,
      ipmiDeviceAvailable: true,
      sensors: sensors as AvailableIpmiSensors['sensors'],
    }
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
