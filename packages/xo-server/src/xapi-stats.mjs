import defaults from 'lodash/defaults.js'
import findKey from 'lodash/findKey.js'
import forEach from 'lodash/forEach.js'
import identity from 'lodash/identity.js'
import JSON5 from 'json5'
import map from 'lodash/map.js'
import mapValues from 'lodash/mapValues.js'
import mean from 'lodash/mean.js'
import sum from 'lodash/sum.js'
import uniq from 'lodash/uniq.js'
import zipWith from 'lodash/zipWith.js'
import { BaseError } from 'make-error'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { parseDateTime } from '@xen-orchestra/xapi'
import { synchronized } from 'decorator-synchronized'

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

function convertNanToNull(value) {
  return isNaN(value) ? null : value
}

async function getServerTimestamp(xapi, hostRef) {
  return parseDateTime(await xapi.call('host.get_servertime', hostRef))
}

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------

const computeValues = (dataRow, legendIndex, transformValue = identity) =>
  map(dataRow, ({ values }) => transformValue(convertNanToNull(values[legendIndex])))

const combineStats = (stats, path, combineValues) => zipWith(...map(stats, path), (...values) => combineValues(values))

const createGetProperty = (obj, property, defaultValue) => defaults(obj, { [property]: defaultValue })[property]

const testMetric = (test, type) =>
  typeof test === 'string' ? test === type : typeof test === 'function' ? test(type) : test.exec(type)

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
      test: metricType => metricType.endsWith('memory'),
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
    iops: {
      r: {
        test: /^vbd_xvd(.)_iops_read$/,
        getPath: matches => ['iops', 'r', matches[1]],
      },
      w: {
        test: /^vbd_xvd(.)_iops_write$/,
        getPath: matches => ['iops', 'w', matches[1]],
      },
    },
  },
}

// -------------------------------------------------------------------

// RRD
// json: {
//   meta: {
//     start: Number,
//     step: Number,
//     end: Number,
//     rows: Number,
//     columns: Number,
//     legend: String[rows]
//   },
//   data: Item[columns] // Item = { t: Number, values: Number[rows] }
// }

// Local cache
// _statsByObject : {
//   [uuid]: {
//     [step]: {
//       endTimestamp: Number, // the timestamp of the last statistic point
//       interval: Number, // step
//       stats: {
//         [metric1]: Number[],
//         [metric2]: {
//           [subMetric]: Number[],
//         }
//       }
//     }
//   }
// }
export default class XapiStats {
  constructor() {
    this._statsByObject = {}
  }

  // Execute one http request on a XenServer for get stats
  // Return stats (Json format) or throws got exception
  @limitConcurrency(3)
  _getJson(xapi, host, timestamp, step) {
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
      .then(response => response.text().then(JSON5.parse))
  }

  // To avoid multiple requests, we keep a cash for the stats and
  // only return it if we not exceed a step
  _getCachedStats(uuid, step, currentTimeStamp) {
    const statsByObject = this._statsByObject

    const stats = statsByObject[uuid]?.[step]
    if (stats === undefined) {
      return
    }

    if (stats.endTimestamp + step < currentTimeStamp) {
      delete statsByObject[uuid][step]
      return
    }

    return stats
  }

  @synchronized.withKey((_, { host }) => host.uuid)
  async _getAndUpdateStats(xapi, { host, uuid, granularity }) {
    const step = granularity === undefined ? RRD_STEP_SECONDS : RRD_STEP_FROM_STRING[granularity]

    if (step === undefined) {
      throw new FaultyGranularity(
        `Unknown granularity: '${granularity}'. Use 'seconds', 'minutes', 'hours', or 'days'.`
      )
    }

    const currentTimeStamp = await getServerTimestamp(xapi, host.$ref)

    const stats = this._getCachedStats(uuid, step, currentTimeStamp)
    if (stats !== undefined) {
      return stats
    }

    const maxDuration = step * RRD_POINTS_PER_STEP[step]

    // To avoid crossing over the boundary, we ask for one less step
    const optimumTimestamp = currentTimeStamp - maxDuration + step
    const json = await this._getJson(xapi, host, optimumTimestamp, step)

    const actualStep = json.meta.step
    if (json.data.length > 0) {
      // fetched data is organized from the newest to the oldest
      // but this implementation requires it in the other direction
      json.data.reverse()
      json.meta.legend.forEach((legend, index) => {
        const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(legend)

        const metrics = STATS[type]
        if (metrics === undefined) {
          return
        }

        const { metric, testResult } = findMetric(metrics, metricType)
        if (metric === undefined) {
          return
        }

        const xoObjectStats = createGetProperty(this._statsByObject, uuid, {})
        let stepStats = xoObjectStats[actualStep]
        if (stepStats === undefined || stepStats.endTimestamp !== json.meta.end) {
          stepStats = xoObjectStats[actualStep] = {
            endTimestamp: json.meta.end,
            interval: actualStep,
          }
        }

        const path = metric.getPath !== undefined ? metric.getPath(testResult) : [findKey(metrics, metric)]

        const lastKey = path.length - 1
        let metricStats = createGetProperty(stepStats, 'stats', {})
        path.forEach((property, key) => {
          if (key === lastKey) {
            metricStats[property] = computeValues(json.data, index, metric.transformValue)
            return
          }

          metricStats = createGetProperty(metricStats, property, {})
        })
      })
    }

    if (actualStep !== step) {
      throw new FaultyGranularity(`Unable to get the true granularity: ${actualStep}`)
    }

    return (
      this._statsByObject[uuid]?.[step] ?? {
        endTimestamp: currentTimeStamp,
        interval: step,
        stats: {},
      }
    )
  }

  getHostStats(xapi, hostId, granularity) {
    const host = xapi.getObject(hostId)
    return this._getAndUpdateStats(xapi, {
      host,
      uuid: host.uuid,
      granularity,
    })
  }

  async getVmStats(xapi, vmId, granularity) {
    const vm = xapi.getObject(vmId)
    const host = vm.$resident_on
    if (!host) {
      throw new Error(`VM ${vmId} is halted or host could not be found.`)
    }

    return this._getAndUpdateStats(xapi, {
      host,
      uuid: vm.uuid,
      granularity,
    })
  }

  async getSrStats(xapi, srId, granularity) {
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
          r: combineStats(hostsStats, `stats.ioThroughput.r[${srShortUUID}]`, sum),
          w: combineStats(hostsStats, `stats.ioThroughput.w[${srShortUUID}]`, sum),
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
