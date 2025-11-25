// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 */

/**
 *
 * @param {XoSr} sr
 * @returns {boolean}
 */
function isSrWritable(sr) {
  return sr !== undefined && sr.content_type !== 'iso' && sr.size > 0
}

export class MonitorRule {
  /**
   * @type {'>' | '<'}
   */
  comparator

  /**
   * @type {'host' | 'SR' | 'VM'}
   */
  objectType
  /**
   * @type {number}
   */
  triggerLevel

  /**
   * @type {number}
   */
  triggerPeriod
  /**
   * @type {boolean}
   */
  smartMode

  /**
   * @type {boolean}
   */
  excludeUuids

  /**
   * @type {Array<string>}
   */
  uuids

  /**
   * @type {'cpuUsage' | 'memoryUsage' | 'storageUsage'}
   */
  variableName

  /**
   * @returns {string}
   */
  get id() {
    return `${this.objectType.toLocaleLowerCase()}|${this.variableName}|${this.triggerLevel}`
  }
  /** */
  constructor({
    alarmTriggerLevel,
    alarmTriggerPeriod = 60,
    excludeUuids,
    comparator,
    objectType,
    smartMode,
    uuids,
    variableName,
  }) {
    this.triggerLevel = alarmTriggerLevel
    this.triggerPeriod = alarmTriggerPeriod
    this.excludeUuids = excludeUuids
    this.comparator = comparator
    this.objectType = objectType
    this.smartMode = smartMode
    this.uuids = uuids
    this.variableName = variableName
  }

  /**
   *
   * @param {XoVm|XoHost|XoSr} xoObject
   * @returns {boolean}
   */
  isObjectAffected(xoObject) {
    if (this.smartMode || this.excludeUuids) {
      if (xoObject.type !== this.objectType) {
        return false
      }
      if (xoObject.type === 'SR' && !isSrWritable(xoObject)) {
        return false
      }
      if (xoObject.type === 'VM' || xoObject.type === 'host') {
        if (xoObject.power_state !== 'Running') {
          return false
        }
      }
      if (this.excludeUuids && this.uuids.includes(xoObject.uuid)) {
        return false
      }
    } else {
      if (!this.uuids.includes(xoObject.uuid)) {
        return false
      }
    }

    return true
  }

  /**
   *
   * @param {number} value
   */
  isTriggeredBy(value) {
    switch (this.comparator) {
      case '<':
        return value < this.triggerLevel
      case '>':
        return value > this.triggerLevel
    }
  }
}

export class MonitorRuleSet {
  rules = new Set()
  constructor(configuration) {
    for (const definition of configuration.hostMonitors ?? []) {
      const monitorRule = new MonitorRule({ ...definition, objectType: 'host' })
      this.rules.add(monitorRule)
    }
    for (const definition of configuration.vmMonitors ?? []) {
      const monitorRule = new MonitorRule({ ...definition, objectType: 'VM' })
      this.rules.add(monitorRule)
    }
    for (const definition of configuration.srMonitors ?? []) {
      const monitorRule = new MonitorRule({ ...definition, objectType: 'SR' })
      this.rules.add(monitorRule)
    }
  }

  /**
   *
   * @param {XoVm|XoHost|XoSr} xoObject
   * @returns {boolean}
   */
  isObjectAffected(xoObject) {
    for (const definition of this.rules) {
      if (definition.isObjectAffected(xoObject)) {
        return true
      }
    }
    return false
  }

  /**
   *
   * @param {XoVm|XoHost|XoSr} xoObject
   * @returns {Array<MonitorRule>}
   */
  getObjectAlerts(xoObject) {
    const definitions = []
    for (const definition of this.rules) {
      if (definition.isObjectAffected(xoObject)) {
        definitions.push(definition)
      }
    }
    return definitions
  }

  /**
   * @returns {number}
   */
  getMaxPeriod() {
    let max = 60

    this.rules.forEach(rule => {
      max = Math.max(max, rule.triggerPeriod)
    })
    return max
  }
}
