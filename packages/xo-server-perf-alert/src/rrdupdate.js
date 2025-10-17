// @ts-check


/**
 * @import {XoHost, XoVm} from "@vates/types"
 */
import { AlertDefinition, AlertDefinitions } from "./definitions";
import { Alarm, MonitorStrategy } from "./Strategy";
import { createLogger } from '@xen-orchestra/log'
import {HOST_POWER_STATE } from '@vates/types'

import JSON5 from 'json5'
import { utcParse } from 'd3-time-format'

import assert from 'node:assert'
import { asyncEach } from "@vates/async-each";


const logger = createLogger('xo:xo-server-perf-alert:rrdStrategy')
/**
 * 
 * @param {*} xapi 
 * @param {XoHost} host 
 * @returns {Promise<EpochTimeStamp>}
 */
async function getServerTimestamp(xapi, host) {
  const serverLocalTime = await xapi.call('host.get_servertime', host._xapiRef)
  const date = utcParse('%Y%m%dT%H:%M:%SZ')(serverLocalTime)
  if(date === null){
    throw new Error(`Can't parse server time, got  ${serverLocalTime} `)
  }
  return Math.floor(date.getTime() / 1000)
}
// from  packages/xo-server/src/xapi-stats.mjs

// The metrics:
//  test: can be a function, regexp or string, default to: currentKey
//  getPath: default to: () => currentKey
//  transformValue: default to: identity
const STATS = {
  host: {
    load: {
      test: 'loadavg',
    },
    memoryFree: {
      test: 'memory_free_kib',
      transformValue: value => value * 1024,
    },
    memory: {
      test: 'memory_total_kib',
      transformValue: value => value * 1024,
    },
    cpus: {
      test: /^cpu(\d+)$/,
      getPath: matches => ['cpus', matches[1]],
      transformValue: value => value * 1e2,
    },
    pifs: {
      rx: {
        test: /^pif_eth(\d+)_rx$/,
        getPath: matches => ['pifs', 'rx', matches[1]],
      },
      tx: {
        test: /^pif_eth(\d+)_tx$/,
        getPath: matches => ['pifs', 'tx', matches[1]],
      },
    },
    iops: {
      r: {
        test: /^iops_read_(\w+)$/,
        getPath: matches => ['iops', 'r', matches[1]],
      },
      w: {
        test: /^iops_write_(\w+)$/,
        getPath: matches => ['iops', 'w', matches[1]],
      },
    },
    ioThroughput: {
      r: {
        test: /^io_throughput_read_(\w+)$/,
        getPath: matches => ['ioThroughput', 'r', matches[1]],
        transformValue: value => value * 2 ** 20,
      },
      w: {
        test: /^io_throughput_write_(\w+)$/,
        getPath: matches => ['ioThroughput', 'w', matches[1]],
        transformValue: value => value * 2 ** 20,
      },
    },
    latency: {
      r: {
        test: /^read_latency_(\w+)$/,
        getPath: matches => ['latency', 'r', matches[1]],
        transformValue: value => value / 1e3,
      },
      w: {
        test: /^write_latency_(\w+)$/,
        getPath: matches => ['latency', 'w', matches[1]],
        transformValue: value => value / 1e3,
      },
    },
    iowait: {
      test: /^iowait_(\w+)$/,
      getPath: matches => ['iowait', matches[1]],
    },
  },
  vm: {
    memoryFree: {
      test: 'memory_internal_free',
      transformValue: value => value * 1024,
    },
    memory: {
      test: metricType => metricType.endsWith('memory'),
    },
    memoryTarget: {
      test: 'memory_target',
    },
    cpus: {
      test: /^cpu(\d+)$/,
      getPath: matches => ['cpus', matches[1]],
      transformValue: value => value * 1e2,
    },
    cpuUsage: {
      test: 'cpu_usage',
      transformValue: value => value * 1e2,
    },
    runstateFullrun: {
      test: 'runstate_fullrun',
      transformValue: value => value * 1e2,
    },
    runstateFullContention: {
      test: 'runstate_full_contention',
      transformValue: value => value * 1e2,
    },
    runstatePartialRun: {
      test: 'runstate_partial_run',
      transformValue: value => value * 1e2,
    },
    runstatePartialContention: {
      test: 'runstate_partial_contention',
      transformValue: value => value * 1e2,
    },
    runstateConcurrencyHazard: {
      test: 'runstate_concurrency_hazard',
      transformValue: value => value * 1e2,
    },
    runstateBlocked: {
      test: 'runstate_blocked',
      transformValue: value => value * 1e2,
    },
    vifs: {
      rx: {
        test: /^vif_(\d+)_rx$/,
        getPath: matches => ['vifs', 'rx', matches[1]],
      },
      tx: {
        test: /^vif_(\d+)_tx$/,
        getPath: matches => ['vifs', 'tx', matches[1]],
      },
    },
    vifErrors: {
      rx: {
        test: /^vif_(\d+)_rx_errors$/,
        getPath: matches => ['vifErrors', 'rx', matches[1]],
      },
      tx: {
        test: /^vif_(\d+)_tx_errors$/,
        getPath: matches => ['vifErrors', 'tx', matches[1]],
      },
    },
    xvds: {
      r: {
        test: /^vbd_xvd(.)_read$/,
        getPath: matches => ['xvds', 'r', matches[1]],
      },
      w: {
        test: /^vbd_xvd(.)_write$/,
        getPath: matches => ['xvds', 'w', matches[1]],
      },
    },
    iops: {
      r: {
        test: /^vbd_xvd(.)_iops_read$/,
        getPath: matches => ['iops', 'r', matches[1]],
      },
      w: {
        test: /^vbd_xvd(.)_iops_write$/,
        getPath: matches => ['iops', 'w', matches[1]],
      },
      total: {
        test: /^vbd_xvd(.)_iops_total$/,
        getPath: matches => ['iops', 'total', matches[1]],
      },
    },
    // value in ms converted to seconds to be consistent with other vbd values
    vbdLatency: {
      r: {
        test: /^vbd_xvd(.)_read_latency$/,
        getPath: matches => ['vbdLatency', 'r', matches[1]],
        transformValue: value => value / 1000,
      },
      w: {
        test: /^vbd_xvd(.)_write_latency$/,
        getPath: matches => ['vbdLatency', 'w', matches[1]],
        transformValue: value => value / 1000,
      },
    },
    vbdIowait: {
      test: /^vbd_xvd(.)_iowait$/,
      getPath: matches => ['vbdIowait', matches[1]],
      transofrmValue: value => value * 1e2,
    },
    vbdInflight: {
      test: /^vbd_xvd(.)_inflight$/,
      getPath: matches => ['vbdInflight', matches[1]],
    },
    vbdAvgquSz: {
      test: /^vbd_xvd(.)_avgqu_sz$/,
      getPath: matches => ['vbdAvgquSz', matches[1]],
    },
  },
}

