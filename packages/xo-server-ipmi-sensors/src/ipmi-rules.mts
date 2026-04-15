import {
  SensorRegexByProduct,
  SensorRegexByDataType,
  ReturnedSensorData,
  IMPI_SENSOR_DATA_TYPE_STRINGS,
  IPMI_SENSOR_DATA_TYPE,
  SensorRegexByProductRaw,
} from './types.mjs'

function getRulesForProduct(productName: string, rulesByProduct: SensorRegexByProduct[]): SensorRegexByDataType {
  const productRules = rulesByProduct.find(rules => rules.vendor.toLowerCase() === productName.toLowerCase())
  return productRules ? productRules.sensorRegexps : {}
}

export function isRelevantIpmiSensor(
  data: ReturnedSensorData,
  productName: string,
  configuredRules: SensorRegexByProduct[]
): boolean {
  const rules = getRulesForProduct(productName, configuredRules)
  return Object.values(rules).some(regex => regex && regex.test(data.name))
}

export function addIpmiSensorDataType(
  data: ReturnedSensorData,
  productName: string,
  configuredRules: SensorRegexByProduct[]
): asserts data is ReturnedSensorData & { dataType: IMPI_SENSOR_DATA_TYPE_STRINGS } {
  const rules = getRulesForProduct(productName, configuredRules)
  for (const [name, regex] of Object.entries(rules)) {
    if (regex && regex.test(data.name)) {
      data.dataType = name as IMPI_SENSOR_DATA_TYPE_STRINGS
      return
    }
  }
  data.dataType = IPMI_SENSOR_DATA_TYPE.unknown as IMPI_SENSOR_DATA_TYPE_STRINGS
}

export function containsDigit(str: string): boolean {
  return /\d/.test(str)
}

function parseRegex(str: string): RegExp | undefined {
  const match = str.match(/^\/(.+)\/([a-z]*)$/i)
  if (!match) return undefined
  const [, pattern, flags] = match
  if (pattern === undefined) return undefined
  return new RegExp(pattern, flags)
}

export function parseRegexConfig(config: SensorRegexByProductRaw[]): SensorRegexByProduct[] {
  return config.map(product => ({
    vendor: product.vendor,
    sensorRegexps: Object.fromEntries(
      Object.entries(product.sensorRegexps).map(([key, value]) => [
        key,
        typeof value === 'string' ? parseRegex(value) : undefined,
      ])
    ) as SensorRegexByDataType,
  }))
}
