import { readJson } from 'fs-extra'
import { map, forEach, endsWith, find } from 'lodash'

const computeValues = (dataRow, legendKey, type) =>
  type === 'memory'
    ? map(dataRow, ({ values }) => values[legendKey] * 1024)
    : type === 'cpu'
      ? map(dataRow, ({ values }) => values[legendKey] * 100)
      : map(dataRow, ({ values }) => values[legendKey])

const STATS = {
  host: {
    init (uuid) {
      let host
      this._hosts[uuid] = host = this._hosts[uuid] || {}
      return host
    },
    metrics: {
      load: {
        init: collection => initializeProperty(collection, 'load'),
        test: metricType => metricType === 'loadavg',
        compute: computeValues,
      },
      memoryFree: {
        init: collection => initializeProperty(collection, 'memoryFree'),
        test: metricType => metricType === 'memory_free_kib',
        compute: (dataRow, legendKey) =>
          computeValues(dataRow, legendKey, 'memory'),
      },
      memory: {
        init: collection => initializeProperty(collection, 'memory'),
        test: metricType => metricType === 'memory_total_kib',
        compute: (dataRow, legendKey) =>
          computeValues(dataRow, legendKey, 'memory'),
      },
    },
  },
  vm: {
    init (uuid) {
      let vm
      this._vms[uuid] = vm = this._vms[uuid] || {}
      return vm
    },
    metrics: {
      memoryFree: {
        init: collection => initializeProperty(collection, 'memoryFree'),
        test: metricType => metricType === 'memory_internal_free',
        compute: (dataRow, legendKey) =>
          computeValues(dataRow, legendKey, 'memory'),
      },
      memory: {
        init: collection => initializeProperty(collection, 'memory'),
        test: metricType => endsWith(metricType, 'memory'),
        compute: (dataRow, legendKey) =>
          computeValues(dataRow, legendKey, 'memory'),
      },
    },
  },
}

const initializeProperty = (obj, deep) => {
  const splitedDeep = deep.split('.')
  forEach(splitedDeep, (deep, key) => {
    if (obj[deep] === undefined) {
      obj = obj[deep] = splitedDeep.length - 1 === key ? [] : {}
      return
    }
    obj = obj[deep]
  })
  return obj
}

class Stats {
  constructor () {
    this._vms = {}
    this._hosts = {}
  }

  async getStats (hostId, vmId) {
    const json = await readJson('../src/stats.json')
    forEach(json.meta.legend, (legend, key) => {
      const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(
        legend
      )

      // rename this var
      const globalTests = STATS[type]
      if (globalTests === undefined || (vmId !== undefined && vmId !== uuid)) {
        return
      }

      const metric = find(globalTests.metrics, metric =>
        metric.test(metricType)
      )
      if (metric === undefined) {
        return
      }

      const collection = globalTests.init.call(this, uuid)
      const metricValues = metric.init(collection)
      metricValues.push(...metric.compute(json.data, key))
    })

    // console.log(this._vms)
    return vmId !== undefined ? this._vms[vmId] : this._hosts[hostId]
  }
}

//const test1 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69')
// const test2 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69', '69196054-4ce4-d4cd-5e72-2f7db33b695f')
