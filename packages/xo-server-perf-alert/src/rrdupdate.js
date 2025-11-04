

/**
 * @import {XoHost, XoVm} from "@vates/types"
 */
import { AlertDefinition, AlertDefinitions } from "./definitions.js";
import { Alarm, MonitorStrategy } from "./Strategy.js";
import { createLogger } from '@xen-orchestra/log'


import JSON5 from 'json5'
import { utcParse } from 'd3-time-format'

import { asyncEach } from "@vates/async-each";

const HOST_POWER_STATE = {
  RUNNING: 'Running',
  HALTED: 'Halted',
  UNKNOWN: 'Unknown',
} 
const logger = createLogger('xo:xo-server-perf-alert:rrdStrategy')
/**
 * 
 * @param {*} xapi 
 * @param {XoHost} host 
 * @returns {Promise<EpochTimeStamp>}
 */
async function getServerTimestamp(xapi, host) {
  const serverLocalTime = await xapi.call('host.get_servertime', host._xapiRef)
  console.log('SUCCESS')
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
function xapiAverage(array){
  if(!array){
    throw new Error("Can't compute average of empty array")
  }
  return array
    .map(parseNumber)
    .reduce((acc, current)=>acc+current) /array.length
}
 
export class RRdUpdateStrategy extends MonitorStrategy {
  #xo

  /**
   * @type {AlertDefinitions}
   */
  #definitions

  /**
   * 
   * @param {*} xo 
   * @param {AlertDefinitions} definitions 
   */
  constructor(xo, definitions) {
    super()
    this.#definitions = definitions
    this.#xo = xo
  }


  /**
   * 
   * @param {XoHost} xoHost 
   * @param {number} secondsAgo 
   * @param {boolean} withHostData 
   * @returns 
   */
  async #getHostStats(xoHost, secondsAgo, withHostData) {
    console.log('getHostStats ')
    const xapi = this.#xo.getXapi(xoHost.uuid)
    console.log('got xapi ')
    const serverTimestamp = await getServerTimestamp(xapi, xoHost)
    console.log({serverTimestamp})
    const payload = {
          host: xoHost,
          query: {
            cf: 'AVERAGE',
            host: withHostData ? 'true' : false,
            json: 'true',
            start: serverTimestamp - secondsAgo,
          },
        }
    console.log(payload)
    const rrdResponse = await xapi.getResource('/rrd_updates', payload)
    console.log({rrdResponse})
    const rrdText = await rrdResponse.body.text()
    console.log({rrdText})
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
    console.log(rrd)
    const hostStats = {
      stats: {},
      vms: {}
    }
    const data = rrd.data 
    rrd.meta.legend.forEach((legend, index) => {
      console.log({index, legend})
      const matches = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(legend)
      if (matches === null) {
        logger.debug(`Can't parse legend ${legend}`)
        return
      }
      const [, type, uuidInStat, metricType] = matches
      switch (type) {
        case 'host':
          if (['cpu_avg', 'memory_free_kib', 'memory_total_kib'].includes(metricType)) {
            hostStats.stats[metricType] = []
            data.forEach(({values})=>{
              hostStats.stats[metricType].push(values[index])
            }) 
          }
          break;
        case 'vm':
          if (['cpu_usage', 'memory', 'memory_internal_free'].includes(metricType)) { 
            hostStats.vms[uuidInStat] = hostStats.vms[uuidInStat] ?? {}
            hostStats.vms[uuidInStat][metricType] = []
            hostStats.stats[metricType] = []
            data.forEach(({values})=>{
              hostStats.vms[uuidInStat][metricType].push(values[index])
            }) 
          }
          break;
      }
    }) 
    return hostStats
  }
 
  /**
   * 
   * @param {XoHost} xoHost 
   * @param {JSON} hostStat 
   * @param {Array<AlertDefinition>} definitions 
   * @returns 
   */
  #computeHostAlarm(xoHost, hostStat, definitions){
    const hostAlarms = []
    for (const definition of definitions) {
      // compare value to data extracted from rrd
      let value
      switch(definition.variableName){
        case 'cpuUsage':
          value = xapiAverage(hostStat.stats.cpu_avg)
          break
        case 'memoryUsage':
          const total = xapiAverage(hostStat.stats.memory_total_kib)
          const free = xapiAverage(hostStat.stats.memory_free_kib)
          value =  Math.round(100*(total-free)/total)
          break
        default: 
          throw new Error(`Can't compute alert of type ${definition.variableName} for host`)
      }

      if(definition.isTriggeredBy(value)){
        hostAlarms.push(new Alarm({alert:definition, target: xoHost, value}))
      }
    }
    return hostAlarms
  } 

    /**
   * 
   * @param {XoVm} xoVm 
   * @param {JSON} hostStat 
   * @param {Array<AlertDefinition>} definitions 
   * @returns 
   */
  #computeVmAlarm(xoVm, vmStats, definitions){
    console.log('vm alarm ', vmStats)
    const vmAlarm = []
    for (const definition of definitions) {
      // compare value to data extracted from rrd
      let value
      switch(definition.variableName){
        case 'cpuUsage':
          value = xapiAverage(vmStats.cpu_usage)
          break
        case 'memoryUsage':
          const total = xapiAverage(vmStats.memory)
          const free = xapiAverage(vmStats.memory_internal_free)
          value =  Math.round(100*(total-free)/total)
          break
        default: 
          throw new Error(`Can't compute alert of type ${definition.variableName} for VM`)
      }

      if(definition.isTriggeredBy(value)){
        vmAlarm.push(new Alarm({alert:definition, target: xoVm, value}))
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
    
    let alarms = this.#computeHostAlarm(xoHost, hostStat, this.#definitions.getObjectAlerts(xoHost))
    console.log('HOST', alarms)
    for(const [vmUid, vmStats] of Object.entries(hostStat.vms)){
      const xoVm = this.#xo.getObject(vmUid)
      alarms = alarms.concat(
          this.#computeVmAlarm(xoVm, vmStats, this.#definitions.getObjectAlerts(xoVm)))

    }

    console.log(alarms)
    return alarms
  }

  /**
   * 
   * @returns {Promise<Array<Alarm>>}
   */

  async getActiveAlarms() {

    // make queries host by host, that way we don't need to cache RRD 
    /**
     * @type {Array<XoHost>}
     */

    const hosts = Object.values(this.#xo.objects.indexes.type.host)
    console.log('GOT HOST ') 
    // @todo : compute host list to call rrd only on related host
      // if they are watched
      // or if at least one of their running VM is watched

    // @todo randomize by pool to ensure that the query are not on the same
    // pool master in parallel 

    const alarmsByObjects = []
    await asyncEach(
      hosts,
      async host => {
        if (host.power_state !== HOST_POWER_STATE.RUNNING) {
          return
        }
        let needHost = false
        if (this.#definitions.getObjectAlerts(host).length > 0) {
          needHost = true
        }

        const hostStats = await this.#getHostStats(host, 60, needHost)
        console.log('got stats', hostStats)
        alarmsByObjects.push(this.#computeAlarms(host, hostStats))
      }
    )
    return [].concat(alarmsByObjects)
  }

}