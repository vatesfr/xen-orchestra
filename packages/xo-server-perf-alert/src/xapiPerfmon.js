// @ts-check

import { asyncEach } from '@vates/async-each'
import { MonitorStrategy } from './Strategy.js'

/**
 * @import {XoAlarm, XoHost, XoSr, XoVm} from "@vates/types"
 * @import { AlarmRuleSet } from "./Rules.js"
 *
 */

const OTHER_PROPERTY_NAME = {
  host: 'otherConfig',
  SR: 'other_config',
  VM: 'other',
}
export class XapiPerfmon extends MonitorStrategy {
  #xo
  /**
   * @type {AlarmRuleSet}
   */
  #rules

  #alarms = []
  /**
   *
   * @param {*} xo
   * @param {AlarmRuleSet} rules
   */
  constructor(xo, rules) {
    super()
    this.#xo = xo
    this.#rules = rules
    this.updateObjectsPerfmon = this.updateObjectsPerfmon.bind(this)
  }

  async watch(onChanges, delay) {
    await this.updateObjectsPerfmon(this.#xo.getObjects())

    this.#xo.objects.on('add', this.updateObjectsPerfmon)
    this.#xo.on('update', this.updateObjectsPerfmon)
    // nothing to do on remove, the alert is gone with the object
  }

  async stopWatch() {
    this.#xo.objects.removeListener('add', this.updateObjectsPerfmon)
    this.#xo.objects.removeListener('update', this.updateObjectsPerfmon)
  }

  /**
   *
   * @param {XoHost|XoSr|XoVm} xoObject
   */
  #getPerfmon(xoObject) {
    return xoObject[OTHER_PROPERTY_NAME[xoObject.type]].perfmon
  }

  /**
   *
   * @param {XoHost|XoSr|XoVm>} xoObject
   * @param {Array<AlertDefinition>} alertDefinitions
   * @returns {string|null}
   */

  computePerfmon(xoObject, alertDefinitions) {
    if (alertDefinitions.length === 0) {
      return null
    }

    let perfmon = '<config>'
    const TO_PERFMON_TYPE = {
      cpuUsage: 'cpu_usage',
      memoryUsage: 'mem_usage',
      storageUsage: 'fs_usage',
    }

    const TO_SENSE = {
      '<': 'low',
      '>': 'high',
    }

    let hasPerfMon = false
    for (const definition of alertDefinitions) {
      let level = Number(definition.triggerLevel) // ensure number
      let name
      let comparator

      // perfmon don't have rule with memory_usage
      if (definition.variableName === 'memoryUsage' && xoObject.type === 'host') {
        name = 'memory_free_kib'
        level = Math.round((xoObject.memory.size * (100 - level)) / 100)
        comparator = definition.comparator === '>' ? 'low' : 'high'
      } else {
        name = TO_PERFMON_TYPE[definition.variableName]
        comparator = TO_SENSE[definition.comparator]
      }

      if (name === undefined) {
        continue
      }
      perfmon += `
                <variable> 
                    <name value="${name}"/>
                    <alarm_trigger_level value="${level}"/>
                    <alarm_trigger_sense value="${comparator}"/>
                </variable>
                `
      hasPerfMon = true
      // <variable> <name value="cpu_usage"/> <alarm_trigger_level value="0.5"/> </variable>
    }
    perfmon += '</config>'
    return hasPerfMon ? perfmon : null
  }
  /**
   *
   * @param {XoHost|XoSr|XoVm} xoObject
   * @param {string|null} perfmon
   */
  async #setPerfmon(xoObject, perfmon) {
    await this.#xo
      .getXapi(xoObject.uuid)
      .setFieldEntry(xoObject.type, xoObject._xapiRef, 'other_config', 'perfmon', perfmon)
  }

  async updateObjectsPerfmon(xoObjects) {
    return asyncEach(Object.values(xoObjects), xoObject => {
      if (!['host', 'VM'].includes(xoObject.type)) {
        return
      }
      process.stdout.write('.')
      const definitions = this.#rules.getObjectAlerts(xoObject)

      const perfmon = this.computePerfmon(xoObject, definitions)
      const current = this.#getPerfmon(xoObject)
      if (perfmon !== current) {
        return this.#setPerfmon(xoObject, perfmon)
      }
    })
  }

  async updateDefinition() {
    await this.init()
  }

  /**
   * @returns {Promise<Array<XoAlarm>>}
   */
  async computeActiveAlarms() {
    return []
  }

  async clearAlarms() {
    const alarms = await this.computeActiveAlarms()
    asyncEach(alarms, async alarm => {})
  }
}
