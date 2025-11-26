/**
 * @import {XoHost, XoVm} from "@vates/types"
 * @import {MonitorRule, MonitorRuleSet} from "./Rules.js"
 */
import JSON5 from 'json5'
import { utcParse } from 'd3-time-format'

import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

import { Alarm, MonitorStrategy } from './Strategy.js'

const logger = createLogger('xo:xo-server-perf-alert:rrdStrategy')

const USED_METRICS = ['cpu_usage', 'memory', 'memory_internal_free', 'cpu_avg', 'memory_total_kib', 'memory_free_kib']
/**
 *
 * @param {*} xapi
 * @param {XoHost} host
 * @returns {Promise<EpochTimeStamp>}
 */
async function getServerTimestamp(xapi, host) {
  const serverLocalTime = await xapi.call('host.get_servertime', host._xapiRef)
  const date = utcParse('%Y%m%dT%H:%M:%SZ')(serverLocalTime)
  if (date === null) {
    throw new Error(`Can't parse server time, got  ${serverLocalTime} `)
  }
  return Math.floor(date.getTime() / 1000)
}

/**
 *
 * @param {number|string} value
 * @returns {number}
 */
function parseNumber(value) {
  // Starting from XAPI 23.31, numbers in the JSON payload are encoded as
  // strings to support NaN, Infinity and -Infinity
  if (typeof value === 'string') {
    const asNumber = +value
    if (isNaN(asNumber) && value !== 'NaN') {
      throw new Error('cannot parse number: ' + value)
    }
    value = asNumber
  }

  return isNaN(value) ? null : value
}

/**
 *
 * @param {Array<string|number} array
 */
function xapiAverage(array) {
  if (!array) {
    throw new Error("Can't compute average of empty array")
  }
  return array.map(parseNumber).reduce((acc, current) => acc + current) / array.length
}

/**
 * @description Query the rrd of the hosts to get the stat values
 *
 */
export class RrdHostVm extends MonitorStrategy {
  #xo

  /**
   * @type {MonitorRuleSet}
   */
  #rules

  /**
   * @type {AbortController| undefined}
   */
  #abortWaitController

  /**
   * @type {Date | undefined}
   */
  #lastChangeComputation

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

