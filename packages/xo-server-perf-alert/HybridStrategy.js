import { RrdHostVm } from './RrdHostVm.js'
import { MonitorStrategy } from './Strategy.js'
import { XapiSrQuery } from './XapiSrQuery.js'

export class HybridStrategy extends MonitorStrategy {
  /**
   * @type {XapiSrQuery}
   */
  #sr

  /**
   * @type {RrdHostVm}
   */
  #hostVm
  constructor(xo, rules) {
    super()
    this.#sr = new XapiSrQuery(xo, rules)
    this.#hostVm = new RrdHostVm(xo, rules)
  }

  /**
   *
   * @param {(changes:AlarmChanges)=>Promise<void>} onChanges
   * @returns {Promise<void>}
   */
  watch(onChanges) {
    return this.#hostVm.watch(async rrdChanges => {
      const srChanges = await this.#sr.computeAlarmChanges()

      onChanges({
        newAlarms: new Map([...rrdChanges.newAlarms, ...srChanges.newAlarms]),
        closedAlarms: new Map([...rrdChanges.closedAlarms, ...srChanges.closedAlarms]),
        activeAlarms: new Map([...rrdChanges.activeAlarms, ...srChanges.activeAlarms]),
      })
    })
  }
  /**
   *
   * @returns {Promise<void>}
   */
  stopWatch() {
    return this.#hostVm.stopWatch()
  }
}
