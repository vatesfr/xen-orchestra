import JSON5 from 'json5'
import limitConcurrency from 'limit-concurrency-decorator'
import { BaseError } from 'make-error'
import {
  endsWith,
  findKey,
  forEach,
  get,
  identity,
  map,
  mapValues,
  mean,
  sum,
  uniq,
  zipWith,
} from 'lodash'

import { parseDateTime } from './xapi'

export class FaultyGranularity extends BaseError {}

// -------------------------------------------------------------------

// according to https://xapi-project.github.io/xen-api/metrics.html
// The values are stored at intervals of:
//  - 5 seconds for the past 10 minutes
//  - one minute for the past 2 hours
//  - one hour for the past week
//  - one day for the past year
const RRD_STEP_SECONDS = 5
const RRD_STEP_MINUTES = 60
const RRD_STEP_HOURS = 3600
const RRD_STEP_DAYS = 86400

const RRD_STEP_FROM_STRING = {
  seconds: RRD_STEP_SECONDS,
  minutes: RRD_STEP_MINUTES,
  hours: RRD_STEP_HOURS,
  days: RRD_STEP_DAYS,
}

// points = intervalInSeconds / step
const RRD_POINTS_PER_STEP = {
  [RRD_STEP_SECONDS]: 120,
  [RRD_STEP_MINUTES]: 120,
  [RRD_STEP_HOURS]: 168,
  [RRD_STEP_DAYS]: 366,
}

// -------------------------------------------------------------------
// Utils
// -------------------------------------------------------------------

// Return current local timestamp in seconds
function getCurrentTimestamp () {
  return Date.now() / 1000
}

function convertNanToNull (value) {
  return isNaN(value) ? null : value
}

async function getServerTimestamp (xapi, hostRef) {
  const serverLocalTime = await xapi.call('host.get_servertime', hostRef)
  return Math.floor(parseDateTime(serverLocalTime).getTime() / 1e3)
}

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------

const computeValues = (dataRow, legendIndex, transformValue = identity) =>
  map(dataRow, ({ values }) =>
    transformValue(convertNanToNull(values[legendIndex]))
  )

const combineStats = (stats, path, combineValues) =>
  zipWith(...map(stats, path), (...values) => combineValues(values))

// It browse the object in depth and initialise it's properties
// The targerPath can be a string or an array containing the depth
// targetPath: [a, b, c] => a.b.c
const getValuesFromDepth = (obj, targetPath) => {
  if (typeof targetPath === 'string') {
    return (obj[targetPath] = [])
  }

  forEach(targetPath, (path, key) => {
    if (obj[path] === undefined) {
      obj = obj[path] = targetPath.length - 1 === key ? [] : {}
      return
    }
    obj = obj[path]
  })
  return obj
}

const testMetric = (test, type) =>
  typeof test === 'string'
    ? test === type
    : typeof test === 'function'
      ? test(type)
      : test.exec(type)

