import { readJson } from 'fs-extra'
import { map, forEach, endsWith, find } from 'lodash'

// -------------------------------------------------------------------

const computeValues = (dataRow, legendIndex, convertQuotient = 1) =>
  map(dataRow, ({ values }) => values[legendIndex] * convertQuotient)

const getValuesFromDepth = (obj, targetPath) => {
  const splitedPath = targetPath.split('.')
  forEach(splitedPath, (path, key) => {
    if (obj[path] === undefined) {
      obj = obj[path] = splitedPath.length - 1 === key ? [] : {}
      return
    }
    obj = obj[path]
  })
  return obj
}

// -------------------------------------------------------------------

const STATS = {
  host: {
    getCollection (uuid) {
      return this._hosts[uuid] !== undefined
        ? this._hosts[uuid]
        : (this._hosts[uuid] = {})
    },
    metrics: {
      load: {
        getValues: collection => getValuesFromDepth(collection, 'load'),
        test: metricType => metricType === 'loadavg',
      },
      memoryFree: {
        getValues: collection => getValuesFromDepth(collection, 'memoryFree'),
        test: metricType => metricType === 'memory_free_kib',
        convertQuotient: 1024,
      },
      memory: {
        getValues: collection => getValuesFromDepth(collection, 'memory'),
        test: metricType => metricType === 'memory_total_kib',
        convertQuotient: 1024,
      },
      cpus: {
        getValues: (collection, cpuKey) =>
          getValuesFromDepth(collection, `cpus.${cpuKey}`),
        test: metricType => /^cpu([0-9]+)$/.exec(metricType),
        convertQuotient: 100,
      },
      pifs: {
        rx: {
          getValues: (collection, pifKey) =>
            getValuesFromDepth(collection, `pifs.rx.${pifKey}`),
          test: metricType => /^pif_eth([0-9]+)_rx$/.exec(metricType),
        },
        tx: {
          getValues: (collection, pifKey) =>
            getValuesFromDepth(collection, `pifs.tx.${pifKey}`),
          test: metricType => /^pif_eth([0-9]+)_tx$/.exec(metricType),
        },
      },
    },
  },
  vm: {
    getCollection (uuid) {
      return this._vms[uuid] !== undefined
        ? this._vms[uuid]
        : (this._vms[uuid] = {})
    },
    metrics: {
      memoryFree: {
        getValues: collection => getValuesFromDepth(collection, 'memoryFree'),
        test: metricType => metricType === 'memory_internal_free',
        convertQuotient: 1024,
      },
      memory: {
        getValues: collection => getValuesFromDepth(collection, 'memory'),
        test: metricType => endsWith(metricType, 'memory'),
        convertQuotient: 1024,
      },
      cpus: {
        getValues: (collection, cpuKey) =>
          getValuesFromDepth(collection, `cpus.${cpuKey}`),
        test: metricType => /^cpu([0-9]+)$/.exec(metricType),
        convertQuotient: 100,
      },
      vifs: {
        rx: {
          getValues: (collection, vifKey) =>
            getValuesFromDepth(collection, `vifs.rx.${vifKey}`),
          test: metricType => /^vif_([0-9]+)_rx$/.exec(metricType),
        },
        tx: {
          getValues: (collection, vifKey) =>
            getValuesFromDepth(collection, `vifs.tx.${vifKey}`),
          test: metricType => /^vif_([0-9]+)_tx$/.exec(metricType),
        },
      },
      xvds: {
        r: {
          getValues: (collection, xvdKey) =>
            getValuesFromDepth(collection, `xvds.r.${xvdKey}`),
          test: metricType => /^vbd_xvd(.)_read$/.exec(metricType),
        },
        w: {
          getValues: (collection, xvdKey) =>
            getValuesFromDepth(collection, `xvds.w.${xvdKey}`),
          test: metricType => /^vbd_xvd(.)_write$/.exec(metricType),
        },
      },
    },
  },
}

// -------------------------------------------------------------------

export default class XapiStats {
  constructor () {
    this._vms = {}
    this._hosts = {}
  }

  async getStats (hostId, vmId) {
    const json = await readJson('../src/stats.json')
    forEach(json.meta.legend, (legend, index) => {
      const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(
        legend
      )

      const stats = STATS[type]
      if (stats === undefined || (vmId !== undefined && vmId !== uuid)) {
        return
      }

      let testResult
      let metricInDeep
      let metric = find(
        stats.metrics,
        metric =>
          metric.test !== undefined
            ? (testResult = metric.test(metricType))
            : (metricInDeep = find(
              metric,
              metricInDeep => (testResult = metricInDeep.test(metricType))
            ))
      )

      if (metric === undefined) {
        return
      } else if (metricInDeep !== undefined) {
        metric = metricInDeep
      }

      const collection = stats.getCollection.call(this, uuid)
      const metricValues = metric.getValues(collection, testResult[1])
      metricValues.push(
        ...computeValues(json.data, index, metric.convertQuotient)
      )
    })

    return vmId !== undefined ? this._vms[vmId] : this._hosts[hostId]
  }
}

// new XapiStats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69')
// new XapiStats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69', '69196054-4ce4-d4cd-5e72-2f7db33b695f')
