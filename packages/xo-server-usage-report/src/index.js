import forEach from 'lodash.foreach'
import { all } from 'promise-toolbox'

export const configurationSchema = {
  type: 'object',

  properties: {
    emails: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    periodicity: {
      type: 'string',
      description: 'enter monthly or weekly'
    }
  },

  additionalProperties: false,
  required: [ 'emails', 'periodicity' ]
}

// ===================================================================
function computeMean (values) {
  let sum = 0
  let tot = 0
  forEach(values, (val) => {
    sum += val || 0
    tot += val ? 1 : 0
  })
  return sum / tot
}
function computeMax (values) {
  let max = -Infinity
  forEach(values, (val) => {
    if (val && val > max) {
      max = val
    }
  })
  return max
}
function computeMin (values) {
  let min = +Infinity
  forEach(values, (val) => {
    if (val && val < min) {
      min = val
    }
  })
  return min
}
function computeCpuMax (cpus) {
  return sortArray(cpus.map(computeMax))
}
function computeCpuMin (cpus) {
  return computeMin(cpus.map(computeMin))
}
function computeCpuMean (cpus) {
  return computeMean(cpus.map(computeMean))
}

function compareNumbersDesc (a, b) {
  if (a > b) {
    return -1
  }
  if (a < b) {
    return 1
  }
  return 0
}
function sortArray (values) {
  let n = 3
  let sort = values.sort(compareNumbersDesc)
  return sort.slice(0, n)
}

// ===================================================================

class UsageReportPlugin {
  constructor (xo) {
    this._xo = xo
    this._unsets = []
  }

  configure ({emails}) {
    this.mailsReceivers = emails
  }
  load () {
    const this_ = this
    // TOP Max Cpu
    this._unsets.push(this._xo.api.addMethod('generateCpu', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxCpu = computeCpuMax(machineStats.stats.cpus)
      return {
        'max': maxCpu
      }
    }))
    // TOP Max Load
    // xo-cli generate machine=4a2dccec-83ff-4212-9e16-44fbc0527961 granularity=days
    this._unsets.push(this._xo.api.addMethod('generateLoad', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxLoad = sortArray(machineStats.stats.load)
      return {
        'max': maxLoad
      }
    }))
    // TOP Max Memory
    this._unsets.push(this._xo.api.addMethod('generateMemory', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxMemory = sortArray(machineStats.stats.memory)
      return {
        'max': maxMemory
      }
    }))
    // TOP Max MemoryUsed
    this._unsets.push(this._xo.api.addMethod('generateMemoryUsed', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxMemoryUsed = sortArray(machineStats.stats.memoryUsed)
      return {
        'max': maxMemoryUsed
      }
    }))
