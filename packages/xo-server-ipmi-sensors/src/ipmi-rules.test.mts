import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { addIpmiSensorDataType, isRelevantIpmiSensor, parseRegexConfig } from './ipmi-rules.mjs'
import { DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME } from './default-rules.mjs'
import { SensorRegexByProductRaw, ReturnedSensorData, IPMI_SENSOR_DATA_TYPE } from './types.mjs'

describe('ipmi-rules', () => {
  describe('parseRegexConfig', () => {
    it('should parse raw config into RegExp config', () => {
      const rawConfig: SensorRegexByProductRaw[] = [
        {
          vendor: 'test',
          sensorRegexps: {
            fanSpeed: '/^fan[0-9]+$/i',
            cpuTemp: '/^cpu_temp$/',
          },
        },
      ]

      const parsed = parseRegexConfig(rawConfig)
      assert.strictEqual(parsed.length, 1)
      const firstProduct = parsed[0]!
      assert.strictEqual(firstProduct.vendor, 'test')
      assert(firstProduct.sensorRegexps.fanSpeed instanceof RegExp)
      assert.strictEqual(firstProduct.sensorRegexps.fanSpeed?.source, '^fan[0-9]+$')
      assert.strictEqual(firstProduct.sensorRegexps.fanSpeed?.flags, 'i')
      assert(firstProduct.sensorRegexps.cpuTemp instanceof RegExp)
      assert.strictEqual(firstProduct.sensorRegexps.cpuTemp?.source, '^cpu_temp$')
    })

    it('should handle undefined regex values', () => {
      const rawConfig: SensorRegexByProductRaw[] = [
        {
          vendor: 'test',
          sensorRegexps: {
            fanSpeed: undefined,
          },
        },
      ]

      const parsed = parseRegexConfig(rawConfig)
      const firstProduct = parsed[0]!
      assert.strictEqual(firstProduct.sensorRegexps.fanSpeed, undefined)
    })
  })

  describe('isRelevantIpmiSensor', () => {
    const mockRules = DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME

    it('should return true for relevant sensors', () => {
      const sensor: ReturnedSensorData = { name: 'fan1_r_speed', value: '1000', event: 'ok' }
      assert.strictEqual(isRelevantIpmiSensor(sensor, 'mona_1.44gg', mockRules), true)
    })

    it('should return false for irrelevant sensors', () => {
      const sensor: ReturnedSensorData = { name: 'unknown_sensor', value: '0', event: 'ok' }
      assert.strictEqual(isRelevantIpmiSensor(sensor, 'mona_1.44gg', mockRules), false)
    })

    it('should return false for unknown product', () => {
      const sensor: ReturnedSensorData = { name: 'fan1_r_speed', value: '1000', event: 'ok' }
      assert.strictEqual(isRelevantIpmiSensor(sensor, 'unknown', mockRules), false)
    })

    it('should be case insensitive for product name', () => {
      const sensor: ReturnedSensorData = { name: 'fan1_r_speed', value: '1000', event: 'ok' }
      assert.strictEqual(isRelevantIpmiSensor(sensor, 'MONA_1.44GG', mockRules), true)
    })
  })

  describe('addIpmiSensorDataType', () => {
    const mockRules = DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME

    it('should add correct dataType for matching sensors', () => {
      const sensor: ReturnedSensorData = { name: 'fan1_r_speed', value: '1000', event: 'ok' }
      addIpmiSensorDataType(sensor, 'mona_1.44gg', mockRules)
      assert.strictEqual(sensor.dataType, IPMI_SENSOR_DATA_TYPE.fanSpeed)
    })

    it('should add unknown dataType for non-matching sensors', () => {
      const sensor: ReturnedSensorData = { name: 'unknown_sensor', value: '0', event: 'ok' }
      addIpmiSensorDataType(sensor, 'mona_1.44gg', mockRules)
      assert.strictEqual(sensor.dataType, IPMI_SENSOR_DATA_TYPE.unknown)
    })

    it('should add unknown dataType for unknown product', () => {
      const sensor: ReturnedSensorData = { name: 'fan1_r_speed', value: '1000', event: 'ok' }
      addIpmiSensorDataType(sensor, 'unknown', mockRules)
      assert.strictEqual(sensor.dataType, IPMI_SENSOR_DATA_TYPE.unknown)
    })

    it('should match first regex in order', () => {
      // For dell, both fanSpeed and psuPower could potentially match, but fanSpeed comes first
      const sensor: ReturnedSensorData = { name: 'fan1a', value: '1000', event: 'ok' }
      addIpmiSensorDataType(sensor, 'dell', mockRules)
      assert.strictEqual(sensor.dataType, IPMI_SENSOR_DATA_TYPE.fanSpeed)
    })

    it('should handle case insensitive matching', () => {
      const sensor: ReturnedSensorData = { name: 'FAN1_R_SPEED', value: '1000', event: 'ok' }
      addIpmiSensorDataType(sensor, 'mona_1.44gg', mockRules)
      assert.strictEqual(sensor.dataType, IPMI_SENSOR_DATA_TYPE.fanSpeed)
    })
  })
})