/**
 * 
 * @param {string|function|RegExp} test 
 * @param {string} type 
 * @returns 
 */
function testMetric(test, type) {
  return typeof test === 'string' ? test === type : typeof test === 'function' ? test(type) : test.exec(type)
}

/**
 * 
 * @param {*} metrics 
 * @param {*} metricType 
 * @returns 
 */
function findMetric(metrics, metricType){
  let testResult
  let metric
  Object.entries(metrics).forEach(([key, current])=>{
    if (current.test === undefined) {
      const newValues = findMetric(current, metricType)

      metric = newValues.metric
      if (metric !== undefined) {
        testResult = newValues.testResult
        return false
      }
    } else if ((testResult = testMetric(current.test, metricType))) {
      metric = current
      return false
    }
  })

  return { metric, testResult }
}


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


function computeValues(dataRow, legendIndex, transformValue = (val)=>val) {
    return Object.values(dataRow).map(({ values }) => transformValue(parseNumber(values[legendIndex]))) 
}

function findKey(object, predicate){
    return Object.entries(object)
        .find(([key,entry])=>predicate(entry))
        ?.[0]
}
  

export class RRdUpdateStrategy extends MonitorStrategy{
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
    constructor(xo, definitions){
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
    async #getRrd(xoHost, secondsAgo, withHostData) { 
        const xapi = this.#xo.getXapi(xoHost.uuid) 
        return  getServerTimestamp(xapi, xoHost)
            .then(serverTimestamp => {
            const payload = {
                host: xoHost._xapiRef,
                query: {
                cf: 'AVERAGE',
                host: withHostData ? 'true': false,
                json: 'true',
                start: serverTimestamp - secondsAgo,
                },
            }
            return xapi.getResource('/rrd_updates', payload)
            })
            .then(res => res.body.text())
            .then(text => {
            let json
            try {
                // starting from XAPI 23.31, the response is valid JSON
                json = JSON.parse(text)
            } catch (_) {
                logger.debug('fallback JSON5')
                json = JSON5.parse(text)
            }
            return json
            })  
      }
    
