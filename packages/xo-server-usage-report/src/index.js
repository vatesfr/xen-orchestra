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

  for (let i = 0; i < values.length; i++) {
    sum += values[i]
  }

  return sum / values.length
}
function computeMax (values) {
  let max = -Infinity
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) {
      max = values[i]
    }
  }
  return max
}
function computeMin (values) {
  let min = +Infinity
  for (let i = 0; i < values.length; i++) {
    if (values[i] < min) {
      min = values[i]
    }
  }
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
    // xo-cli generateLoadReport machine=4a2dccec-83ff-4212-9e16-44fbc0527961 granularity=days
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