  #filterStats(rrd) {
    const hostStats = {
      stats: {},
      vms: {},
    }
    const data = rrd.data
    rrd.meta.legend.forEach((legend, index) => {
      const matches = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(legend)
      if (matches === null) {
        logger.debug(`Can't parse legend ${legend}`)
        return
      }
      const [, type, uuidInStat, metricType] = matches
      if (!USED_METRICS.includes(metricType)) {
        return
      }
      switch (type) {
        case 'host':
          hostStats.stats[metricType] = []
          data.forEach(({ values }) => {
            hostStats.stats[metricType].push(values[index])
          })
          break
        case 'vm':
          hostStats.vms[uuidInStat] = hostStats.vms[uuidInStat] ?? {}
          hostStats.vms[uuidInStat][metricType] = []
          data.forEach(({ values }) => {
            hostStats.vms[uuidInStat][metricType].push(values[index])
          })
          break
      }
    })
    return hostStats
  }

  /**
   *
   * @param {XoHost} xoHost
   * @param {number} interval
   * @param {Object} param2
   * @param {boolean} param2.withHostData
   * @param {string} param2.vmUuid
   * @returns
   */
  async #getHostStats(xoHost, interval, { withHostData, vmUuid = 'none', srUuid = 'none' } = {}) {
    const xapi = this.#xo.getXapi(xoHost.uuid)
    const serverTimestamp = await getServerTimestamp(xapi, xoHost)
    const payload = {
      host: xoHost,
      query: {
        cf: 'AVERAGE',
        host: withHostData ? 'true' : 'false',
        json: 'true',
        interval,
        sr_uuid: srUuid,
        start: serverTimestamp - 2 * interval,
        vm_uuid: vmUuid,
      },
    }

    const rrdResponse = await xapi.getResource('/rrd_updates', payload)
    const rrdText = await rrdResponse.body.text()
    /**
     * @type {JSON}
     */
    let rrd
    try {
      // starting from XAPI 23.31, the response is valid JSON
      rrd = JSON.parse(rrdText)
    } catch (_) {
      logger.debug('fallback JSON5')
      rrd = JSON5.parse(rrdText)
    }

    return this.#filterStats(rrd)
  }

  /**
   *
   * @param {XoHost} xoHost
   * @param {JSON} hostStat
   * @param {Array<MonitorRule>} rules
   * @returns
   */
  #computeHostAlarm(xoHost, hostStat, rules) {
    const hostAlarms = []
    for (const rule of rules) {
      // compare value to data extracted from rrd
      let value
      switch (rule.variableName) {
        case 'cpuUsage':
          value = Math.round(100 * xapiAverage(hostStat.stats.cpu_avg))
          break
        case 'memoryUsage': {
          const total = xapiAverage(hostStat.stats.memory_total_kib)
          const free = xapiAverage(hostStat.stats.memory_free_kib)
          value = Math.round((100 * (total - free)) / total)
          break
        }
        default:
          throw new Error(`Can't compute alert of type ${rule.variableName} for host`)
      }

      if (rule.isTriggeredBy(value)) {
        hostAlarms.push(new Alarm({ rule, target: xoHost, value }))
      }
    }
    return hostAlarms
  }

  /**
   *
   * @param {XoVm} xoVm
   * @param {JSON} hostStat
   * @param {Array<MonitorRule>} rules
   * @returns
   */
  #computeVmAlarm(xoVm, vmStats, rules) {
    const vmAlarm = []
    for (const rule of rules) {
      // compare value to data extracted from rrd
      let value
      switch (rule.variableName) {
        case 'cpuUsage':
          value = Math.round(100 * xapiAverage(vmStats.cpu_usage))
          break
        case 'memoryUsage': {
          const total = xapiAverage(vmStats.memory)
          // memory_internal_free is in bytes, memory is in kilobytes
          const free = 1024 * xapiAverage(vmStats.memory_internal_free)
          value = Math.round((100 * (total - free)) / total)
          break
        }
        default:
          throw new Error(`Can't compute alert of type ${rule.variableName} for VM`)
      }

      if (rule.isTriggeredBy(value)) {
        vmAlarm.push(new Alarm({ rule, target: xoVm, value }))
      }
    }
    return vmAlarm
  }
  /**
   * @param {XoHost} xoHost
   * @param {Object} hostStat
   *
   * @returns {Array<Alarm>}
   */
  #computeAlarms(xoHost, hostStat) {
    /**
     * @type {Array<Alarm>}
     */

    let alarms = this.#computeHostAlarm(xoHost, hostStat, this.#rules.getObjectAlerts(xoHost))
    for (const [vmUid, vmStats] of Object.entries(hostStat.vms ?? {})) {
      const xoVm = this.#xo.getObject(vmUid)
      try {
        alarms = alarms.concat(this.#computeVmAlarm(xoVm, vmStats, this.#rules.getObjectAlerts(xoVm)))
      } catch (err) {}
    }
    return alarms
  }

  /**
   *
   * @returns {Promise<Array<Alarm>>}
   */

  async computeActiveAlarms() {
    // make queries host by host, that way we don't need to cache RRD
    /**
     * @type {Array<XoHost>}
     */

    const hosts = Object.values(this.#xo.objects.indexes.type.host ?? {})
    /**
     * @type {Map<XoHost['id'], Set<XoVm['id']>}
     */
    const watchedVmsByHosts = new Map()
    Object.values(this.#xo.objects.indexes.type.VM ?? {})

      .filter(vm => this.#rules.isObjectAffected(vm))
      .forEach(vm => {
        if (!watchedVmsByHosts.has(vm.$container)) {
          watchedVmsByHosts.set(vm.$container, new Set([vm.id]))
        } else {
          watchedVmsByHosts.get(vm.$container).add(vm.id)
        }
      })

    const alarmsByObjects = []

    await asyncEach(
      hosts,
      async host => {
        const withHostData = this.#rules.isObjectAffected(host)
        let vmUuid

        const vms = watchedVmsByHosts.get(host.id)

        if (vms === undefined) {
          vmUuid = 'none'
        } else {
          if (vms.size === 1) {
            ;[vmUuid] = vms
          } else {
            vmUuid = 'all'
          }
        }
        if (withHostData || vmUuid !== 'none') {
          const hostStats = await this.#getHostStats(host, this.#rules.getMaxPeriod(), { withHostData, vmUuid })
          alarmsByObjects.push(this.#computeAlarms(host, hostStats))
        }
      },
      { concurrency: 5 }
    )

    return [].concat(...alarmsByObjects)
  }

  async #poll(onChanges, delay) {
    try {
      // ensure we at least wait for the delay
      // but handle gracefully long running computation
      if (this.#lastChangeComputation) {
        const nextRun = this.#lastChangeComputation + delay - Date.now()
        await new Promise((resolve, reject) => {
          const interval = setTimeout(() => {
            resolve()
          }, nextRun)
          this.#abortWaitController.signal.addEventListener('abort', () => {
            clearInterval(interval)
            const error = new Error('Abort waiting')
            error.code = 'ERR_ABORTED'
            reject(error)
          })
        })
      }

      this.#lastChangeComputation = Date.now()
      const changes = await this.computeAlarmChanges()
      if (this.#abortWaitController.signal.aborted) {
        return
      }
      await onChanges(changes)
    } catch (error) {
      if (error.code !== 'ERR_ABORTED') {
        throw error
      }
    } finally {
      if (!this.#abortWaitController.signal.aborted) {
        this.#poll(onChanges, delay)
      }
    }
  }

  watch(onChanges, delay = 60 * 1000) {
    if (this.#abortWaitController !== undefined) {
      return
    }

    // @todo clean all existing alarm on startup

    this.#abortWaitController = new AbortController()
    return this.#poll(onChanges, delay)
  }

  stopWatch() {
    this.#abortWaitController?.abort()
    this.#abortWaitController = undefined
  }
}
