import { readJson } from 'fs-extra'
import { map, forEach, endsWith, find } from 'lodash'

// -------------------------------------------------------------------

const computeValues = (dataRow, legendIndex, type) => {
  const quotient = {
    memory: 1024,
    memoryFree: 1024,
    cpu: 100
  }
  return map(dataRow, ({ values }) => values[legendIndex] * (quotient[type] || 1))
}

const initializeProperty = (obj, targetPath) => {
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
    init (uuid) {
      let host
      this._hosts[uuid] = host = this._hosts[uuid] || {}
      return host
    },
    metrics: {
      load: {
        init: collection =>
          initializeProperty(collection, 'load'),
        test: metricType => metricType === 'loadavg',
      },
      memoryFree: {
        init: collection =>
          initializeProperty(collection, 'memoryFree'),
        test: metricType => metricType === 'memory_free_kib',
      },
      memory: {
        init: collection =>
          initializeProperty(collection, 'memory'),
        test: metricType => metricType === 'memory_total_kib',
      },
      cpus: {
        init: (collection, cpuKey) =>
          initializeProperty(collection, `cpus.${cpuKey}`),
        test: metricType => /^cpu([0-9]+)$/.exec(metricType),
      },
      pifs: {
        rx: {
          init: (collection, pifKey) =>
            initializeProperty(collection, `pifs.rx.${pifKey}`),
          test: metricType => /^pif_eth([0-9]+)_rx$/.exec(metricType),
        },
        tx: {
          init: (collection, pifKey) =>
            initializeProperty(collection, `pifs.tx.${pifKey}`),
          test: metricType => /^pif_eth([0-9]+)_tx$/.exec(metricType),
        }
      }
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
      },
      memory: {
        init: collection => initializeProperty(collection, 'memory'),
        test: metricType => endsWith(metricType, 'memory'),
      },
      cpus: {
        init: (collection, cpuKey) => initializeProperty(collection, `cpus.${cpuKey}`),
        test: metricType => /^cpu([0-9]+)$/.exec(metricType),
      },
      vifs: {
        rx: {
          init: (collection, vifKey) =>
            initializeProperty(collection, `vifs.rx.${vifKey}`),
          test:  metricType => /^vif_([0-9]+)_rx$/.exec(metricType),
        },
        tx: {
          init: (collection, vifKey) =>
            initializeProperty(collection, `vifs.tx.${vifKey}`),
          test: metricType => /^vif_([0-9]+)_tx$/.exec(metricType),
        }
      },
      xvds: {
        r: {
          init: (collection,  xvdKey) =>
            initializeProperty(collection, `xvds.r.${xvdKey}`),
          test: metricType => /^vbd_xvd(.)_read$/.exec(metricType),
        },
        w: {
          init: (collection,  xvdKey) =>
            initializeProperty(collection, `xvds.w.${xvdKey}`),
          test: metricType => /^vbd_xvd(.)_write$/.exec(metricType),
        }
      }
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

      const statsByType = STATS[type]
      if (statsByType === undefined || (vmId !== undefined && vmId !== uuid)) {
        return
      }

      let testResult
      let metricInDeep
      let metric = find(statsByType.metrics, metric => metric.test !== undefined
          ? (testResult = metric.test(metricType))
          : (metricInDeep = find(metric, metricInDeep => (testResult = metricInDeep.test(metricType))))
      )

      if (metric === undefined) {
        return
      } else if (metricInDeep !== undefined) {
        metric = metricInDeep
      }

      const collection = statsByType.init.call(this, uuid)
      const metricValues = metric.init(collection, testResult[1])
      metricValues.push(...computeValues(json.data, index, type))
    })

    return vmId !== undefined ? this._vms[vmId] : this._hosts[hostId]
  }
}

// new XapiStats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69')
// new XapiStats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69', '69196054-4ce4-d4cd-5e72-2f7db33b695f')
