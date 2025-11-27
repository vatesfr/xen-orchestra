// @ts-check

import { asyncEach } from '@vates/async-each'
import { Alarm, MonitorStrategy } from './Strategy.js'

/**
 * @import {XoMessage, XoHost, XoSr, XoVm} from "@vates/types"
 * @import { MonitorRuleSet } from "./Rules.js"
 *
 */

const OTHER_PROPERTY_NAME = {
  host: 'otherConfig',
  SR: 'other_config',
  VM: 'other',
}
const TO_PERFMON_TYPE = {
  cpuUsage: 'cpu_usage',
  memoryUsage: 'mem_usage',
  storageUsage: 'fs_usage',
}
const TO_VARIABLE_NAME = {
  cpu_usage: 'cpuUsage',
  mem_usage: 'memoryUsage',
  fs_usage: 'storageUsage',
}

const TO_SENSE = {
  '<': 'low',
  '>': 'high',
}
export class XapiPerfmon extends MonitorStrategy {
  #xo
  /**
   * @type {MonitorRuleSet}
   */
  #rules

  /**
   * @type {NodeJS.Timeout|undefined}
   */
  #watchInterval

  /**
   *
   * @param {*} xo
   * @param {MonitorRuleSet} rules
   */
  constructor(xo, rules) {
    super()
    this.#xo = xo
    this.#rules = rules
    this.updateObjectsPerfmon = this.updateObjectsPerfmon.bind(this)
  }

  /**
   *
   * @returns {Promise<Array<Alarm>>}
   */
  async computeActiveAlarms() {
    const alarms = []
    /**
     * @type {Array<XoMessage>}
     */
    // @todo: filter by messange name to ensure this is an alarm
    const xapiAlarms = this.#xo.getObjectsByType('message')
    for (const xapiAlarm of xapiAlarms) {
      let target
      try {
        target = this.#xo.getObject(xapiAlarm.$object)
      } catch (error) {
        // @todo maybe force close ?
        continue
      }

      const ALARM_BODY_REGEX =
        /^value:\s*(Infinity|NaN|-Infinity|\d+(?:\.\d+)?)\s*config:\s*<variable>\s*<name value="(.*?)"/

      const [, alarmValue, alarmName] = xapiAlarm.body.match(ALARM_BODY_REGEX) ?? []
      if (!alarmName) {
        continue
      }
      let variableName
      if (target.type === 'host' && alarmName === 'memory_free_kib') {
        variableName = 'memoryUsage'
      } else {
        variableName = TO_VARIABLE_NAME[alarmName]
      }
      if (variableName === undefined) {
        // an alarm  type not handled by perf monitor
        continue
      }

      const rule = this.#rules.getObjectAlerts(target).find(rule => rule.variableName === variableName)
      if (rule === undefined) {
        // an alarm not handled by the current rules of perf monitor
        continue
      }

      const value = parseFloat(alarmValue ?? '-1')
      alarms.push(new Alarm({ rule, target, value }))
    }
    return alarms
  }
  /**
   *
   * @param {*} onChanges
   * @param {*} delay
   */
  async watch(onChanges, delay) {
    await this.updateObjectsPerfmon(this.#xo.getObjects())

    this.#xo.objects.on('add', this.updateObjectsPerfmon)
    this.#xo.on('update', this.updateObjectsPerfmon)
    const changes = await this.computeAlarmChanges()
    onChanges(changes)
    this.#watchInterval = setInterval(async () => {
      const changes = await this.computeAlarmChanges()
      onChanges(changes)
    }, delay)
  }

  async stopWatch() {
    clearInterval(this.#watchInterval)
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

    let hasPerfMon = false
    for (const definition of alertDefinitions) {
      let level = Number(definition.triggerLevel) // ensure number
      let name
      let comparator

      // perfmon don't have rule with memory_usage
      if (definition.variableName === 'memoryUsage' && xoObject.type === 'host') {
        name = 'memory_free_kib'
        level = Math.round((xoObject.memory.size * (100 - level)) / 100 / 1024)
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

  /**
   *
   * @param {XoHost|XoVm} xoObjects
   * @returns
   */
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
        // @todo clear any existing alarm on this object
        return this.#setPerfmon(xoObject, perfmon)
      }
    })
  }
}
