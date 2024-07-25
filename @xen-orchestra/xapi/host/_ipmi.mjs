import TTLCache from '@isaacs/ttlcache'

const IPMI_CACHE_TTL = 6e4

export const IPMI_SENSOR_DATA_TYPE = {
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

export const IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME = {
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

export const IPMI_CACHE = new TTLCache({
  ttl: IPMI_CACHE_TTL,
  max: 1000,
})

export const isRelevantIpmiSensor = (data, productName) =>
  IPMI_SENSOR_REGEX_BY_PRODUCT_NAME[productName].test(data.Name)

export const containsDigit = str => /\d/.test(str)

export const addIpmiSensorDataType = (data, productName) => {
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
