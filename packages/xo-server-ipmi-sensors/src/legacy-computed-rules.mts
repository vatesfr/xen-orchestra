import { FinalSensorData, IMPI_SENSOR_DATA_TYPE_STRINGS, IPMI_SENSOR_DATA_TYPE, ReturnedSensorData } from './types.mjs'

type CUSTOM_SENSOR_BY_DATA_TYPE_FN = (
  ipmiSensorsByDataType: FinalSensorData
) => Partial<Record<IMPI_SENSOR_DATA_TYPE_STRINGS, ReturnedSensorData | ReturnedSensorData[]>>
type CUSTOM_SENSOR_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME = Record<
  string,
  Partial<Record<IMPI_SENSOR_DATA_TYPE_STRINGS, CUSTOM_SENSOR_BY_DATA_TYPE_FN>>
>

export const IPMI_SENSOR_CUSTOM_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME: CUSTOM_SENSOR_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME =
  {
    dell: {
      [IPMI_SENSOR_DATA_TYPE.bmcStatus]: (ipmiSensorsByDataType: FinalSensorData) => ({
        event: Object.keys(ipmiSensorsByDataType).length > 0 ? 'ok' : 'ko',
        name: 'bmc status',
        value: '0x00',
      }),
      [IPMI_SENSOR_DATA_TYPE.fanStatus]: (ipmiSensorsByDataType: FinalSensorData) =>
        ipmiSensorsByDataType[IPMI_SENSOR_DATA_TYPE.fanSpeed as IMPI_SENSOR_DATA_TYPE_STRINGS],
    },
    lenovo: {
      [IPMI_SENSOR_DATA_TYPE.bmcStatus]: (ipmiSensorsByDataType: FinalSensorData) => ({
        event: Object.keys(ipmiSensorsByDataType).length > 0 ? 'ok' : 'ko',
        name: 'bmc status',
        value: '0x00',
      }),
      [IPMI_SENSOR_DATA_TYPE.fanStatus]: (ipmiSensorsByDataType: FinalSensorData) => {
        let fanStatuses = ipmiSensorsByDataType[IPMI_SENSOR_DATA_TYPE.fanSpeed as IMPI_SENSOR_DATA_TYPE_STRINGS] ?? []
        if (!Array.isArray(fanStatuses)) fanStatuses = [fanStatuses]
        return fanStatuses
          .filter((s: { event: string; value: string }) => s.event === 'ok' && /\d+\s*rpm/i.test(s.value))
          .map((s: { event: string; value: string }) => ({ ...s, rpm: parseInt(s.value, 10) }))
      },
    },
  }

export const addCustomIpmiSensors = (ipmiSensorsByDataType: FinalSensorData, productName: string) => {
  const customSensorsByDataType = IPMI_SENSOR_CUSTOM_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME[productName]
  for (const dataType in customSensorsByDataType) {
    const dataTypeKey = dataType as IMPI_SENSOR_DATA_TYPE_STRINGS
    const fn = customSensorsByDataType[dataTypeKey]! // we know this exists since we're iterating over the keys of customSensorsByDataType
    const sensors = fn(ipmiSensorsByDataType)
    const parsedSensor = Array.isArray(sensors)
      ? sensors.map(sensor => ({ ...sensor, dataType }))
      : { ...sensors, dataType }
    ipmiSensorsByDataType[dataTypeKey] = parsedSensor as FinalSensorData[IMPI_SENSOR_DATA_TYPE_STRINGS]
  }
}
