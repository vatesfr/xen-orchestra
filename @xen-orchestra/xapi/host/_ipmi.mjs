export const IPMI_SENSOR_DATA_TYPE = {
  totalPower: 'totalPower',
  outletTemp: 'outletTemp',
  bmcStatus: 'bmcStatus',
  inletTemp: 'inletTemp',
  cpuTemp: 'cpuTemp',
  fanStatus: 'fanStatus',
  fanSpeed: 'fanSpeed',
  psuStatus: 'psuStatus',
  psuPower: 'psuPower',
  ip: 'ip',
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
    [IPMI_SENSOR_DATA_TYPE.psuPower]: /^psu[0-9]+_pin$/i,
    [IPMI_SENSOR_DATA_TYPE.ip]: /^ip address$/i,
  },
  dell: {
    [IPMI_SENSOR_DATA_TYPE.fanSpeed]: /^fan[0-9]+(a|b)$/i,
    [IPMI_SENSOR_DATA_TYPE.psuPower]: /^voltage [0-9]+$/i,
    [IPMI_SENSOR_DATA_TYPE.psuStatus]: /^ps[0-9]+ pg fail$/i,
    [IPMI_SENSOR_DATA_TYPE.cpuTemp]: /^temp$/i,
    [IPMI_SENSOR_DATA_TYPE.totalPower]: /^pwr consumption$/i,
    [IPMI_SENSOR_DATA_TYPE.inletTemp]: /^inlet temp$/i,
    [IPMI_SENSOR_DATA_TYPE.ip]: /^ip address$/i,
  },
}
export const IPMI_SENSOR_CUSTOM_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME = {
  dell: {
    [IPMI_SENSOR_DATA_TYPE.bmcStatus]: ipmiSensorsByDataType => ({
      event: Object.keys(ipmiSensorsByDataType).length > 0 ? 'ok' : 'ko',
      name: 'bmc status',
      value: '0x00',
    }),
    [IPMI_SENSOR_DATA_TYPE.fanStatus]: ipmiSensorsByDataType => ipmiSensorsByDataType[IPMI_SENSOR_DATA_TYPE.fanSpeed],
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

export const isRelevantIpmiSensor = (data, productName) =>
  IPMI_SENSOR_REGEX_BY_PRODUCT_NAME[productName].test(data.name)

export const containsDigit = str => /\d/.test(str)

export const addIpmiSensorDataType = (data, productName) => {
  const name = data.name
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

export const addCustomIpmiSensors = (ipmiSensorsByDataType, productName) => {
  const customSensorsByDataType = IPMI_SENSOR_CUSTOM_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName]
  for (const dataType in customSensorsByDataType) {
    const fn = customSensorsByDataType[dataType]
    const sensors = fn(ipmiSensorsByDataType)
    ipmiSensorsByDataType[dataType] = Array.isArray(sensors)
      ? sensors.map(sensor => ({ ...sensor, dataType }))
      : { ...sensors, dataType }
  }
}
