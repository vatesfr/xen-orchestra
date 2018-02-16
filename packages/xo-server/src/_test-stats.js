import { readJson } from 'fs-extra'
import { map, forEach, endsWith } from 'lodash'

const STATS = {
  host: {
    cpus: {
      test: metricType => /^cpu([0-9]+)$/.exec(metricType),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 100),
    },
    pifs: {
      test: metricType => /^pif_eth([0-9]+)_(rx|tx)$/.exec(metricType),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey]),
    },
    load: {
      test: metricType => metricType === 'loadavg',
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey]),
    },
    memoryFree: {
      test: metricType => metricType === 'memory_free_kib',
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 1024),
    },
    memory: {
      test: metricType => metricType === 'memory_total_kib',
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 1024),
    },
  },
  vm: {
    cpus: {
      test: metricType => /^cpu([0-9]+)$/.exec(metricType),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 100),
    },
    vifs: {
      test: metricType => /^vif_([0-9]+)_(rx|tx)$/.exec(metricType),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey]),
    },
    xvds: {
      test: metricType => /^vbd_xvd(.)_(read|write)$/.exec(metricType),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey]),
    },
    memoryFree: {
      test: metricType => metricType === 'memory_internal_free',
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 1024),
    },
    memory: {
      test: metricType => endsWith(metricType, 'memory'),
      compute: (dataRow, legendKey) =>
        map(dataRow, ({ values }) => values[legendKey] * 1024),
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
}

class Stats {
  constructor () {
    this._vms = {}
    this._hosts = {}
  }

  _handleHostStats (uuid, metricType, legendKey, data) {
    let host
    this._hosts[uuid] = host = this._hosts[uuid] || {}

    let testResult
    if ((testResult = STATS.host.cpus.test(metricType)) !== null) {
      initializeProperty(host, `cpus.${testResult[1]}`)
      host.cpus[testResult[1]].push(...STATS.host.cpus.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.host.pifs.test(metricType)) !== null) {
      if (testResult[2] === 'rx') {
        initializeProperty(host, `pifs.rx.${testResult[1]}`)
        host.pifs.rx[testResult[1]].push(
          ...STATS.host.pifs.compute(data, legendKey)
        )
        return
      }

      initializeProperty(host, `pifs.tx.${testResult[1]}`)
      host.pifs.tx[testResult[1]].push(
        ...STATS.host.pifs.compute(data, legendKey)
      )
      return
    }

    if (STATS.host.load.test(metricType)) {
      initializeProperty(host, 'load')
      host.load.push(...STATS.host.load.compute(data, legendKey))
      return
    }

    if (STATS.host.memoryFree.test(metricType)) {
      initializeProperty(host, 'memoryFree')
      host.memoryFree.push(...STATS.host.memoryFree.compute(data, legendKey))
      return
    }

    if (STATS.host.memory.test(metricType)) {
      initializeProperty(host, 'memory')
      host.memory.push(...STATS.host.memory.compute(data, legendKey))
    }
  }

  _handleVmStats (uuid, metricType, legendKey, data) {
    let vm
    this._vms[uuid] = vm = this._vms[uuid] || {}

    let testResult
    if ((testResult = STATS.vm.cpus.test(metricType)) !== null) {
      initializeProperty(vm, `cpus.${testResult[1]}`)
      vm.cpus[testResult[1]].push(...STATS.vm.cpus.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.vm.vifs.test(metricType)) !== null) {
      if (testResult[2] === 'rx') {
        initializeProperty(vm, `vifs.rx.${testResult[1]}`)
        vm.vifs.rx[testResult[1]].push(
          ...STATS.vm.vifs.compute(data, legendKey)
        )
        return
      }

      initializeProperty(vm, `vifs.tx.${testResult[1]}`)
      vm.vifs.tx[testResult[1]].push(...STATS.vm.vifs.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.vm.xvds.test(metricType)) !== null) {
      if (testResult[2] === 'read') {
        initializeProperty(vm, `xvds.r.${testResult[1]}`)
        vm.xvds.r[testResult[1]].push(...STATS.vm.xvds.compute(data, legendKey))
        return
      }

      initializeProperty(vm, `xvds.w.${testResult[1]}`)
      vm.xvds.w[testResult[1]].push(...STATS.vm.xvds.compute(data, legendKey))
      return
    }

    if (STATS.vm.memoryFree.test(metricType)) {
      initializeProperty(vm, 'memoryFree')
      vm.memoryFree.push(...STATS.vm.memoryFree.compute(data, legendKey))
      return
    }

    if (STATS.vm.memory.test(metricType)) {
      initializeProperty(vm, 'memory')
      vm.memory.push(...STATS.vm.memory.compute(data, legendKey))
    }
  }

  async getStats (hostId, vmId) {
    const json = await readJson('../src/stats.json')
    forEach(json.meta.legend, (legend, key) => {
      const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(
        legend
      )

      if (type === 'host') {
        return this._handleHostStats(uuid, metricType, key, json.data)
      }

      if (type === 'vm') {
        if (vmId !== uuid) {
          return
        }
        return this._handleVmStats(uuid, metricType, key, json.data)
      }
    })

    return vmId !== undefined ? this._vms[vmId] : this._hosts[hostId]
  }
}

// const test1 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69').then(res => console.log(res))
// const test2 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69', '69196054-4ce4-d4cd-5e72-2f7db33b695f').then(res => console.log(res))
