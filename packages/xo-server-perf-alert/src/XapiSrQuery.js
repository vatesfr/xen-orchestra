/**
 * @import { MonitorRuleSet} from "./Rules.js"
 */

import { Alarm, MonitorStrategy } from './Strategy.js'

/**
 * @description Query the xapi object to check the storage repository usage
 *
 * The same approach should be usabel for slow moving metrics like VM storage,
 * and maybe vm/host memory
 */
export class XapiSrQuery extends MonitorStrategy {
  #xo

  /**
   * @type {MonitorRuleSet}
   */
  #rules

  /**
   *
   * @param {*} xo
   * @param {MonitorRuleSet} rules
   */
  constructor(xo, rules) {
    super()
    this.#rules = rules
    this.#xo = xo
  }

  async computeActiveAlarms() {
    // make queries host by host, that way we don't need to cache RRD
    /**
     * @type {Array<XoHost>}
     */
    const srs = Object.values(this.#xo.objects.indexes.type.SR ?? {})

    const alarms = []
    for (const sr of srs) {
      const srRules = this.#rules.getObjectAlerts(sr)
      for (const srRule of srRules) {
        const value = Math.round((sr.physical_usage * 100) / sr.size)
        if (srRule.isTriggeredBy(value)) {
          alarms.push(new Alarm({ rule: srRule, target: sr, value }))
        }
      }
    }
    return alarms
  }
}