      /**
       * 
       * @param {XoHost|XoVm} xoObject 
       * @param {Object} rrd 
       */
    #extractObjectStatsFromRrd(xoObject, rrd){
        const results = {
          meta: { ...json.meta, legend: [] },
          data: [],
        }
        let stepStats
        if (rrd.data.length > 0) {
          // copy only the data relevant the object
          const data = [...rrd.data]
    
          let firstPass = true
          rrd.meta.legend.forEach((legend, index) => {
            const matches = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(legend)
            if(matches === null){
                logger.debug(`Can't parse legend ${legend}`)
                return 
            }
            const [, type, uuidInStat, metricType] = matches

            const metrics = STATS[type]
            if (metrics === undefined) {
                return
            }
            if (uuidInStat !== xoObject.uuid) {
                return
            }
            const { metric, testResult } = findMetric(metrics, metricType)
            if (metric === undefined) {
                return
            }
            const endTimestamp = parseNumber(json.meta.end)
            if (stepStats === undefined || stepStats.endTimestamp !== endTimestamp) {
            stepStats = {
                endTimestamp,
                interval: actualStep,
                stats: {},
            }
            }
            const path = metric.getPath !== undefined ? metric.getPath(testResult) : [findKey(metrics, metric)]
    
            const lastKey = path.length - 1
            let metricStats = stepStats.stats
            path.forEach((property, key) => {
                if (key === lastKey) {
                    metricStats[property] = computeValues(data, index, metric.transformValue)
                return
                }
                metricStats = metricStats[property] = metricStats[property] ?? {}
            })
        })
        return (
        stepStats ?? {
            endTimestamp: currentTimeStamp,
            interval: step,
            stats: {},
        }
        )
    }
}



    /**
     * 
     * @param {Object} rrd 
     */
    #getMemoryUsageValue(rrd){

      const memoryKBytesLegend = rrd.meta.legend.find(l => l.name === 'memory_total_kib')
      const memoryKBytesFreeLegend = rrd.meta.legend.find(l => l.name === 'memory_free_kib')
          const memory = data.values[memoryKBytesLegend.index]
    return 


    }
    /**
     * @param {XoHost|XoVm} xoObject
     * @param {Array<AlertDefinition>} definitions
     * @param {Object} rrd
     * 
     * @returns {Array<Alarm>}
     */
    #computeAlarms(xoObject, definitions, rrd){
        const hostData = this.#extractObjectStatsFromRrd(xoObject, rrd) 
        /**
         * @type {Array<Alarm>}
         */
        const alarms = []
        for(const definition of definitions){
            // compare value to data extracted from rrd

        }
        return alarms
    }

    /**
     * 
     * @returns {Promise<Array<Alarm>>}
     */

    async getActiveAlarms(){

        // make queries host by host, that way we don't need to cache RRD 
        /**
         * @type {Array<XoHost>}
         */
        
        const hosts = Object.values(this.#xo.objects.indexes.type.host)

        // @todo randomize by pool to ensure that the query are not on the same
        // pool master in parallel 
 
        const alarmsByObjects = []
        await asyncEach(
            hosts, 
            async host =>{
                if(host.power_state !== HOST_POWER_STATE.RUNNING){
                    return 
                }
                let needHost = false
                if(this.#definitions.getObjectAlerts(host).length > 0){
                    needHost = true
                } 

                const rrd = await this.#getRrd(host, 60, needHost)
                
                const hostAlerts = this.#definitions.getObjectAlerts(host)
                if(hostAlerts.length > 0 ){
                    alarmsByObjects.push(this.#computeAlarms(host,hostAlerts, rrd ))
                }
                for(const vm of host.$VMs){
                    const vmAlerts = this.#definitions.getObjectAlerts(vm)
                    if(hostAlerts.length > 0 ){
                        alarmsByObjects.push(this.#computeAlarms(vm,vmAlerts, rrd ))
                    }
                }
            }
        )
        return [].concat(alarmsByObjects)
    }


}