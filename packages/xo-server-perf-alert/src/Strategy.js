// @ts-check

/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 * @import {AlarmRule, AlarmRuleSet} from "./Rules.js"
 */

export class Alarm {
  /**
   * @type {AlarmRule}
   */
  rule

  /**
   * @type {number}
   */
  value

  /**
   * @type {XoHost|XoSr|XoVm}
   */
  target

  /** @returns {string} */
  get id() {
    return `${this.rule.id}|${this.target.id}`
  }
  /**
   *
   * @param {object} alarmDefinition Defition of the alarm
   * @param {AlarmRule} alarmDefinition.rule
   * @param {XoHost|XoSr|XoVm} alarmDefinition.target
   * @param {number} alarmDefinition.value
   */
  constructor({ rule, target, value }) {
    this.rule = rule
    this.target = target
    this.value = value
  }
}

/**
 * @typedef {{
 *   newAlarms: Map<Alarm['id'], Alarm>,
 *   closedAlarms: Map<Alarm['id'], Alarm>,
 *   activeAlarms: Map<Alarm['id'], Alarm>
 * }} AlarmChanges
 */

export /* Abstract */ class MonitorStrategy {
  /**
   * @type {Map<Alarm['id'],Alarm>}
   */
  #activeAlarms = new Map()

  /**
   * Computes changes between current and previous alarms.
   *
   * @returns {Promise<AlarmChanges>} An object containing maps of new, closed, and active alarms.
   */
  async computeAlarmChanges() {
    const current = await this.computeActiveAlarms()
    const previous = new Map(this.#activeAlarms)
    /**
     * @type {Map<Alarm['id'],Alarm>}
     */
    const activeAlarms = new Map()
    /**
     * @type {Map<Alarm['id'],Alarm>}
     */
    const newAlarms = new Map()
    /**
     * @type {Map<Alarm['id'],Alarm>}
     */
    const closedAlarms = new Map()
    for (const alarm of current) {
      if (!previous.has(alarm.id)) {
        newAlarms.set(alarm.id, alarm)
      } else {
        activeAlarms.set(alarm.id, alarm)
      }
      // mark this alarm as handled
      previous.delete(alarm.id)
    }

    previous.forEach(alarm => {
      closedAlarms.set(alarm.id, alarm)
    })
    this.#activeAlarms = new Map([...newAlarms, ...activeAlarms])

    return { newAlarms, closedAlarms, activeAlarms }
  }

  /**
   *
   * @returns {Promise<Array<Alarm>>}
   */
  async computeActiveAlarms() {
    return Promise.reject(new Error('Not Implemented'))
  }

  /**
   *
   * @param {(changes:AlarmChanges)=>Promise<void>} onChanges
   * @returns {Promise<void>}
   */
  watch(onChanges) {
    return Promise.reject(new Error('Not Implemented'))
  }

  /**
   *
   * @returns {Promise<void>}
   */
  stopWatch() {
    return Promise.reject(new Error('Not Implemented'))
  }
}