const findMetric = (metrics, metricType) => {
  let testResult
  let metric

  forEach(metrics, (current, key) => {
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

// -------------------------------------------------------------------

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
      test: metricType => endsWith(metricType, 'memory'),
    },
    cpus: {
      test: /^cpu(\d+)$/,
      getPath: matches => ['cpus', matches[1]],
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
  },
}

// -------------------------------------------------------------------

export default class XapiStats {
  constructor () {
    this._statsByObject = {}
  }

  // Execute one http request on a XenServer for get stats
  // Return stats (Json format) or throws got exception
  @limitConcurrency(3)
  _getJson (xapi, host, timestamp, step) {
    return xapi
      .getResource('/rrd_updates', {
        host,
        query: {
          cf: 'AVERAGE',
          host: 'true',
          interval: step,
          json: 'true',
          start: timestamp,
        },
      })
      .then(response => response.readAll().then(JSON5.parse))
  }

  async _getNextTimestamp (xapi, host, step) {
    const currentTimeStamp = await getServerTimestamp(xapi, host.$ref)
    const maxDuration = step * RRD_POINTS_PER_STEP[step]
    const lastTimestamp = get(this._statsByObject, [
      host.uuid,
      step,
      'endTimestamp',
    ])

    if (
      lastTimestamp === undefined ||
      currentTimeStamp - lastTimestamp + step > maxDuration
    ) {
      return currentTimeStamp - maxDuration + step
    }
    return lastTimestamp
  }

  _getStats (hostUuid, step, vmUuid) {
    const hostStats = this._statsByObject[hostUuid][step]

    // Return host stats
    if (vmUuid === undefined) {
      return {
        interval: step,
        ...hostStats,
      }
    }

    // Return vm stats
    return {
      interval: step,
      endTimestamp: hostStats.endTimestamp,
      ...this._statsByObject[vmUuid][step],
    }
  }

  async _getAndUpdateStats (xapi, { host, vmUuid, granularity }) {
    const step =
      granularity === undefined
        ? RRD_STEP_SECONDS
        : RRD_STEP_FROM_STRING[granularity]

    if (step === undefined) {
      throw new FaultyGranularity(
        `Unknown granularity: '${granularity}'. Use 'seconds', 'minutes', 'hours', or 'days'.`
      )
    }

    // Limit the number of http requests
    const hostUuid = host.uuid

    if (
      get(this._statsByObject, [hostUuid, step, 'localTimestamp']) + step >
      getCurrentTimestamp()
    ) {
      return this._getStats(hostUuid, step, vmUuid)
    }

    const timestamp = await this._getNextTimestamp(xapi, host, step)
    const json = await this._getJson(xapi, host, timestamp, step)
    if (json.meta.step !== step) {
      throw new FaultyGranularity(
        `Unable to get the true granularity: ${json.meta.step}`
      )
    }

    // It exists data
    if (json.data.length !== 0) {
      // Warning: Sometimes, the json.xport.meta.start value does not match with the
      // timestamp of the oldest data value
      // So, we use the timestamp of the oldest data value !
      const startTimestamp = json.data[json.meta.rows - 1].t
      const endTimestamp = get(this._statsByObject, [
        hostUuid,
        step,
        'endTimestamp',
      ])

      const statsOffset = endTimestamp - startTimestamp + step
      if (endTimestamp !== undefined && statsOffset > 0) {
        const parseOffset = statsOffset / step
        // Remove useless data
        // Note: Older values are at end of json.data.row
        json.data.splice(json.data.length - parseOffset)
      }

      // It exists useful data
      if (json.data.length > 0) {
        // reorder data
        json.data.reverse()
        forEach(json.meta.legend, (legend, index) => {
          const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(
            legend
          )

          const metrics = STATS[type]
          if (metrics === undefined) {
            return
          }

          const { metric, testResult } = findMetric(metrics, metricType)

          if (metric === undefined) {
            return
          }

          const path =
            metric.getPath !== undefined
              ? metric.getPath(testResult)
              : [findKey(metrics, metric)]

          const metricValues = getValuesFromDepth(this._statsByObject, [
            uuid,
            step,
            'stats',
            ...path,
          ])

          metricValues.push(
            ...computeValues(json.data, index, metric.transformValue)
          )

          // remove older Values
          metricValues.splice(
            0,
            metricValues.length - RRD_POINTS_PER_STEP[step]
          )
        })
      }
    }

    // Update timestamp
    const hostStats = this._statsByObject[hostUuid][step]
    hostStats.endTimestamp = json.meta.end
    hostStats.localTimestamp = getCurrentTimestamp()
    return this._getStats(hostUuid, step, vmUuid)
  }

  getHostStats (xapi, hostId, granularity) {
    return this._getAndUpdateStats(xapi, {
      host: xapi.getObject(hostId),
      granularity,
    })
  }

  getVmStats (xapi, vmId, granularity) {
    const vm = xapi.getObject(vmId)
    const host = vm.$resident_on
    if (!host) {
      throw new Error(`VM ${vmId} is halted or host could not be found.`)
    }

    return this._getAndUpdateStats(xapi, {
      host,
      vmUuid: vm.uuid,
      granularity,
    })
  }

  async getSrStats (xapi, srId, granularity) {
    const sr = xapi.getObject(srId)

    const hostsStats = {}
    await Promise.all(
      map(uniq(map(sr.$PBDs, 'host')), hostId =>
        this.getHostStats(xapi, hostId, granularity).then(stats => {
          hostsStats[xapi.getObject(hostId).name_label] = stats
        })
      )
    )

    const srShortUUID = sr.uuid.slice(0, 8)
    return {
      interval: hostsStats[Object.keys(hostsStats)[0]].interval,
      endTimestamp: Math.max(...map(hostsStats, 'endTimestamp')),
      localTimestamp: Math.min(...map(hostsStats, 'localTimestamp')),
      stats: {
        iops: {
          r: combineStats(hostsStats, `stats.iops.r[${srShortUUID}]`, sum),
          w: combineStats(hostsStats, `stats.iops.w[${srShortUUID}]`, sum),
        },
        ioThroughput: {
          r: combineStats(
            hostsStats,
            `stats.ioThroughput.r[${srShortUUID}]`,
            sum
          ),
          w: combineStats(
            hostsStats,
            `stats.ioThroughput.w[${srShortUUID}]`,
            sum
          ),
        },
        latency: {
          r: combineStats(hostsStats, `stats.latency.r[${srShortUUID}]`, mean),
          w: combineStats(hostsStats, `stats.latency.w[${srShortUUID}]`, mean),
        },
        iowait: mapValues(hostsStats, `stats.iowait[${srShortUUID}]`),
      },
    }
  }
}
