import forEach from 'lodash.foreach'
import { all } from 'promise-toolbox'
import sortBy from 'lodash.sortby'
import map from 'lodash.map'
import isFinite from 'lodash.isfinite'

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

    // Returns {  host1_Id: [ highestCpuUsage, ... , lowestCpuUsage ],
    //            host2_Id: [ highestCpuUsage, ... , lowestCpuUsage ]   }
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

    // Returns {  vm1_Id: { 'rx': vm1_RAverageUsage, 'tx': vm1_TAverageUsage }
    //            vm2_Id: { 'rx': vm2_RAverageUsage, 'tx': vm2_TAverageUsage }  }
    async function _getHostVmsNetworkUsage (machine, granularity) {
      const vmsStats = await _getHostVmsStats(machine, granularity)
      // Reading average usage of the network (all VIFs) for each resident VM
      const hostVmsNetworkStats = {}
      forEach(vmsStats, (vmStats, vmId) => {
        const reception = vmStats.stats.vifs.rx
        const transfer = vmStats.stats.vifs.tx

        const receptionVifsMeans = reception.map(vifStats => computeMean(vifStats))
        const transferVifsMeans = transfer.map(vifStats => computeMean(vifStats))

        const receptionMean = computeMean(receptionVifsMeans)
        const transferMean = computeMean(transferVifsMeans)

        hostVmsNetworkStats[vmId] = { 'rx': receptionMean, 'tx': transferMean }
      })
      return hostVmsNetworkStats
    }

    // Returns {  'rx': [ vmA_Id: vmA_receptionMeanUsage, ..., vmB_Id: vmB_receptionMeanUsage ]
    //            'tx': [ vmC_Id: vmC_receptionMeanUsage, ..., vmD_Id: vmD_receptionMeanUsage ]   }
    // --> vmA is the most network using VM in reception
    async function _getHostVmsSortedNetworkUsage (machine, granularity) {
      const networkStats = await _getHostVmsNetworkUsage(machine, granularity)
      forEach(networkStats, (vmNetworkStats, vmId) => {
        vmNetworkStats.id = vmId
      })

      const sortedReception = sortBy(networkStats, vm => -vm.rx)
      const sortedTransfer = sortBy(networkStats, vm => -vm.tx)

      const sortedArrays = {
        'rx': map(sortedReception, vm => {
          return { 'id': vm.id, 'rx': vm.rx }
        }),
        'tx': map(sortedTransfer, vm => {
          return { 'id': vm.id, 'tx': vm.tx }
        })
      }

      return sortedArrays
    }

    this._unsets.push(this._xo.api.addMethod('generateHostNetworkReport', async ({ machine, granularity, criteria, number }) => {
      if (!criteria) {
        criteria = 'tx'
      }
      if (criteria !== 'tx' && criteria !== 'rx') {
        throw new Error('`criteria` must be either `tx` or `rx`')
      }
      if (!number) {
        number = 3
      }
      number = +number
      if (!isFinite(number)) {
        throw new Error('`number` must be a number')
      }
      const networkUsage = await _getHostVmsSortedNetworkUsage(machine, granularity)
      const sortedNetworkStats = networkUsage[criteria]
      return sortedNetworkStats.slice(0, number)
    }))

    // faire la moyenne pour chaque vm, puis la moyenne de cette moyenne pour chaque hote et faire moyenne finale
    this._unsets.push(this._xo.api.addMethod('generateGlobalMemoryUsedReport', async ({ machines, granularity }) => {
      // const stats = await _getHostsVmsStats(machines, granularity)

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