// =============================================================================
    // STATS min, max, mean
    this._unsets.push(this._xo.api.addMethod('generateGlobalCpuReport', async ({ machines, granularity }) => {
      machines = machines.split(',')
      const hostMean = {}
      for (let machine of machines) {
        const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
        const cpusMean = []
        forEach(machineStats.stats.cpus, (cpu) => {
          cpusMean.push(computeMean(cpu))
        })
        hostMean[machine] = computeMean(cpusMean)
      }
      return hostMean
    }))

    // Single host: get stats from its VMs.
    // Returns { vm1_Id: vm1_Stats, vm2_Id: vm2_Stats, ... }
    async function _getHostVmsStats (machine, granularity) {
      const host = await this_._xo.getObject(machine)
      const objects = await this_._xo.getObjects()

      const promises = {}
      forEach(objects, (obj) => {
        if (obj.type === 'VM' && obj.power_state === 'Running' && obj.$poolId === host.$poolId) {
          promises[obj.id] = this_._xo.getXapiVmStats(obj, granularity)
        }
      })

      return promises::all()
    }

    this._unsets.push(this._xo.api.addMethod('generateHostVmsReport', async ({ machine, granularity }) => {
      return _getHostVmsStats(machine, granularity)
    }))

    // Multiple hosts: get stats from all of their VMs
    // Returns  {   host1_Id: { vm1_Id: vm1_Stats, vm2_Id: vm2_Stats }
    //              host2_Id: { vm3_Id: vm3_Stats }                     }
    async function _getHostsVmsStats (machines, granularity) {
      machines = machines.split(',')

      const promises = {}
      forEach(machines, (machine) => {
        promises[machine] = _getHostVmsStats(machine, granularity)
      })

      return promises::all()
    }
    this._unsets.push(this._xo.api.addMethod('generateHostsVmsReport', async ({ machines, granularity }) => {
      return _getHostsVmsStats(machines, granularity)
    }))
    // xo-cli generateGlobalCpuReport machines=4a2dccec-83ff-4212-9e16-44fbc0527961,cc3e7067-e18a-4bdf-8a8c-67922c64a75b granularity=days
    this._unsets.push(this._xo.api.addMethod('generateGlobalCpuReport', async ({ machines, granularity }) => {
      machines = machines.split(',')
      const hostMean = {}
      for (let machine of machines) {
        const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
        const cpusMean = []
        forEach(machineStats.stats.cpus, (cpu) => {
          cpusMean.push(computeMean(cpu))
        })
        hostMean[machine] = sortArray(cpusMean)
      }
      return hostMean
    }))
    this._unsets.push(this._xo.api.addMethod('generateGlobalMemoryUsedReport', async ({ machines, granularity }) => {
      machines = machines.split(',')
      const hostMean = {}
      for (let machine of machines) {
        const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
        const memoryUsedMean = []
        forEach(machineStats.stats.memoryUsed, (cpu) => {
          memoryUsedMean.push(computeMean)
        })
        hostMean[machine] = sortArray(memoryUsedMean)
      }
      return hostMean
    }))
    // let maxMemoryUsed = sortArray(machineStats.stats.memoryUsed)
    // Cpus
    this._unsets.push(this._xo.api.addMethod('generateCpuReport', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxCpu = computeCpuMax(machineStats.stats.cpus)
      let minCpu = computeCpuMin(machineStats.stats.cpus)
      let meanCpu = computeCpuMean(machineStats.stats.cpus)

      return {
        'max': maxCpu,
        'min': minCpu,
        'mean': meanCpu
      }
    }))
    // Load
    this._unsets.push(this._xo.api.addMethod('generateLoadReport', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxLoad = computeMax(machineStats.stats.load)
      let minLoad = computeMin(machineStats.stats.load)
      let meanLoad = computeMean(machineStats.stats.load)

      return {
        'max': maxLoad,
        'min': minLoad,
        'mean': meanLoad
      }
    }))
    // Memory
    this._unsets.push(this._xo.api.addMethod('generateMemoryReport', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxMemory = computeMax(machineStats.stats.memory)
      let minMemory = computeMin(machineStats.stats.memory)
      let meanMemory = computeMean(machineStats.stats.memory)

      return {
        'max': maxMemory,
        'min': minMemory,
        'mean': meanMemory
      }
    }))
    // MemoryUsed
    this._unsets.push(this._xo.api.addMethod('generateMemoryUsedReport', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxMemoryUsed = computeMax(machineStats.stats.memoryUsed)
      let minMemoryUsed = computeMin(machineStats.stats.memoryUsed)
      let meanMemoryUsed = computeMean(machineStats.stats.memoryUsed)

      return {
        'max': maxMemoryUsed,
        'min': minMemoryUsed,
        'mean': meanMemoryUsed
      }
    }))
    // MemoryFree
    this._unsets.push(this._xo.api.addMethod('generateMemoryFreeReport', async ({ machine, granularity }) => {
      const machineStats = await this_._xo.getXapiHostStats(this_._xo.getObject(machine), granularity)
      let maxMemoryFree = computeMax(machineStats.stats.memoryFree)
      let minMemoryFree = computeMin(machineStats.stats.memoryFree)
      let meanMemoryFree = computeMean(machineStats.stats.memoryFree)

      return {
        'max': maxMemoryFree,
        'min': minMemoryFree,
        'mean': meanMemoryFree
      }
    }))
  }

  unload () {
    for (let i = 0; i < this._unsets; ++i) {
      this._unsets[i]()
    }

    this._unsets.length = 0
  }
}

  /* if (this._xo.sendEmail) {
    await this._xo.sendEmail({
        to: this._mailsReceivers,
        // subject: 'Usage Reports (XenOrchestra)',
        markdown
      })
    }
    else {
      throw 'error, sendEmail does not exist'
    } */
 /* if (periodicity = 'monthly') {
   throw console.log('monthly')
 }  else {} */
/* var data = {},
  dir = __dirname + '/home/thannos/xo-server/lab1_days.json'
fs.readdirSync(dir).forEach(function (file) {
  data[file.replace(/\.json$/, '')] = require(dir + file)
}) */

// ===================================================================

export default ({ xo }) => new UsageReportPlugin(xo)

// ===================================================================
