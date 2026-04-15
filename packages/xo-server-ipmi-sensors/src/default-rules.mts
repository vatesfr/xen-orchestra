import { SensorRegexByProduct, IPMI_SENSOR_DATA_TYPE } from './types.mjs'

export const DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME: SensorRegexByProduct[] = [
  {
    vendor: 'mona_1.44gg',
    sensorRegexps: {
      [IPMI_SENSOR_DATA_TYPE.totalPower]: /^total_power$/i,
      [IPMI_SENSOR_DATA_TYPE.outletTemp]: /^outlet_temp$/i,
      [IPMI_SENSOR_DATA_TYPE.bmcStatus]: /^bmc_status$/i,
      [IPMI_SENSOR_DATA_TYPE.inletTemp]: /^psu_inlet_temp$/i,
      [IPMI_SENSOR_DATA_TYPE.cpuTemp]: /^cpu[0-9]+_temp$/i,
      [IPMI_SENSOR_DATA_TYPE.fanStatus]: /^fan[0-9]+_status$/i,
      [IPMI_SENSOR_DATA_TYPE.fanSpeed]: /^fan[0-9]+_r_speed$/i,
      [IPMI_SENSOR_DATA_TYPE.psuStatus]: /^psu[0-9]+_status$/i,
      [IPMI_SENSOR_DATA_TYPE.psuPower]: /^psu[0-9]+_pin$/i,
      [IPMI_SENSOR_DATA_TYPE.ip]: /^ip address$/i,
    },
  },
  {
    vendor: 'dell',
    sensorRegexps: {
      [IPMI_SENSOR_DATA_TYPE.fanSpeed]: /^fan[0-9]+(a|b)$/i,
      [IPMI_SENSOR_DATA_TYPE.psuPower]: /^voltage [0-9]+$/i,
      [IPMI_SENSOR_DATA_TYPE.psuStatus]: /^ps[0-9]+ pg fail$/i,
      [IPMI_SENSOR_DATA_TYPE.cpuTemp]: /^temp$/i,
      [IPMI_SENSOR_DATA_TYPE.totalPower]: /^pwr consumption$/i,
      [IPMI_SENSOR_DATA_TYPE.inletTemp]: /^inlet temp$/i,
      [IPMI_SENSOR_DATA_TYPE.ip]: /^ip address$/i,
    },
  },
  {
    vendor: 'lenovo',
    sensorRegexps: {
      [IPMI_SENSOR_DATA_TYPE.fanSpeed]: /^fan\s*\d+(?:\s+(?:front|rear))?\s+tach$/i,
      [IPMI_SENSOR_DATA_TYPE.outletTemp]: /^exhaust temp$/i,
      [IPMI_SENSOR_DATA_TYPE.psuPower]: /^psu\s*\d+\s+(ac in pwr|dc out pwr)$/i,
      [IPMI_SENSOR_DATA_TYPE.psuStatus]:
        /^(psu\s*\d+(?:\s+(?:failure|pf failure|in failure|i2c dc fai))?|power supply\s*\d+)$/i,
      [IPMI_SENSOR_DATA_TYPE.cpuTemp]: /^cpu\s*\d+\s*temp$/i,
      [IPMI_SENSOR_DATA_TYPE.totalPower]: /^(sys power|system power|power consumption)$/i,
      [IPMI_SENSOR_DATA_TYPE.inletTemp]: /^(ambient temp|inlet temp)$/i,
      [IPMI_SENSOR_DATA_TYPE.ip]: /^ip address$/i,
    },
  },
]

function stringifyRegexConfigFull(config: SensorRegexByProduct[]) {
  return config.map(product => ({
    vendor: product.vendor,
    sensorRegexps: Object.fromEntries(
      Object.entries(product.sensorRegexps).map(([key, value]) => [
        key,
        value instanceof RegExp ? value.toString() : value,
      ])
    ),
  }))
}

export const DEFAULT_IPMI_SENSOR_REGEX_CONFIG_STRINGIFIED = stringifyRegexConfigFull(
  DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME
)
