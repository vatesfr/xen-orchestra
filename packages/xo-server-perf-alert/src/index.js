/**
 * @import {XoHost, XoSr, XoVm} from "@vates/types"
 * @import {AlarmChanges, MonitorStrategy} from "./Strategy.js"
 */

import { createLogger } from '@xen-orchestra/log'
import { MonitorRuleSet } from './Rules.js'

import templates from './templates/index.js'
import { HybridStrategy } from './HybridStrategy.js'
export { configurationSchema } from './schema.js'

const logger = createLogger('xo:xo-server-perf-alert')

logger.debug('DEBUG ENABLED')

class PerfAlertXoPlugin {
  /**
   * @type {MonitorRuleSet | undefined}
   */
  #monitorRuleSet

  #configuration

  /**
   * @type {MonitorStrategy|undefined}
   */

  #strategy

  constructor(xo) {
    this._xo = xo
  }

  /**
   *
   * @param {AlarmChanges} param0
   * @returns
   */
  async sendAlarmChange({ newAlarms, closedAlarms, activeAlarms }) {
    if (newAlarms.size === 0 && closedAlarms.size === 0) {
      // don't send anything is the alarms didn't change
      return
    }
    const byRules = {}
    const { default: defaultRoute } = await this._xo.config.getGuiRoutes()
    const isV6 = defaultRoute?.path.includes('@xen-orchestra/web/dist')
    newAlarms.forEach(alarm => {
      byRules[alarm.rule.id] = byRules[alarm.rule.id] ?? { alarms: [] }
      byRules[alarm.rule.id].alarms.push({
        ...alarm,
        url: this._generateUrl(alarm.rule.objectType, alarm.target, isV6),
        notificationType: 'new',
      })
    })

    activeAlarms.forEach(alarm => {
      byRules[alarm.rule.id] = byRules[alarm.rule.id] ?? { alarms: [] }
      byRules[alarm.rule.id].alarms.push({
        ...alarm,
        url: this._generateUrl(alarm.rule.objectType, alarm.target, isV6),
        notificationType: 'active',
      })
    })

    closedAlarms.forEach(alarm => {
      byRules[alarm.rule.id] = byRules[alarm.rule.id] ?? { alarms: [] }
      byRules[alarm.rule.id].alarms.push({
        ...alarm,
        value: '', // we don't want to show the old value for closed Alarms
        url: this._generateUrl(alarm.rule.objectType, alarm.target, isV6),
        notificationType: 'closed',
      })
    })

    let subject = ''
    if (newAlarms.size > 0) {
      if (activeAlarms.size === 0) {
        subject = 'Performance Alerts: Alerting has started'
      } else {
        subject = `Performance Alerts: ${newAlarms.size} new alert(s) detected`
        if (closedAlarms.size > 0) {
          subject += `, ${closedAlarms.size} alert(s) resolved`
        }
      }
    } else {
      if (activeAlarms.size === 0) {
        subject = 'Performance Alerts: All alerts resolved'
      } else {
        subject = `Performance Alerts: ${closedAlarms.size} alert(s) resolved`
      }
    }
    const { html } = await templates.mjml.transform(templates.mjml.$newAlarms({ byRules }))
    const text = await templates.markdown.$newAlarms({ byRules })
    return this._sendAlertEmail(subject, html, text)
  }

  async load() {
    if (this.#strategy) {
      return
    }
    this.#monitorRuleSet = new MonitorRuleSet(this.#configuration)
    this.#strategy = new HybridStrategy(this._xo, this.#monitorRuleSet)

    this.#strategy.watch(changes => this.sendAlarmChange(changes), 60 * 1000).catch(console.error)
  }

  async unload() {
    await this.#strategy?.stopWatch()
    this.#strategy = undefined
  }

  async configure(configuration, state) {
    this.#configuration = configuration
    await this.unload()
    if (state.loaded) {
      await this.load()
    }
  }

  /**
   *
   * @param {string} type
   * @param {XoHost|XoSr|XoVm} object
   * @returns
   */
  _generateUrl(type, object, isV6) {
    const { baseUrl } = this.#configuration
    const { uuid } = object
    switch (type) {
      case 'VM':
        return isV6 ? `${baseUrl}#/vm/${uuid}/dashboard` : `${baseUrl}v5/#/vms/${uuid}/stats`
      case 'host':
        return isV6 ? `${baseUrl}#/host/${uuid}/dashboard` : `${baseUrl}v5/#/hosts/${uuid}/stats`
      case 'sr':
        // SRs are not supported in v6 yet, correct this when they are
        return `${baseUrl}v5/#/srs/${uuid}/general`
      default:
        return `unknown type ${type}`
    }
  }

  async test() {}

  /**
   *
   * @param {string} subject
   * @param {string} html
   * @param {string} markdown
   */
  _sendAlertEmail(subject, html, markdown) {
    if (this.#configuration.toEmails !== undefined && this._xo.sendEmail !== undefined) {
      this._xo.sendEmail({
        to: this.#configuration.toEmails,
        subject,
        html,
        text: markdown,
      })
    } else {
      throw new Error('The email alert system has a configuration issue.')
    }
  }
}

exports.default = function ({ xo }) {
  return new PerfAlertXoPlugin(xo)
}
