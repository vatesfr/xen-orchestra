import { readJson } from 'fs-extra'
import { map, forEach, endsWith } from 'lodash'

const STATS = {
  host: {
    cpus: {
      test: legendType => /^cpu([0-9]+)$/.exec(legendType),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 100)
    },
    pifs: {
      test: legendType => /^pif_eth([0-9]+)_(rx|tx)$/.exec(legendType),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey])
    },
    load: {
      test: legendType => legendType === 'loadavg',
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey])
    },
    memoryFree: {
      test: legendType => legendType === 'memory_free_kib',
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 1024)
    },
    memory: {
      test: legendType => legendType === 'memory_total_kib',
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 1024)
    },
  },
  vm: {
    cpus: {
      test: legendType => /^cpu([0-9]+)$/.exec(legendType),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 100),
    },
    vifs: {
      test: legendType => /^vif_([0-9]+)_(rx|tx)$/.exec(legendType),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey]),
    },
    xvds: {
      test: legendType => /^vbd_xvd(.)_(read|write)$/.exec(legendType),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey]),
    },
    memoryFree: {
      test: legendType => legendType === 'memory_internal_free',
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 1024),
    },
    memory: {
      test: legendType => endsWith(legendType, 'memory'),
      compute: (dataRow, legendKey) => map(dataRow, ({ values }) => values[legendKey] * 1024),
    },
  }
}


const initialiseProperty = (obj, deep) => {
  const splitedDeep = deep.split('.')
  forEach(splitedDeep, (deep, key) => {
    if (obj[deep] === undefined) {
      obj = obj[deep] = splitedDeep.length -1 === key ? [] : {}
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

  _handleHostStats (uuid, legendType, legendKey, data) {
    let host
    this._hosts[uuid] = (host = this._hosts[uuid] || {})

    let testResult
    if ((testResult = STATS.host.cpus.test(legendType)) !== null) {
      initialiseProperty(host, `cpus.${testResult[1]}`)
      host.cpus[testResult[1]].push(...STATS.host.cpus.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.host.pifs.test(legendType)) !== null) {
      if (testResult[2] === 'rx') {
        initialiseProperty(host, `pifs.rx.${testResult[1]}`)
        host.pifs.rx[testResult[1]].push(...STATS.host.pifs.compute(data, legendKey))
        return
      }

      initialiseProperty(host, `pifs.tx.${testResult[1]}`)
      host.pifs.tx[testResult[1]].push(...STATS.host.pifs.compute(data, legendKey))
      return
    }

    if (STATS.host.load.test(legendType)) {
      initialiseProperty(host, 'load')
      host.load.push(...STATS.host.load.compute(data, legendKey))
      return
    }

    if (STATS.host.memoryFree.test(legendType)) {
      initialiseProperty(host, 'memoryFree')
      host.memoryFree.push(...STATS.host.memoryFree.compute(data, legendKey))
      return
    }

    if (STATS.host.memory.test(legendType)) {
      initialiseProperty(host, 'memory')
      host.memory.push(...STATS.host.memory.compute(data, legendKey))
      return
    }
  }

  _handleVmStats (uuid, legendType, legendKey, data) {
    let vm
    this._vms[uuid] = (vm = this._vms[uuid] || {})

    let testResult
    if ((testResult = STATS.vm.cpus.test(legendType)) !== null) {
      initialiseProperty(vm, `cpus.${testResult[1]}`)
      vm.cpus[testResult[1]].push(...STATS.vm.cpus.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.vm.vifs.test(legendType)) !== null) {
      if (testResult[2] === 'rx') {
        initialiseProperty(vm, `vifs.rx.${testResult[1]}`)
        vm.vifs.rx[testResult[1]].push(...STATS.vm.vifs.compute(data, legendKey))
        return
      }

      initialiseProperty(vm, `vifs.tx.${testResult[1]}`)
      vm.vifs.tx[testResult[1]].push(...STATS.vm.vifs.compute(data, legendKey))
      return
    }

    if ((testResult = STATS.vm.xvds.test(legendType)) !== null) {
      if (testResult[2] === 'read') {
        initialiseProperty(vm, `xvds.r.${testResult[1]}`)
        vm.xvds.r[testResult[1]].push(...STATS.vm.xvds.compute(data, legendKey))
        return
      }

      initialiseProperty(vm, `xvds.w.${testResult[1]}`)
      vm.xvds.w[testResult[1]].push(...STATS.vm.xvds.compute(data, legendKey))
      return
    }

    if (STATS.vm.memoryFree.test(legendType)) {
      initialiseProperty(vm, 'memoryFree')
      vm.memoryFree.push(...STATS.vm.memoryFree.compute(data, legendKey))
      return
    }

    if (STATS.vm.memory.test(legendType)) {
      initialiseProperty(vm, 'memory')
      vm.memory.push(...STATS.vm.memory.compute(data, legendKey))
      return
    }
  }

  async getStats (hostId, vmId) {
    const json = await readJson('../src/stats.json')
    forEach(json.meta.legend, (legend, key) => {
      const [, type, uuid, legendType] = /^AVERAGE:(host|vm):(.+):(.+)$/.exec(legend)

      if (type === 'host') {
        return this._handleHostStats(uuid, legendType, key, json.data)
      }

      if (vmId !== uuid) {
        return
      }
      this._handleVmStats(uuid, legendType, key, json.data)
    })

    return vmId !== undefined
      ? this._vms[vmId]
      : this._hosts[hostId]
  }
}

//const test1 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69').then(res => console.log(res))
// const test2 = new Stats().getStats('77b3f6ad-020b-4e48-b090-74b2a26c4f69', '69196054-4ce4-d4cd-5e72-2f7db33b695f').then(res => console.log(res))
