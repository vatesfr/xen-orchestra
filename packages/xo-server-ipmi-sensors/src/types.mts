// ============================================================================
// Types
// ============================================================================
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
export type IMPI_SENSOR_DATA_TYPE_STRINGS = keyof typeof IPMI_SENSOR_DATA_TYPE

export type SensorRegexByDataType = {
  [key in keyof typeof IPMI_SENSOR_DATA_TYPE]?: RegExp
}
export type SensorRegexByDataTypeRaw = {
  [key in keyof typeof IPMI_SENSOR_DATA_TYPE]?: string
}
export type SensorRegexByProductRaw = {
  vendor: string
  sensorRegexps: SensorRegexByDataTypeRaw
}

export interface PluginConfiguration {
  vendors: SensorRegexByProductRaw[]
}

export type SensorRegexByProduct = {
  vendor: string
  sensorRegexps: SensorRegexByDataType
}

export type ReturnedSensorData = {
  name: string
  value: string
  event: string
  dataType?: IMPI_SENSOR_DATA_TYPE_STRINGS
}

export type FinalSensorData = Partial<Record<IMPI_SENSOR_DATA_TYPE_STRINGS, ReturnedSensorData | ReturnedSensorData[]>>
