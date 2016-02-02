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
  return computeMax(cpus.map(computeMax))
}
function computeCpuMin (cpus) {
  return computeMin(cpus.map(computeMin))
}
function computeCpuMean (cpus) {
  return computeMean(cpus.map(computeMean))
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
    // xo-cli generateLoadReport machine=4a2dccec-83ff-4212-9e16-44fbc0527961 granularity=days
    this._unsets.push(this._xo.api.addMethod('generateLoadReport', async ({ machine, granularity }) => {
      const machineStats = await this._xo.getXapiHostStats(machine, granularity)

      let maxLoad = computeMax(machineStats.stats.load)
      let minLoad = computeMin(machineStats.stats.load)
      let meanLoad = computeMean(machineStats.stats.load)

      return {
        'max': maxLoad,
        'min': minLoad,
        'mean': meanLoad
      }
    }))

    // memory
    this._unsets.push(this._xo.api.addMethod('generateMemoryReport', ({ machine, granularity }) => {
      // TODO

      const machineStats = stats[`${machine}_${granularity}`]
      let maxMemory = computeMax(machineStats.stats.memory)
      let minMemory = computeMin(machineStats.stats.memory)
      let meanMemory = computeMean(machineStats.stats.memory)
      return {
        'max': maxMemory,
        'min': minMemory,
        'mean': meanMemory
      }
    }))
    // memoryUsed
    this._unsets.push(this._xo.api.addMethod('generateMemoryUsedReport', ({ machine, granularity }) => {
      // TODO

      const machineStats = stats[`${machine}_${granularity}`]
      let maxMemoryUsed = computeMax(machineStats.stats.memoryUsed)
      let minMemoryUsed = computeMin(machineStats.stats.memoryUsed)
      let meanMemoryUsed = computeMean(machineStats.stats.memoryUsed)
      return {
        'max': maxMemoryUsed,
        'min': minMemoryUsed,
        'mean': meanMemoryUsed
      }
    }))
    // memoryFree
    this._unsets.push(this._xo.api.addMethod('generateMemoryFreeReport', ({ machine, granularity }) => {
      // TODO

      const machineStats = stats[`${machine}_${granularity}`]
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
