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

function computeCpuMean (cpus) {
  return computeMean(cpus.map(computeMean))
}

function computeMax (values) {
  // TODO
}

function computeCpuMax (cpus) {
  return computeMax(cpus.map(computeMax))
}

function computeMin (values) {
  // TODO
}

// TODO
function computeCpuMin (cpus) {
  // TODO: rebase on top of computeMin()

  let min = +Infinity

  for (let i = 0; i < cpus.length; i++) {
    const valuesByDay = cpus[i]

    for (let j = 0; j < valuesByDay.length; j++) {
      const value = valuesByDay[j]

      if (value < min) {
        min = value
      }
    }
  }

  return min
}

// ===================================================================

class UsageReportPlugin {
  constructor (xo) {
    this._xo = xo
    this._unset = null
  }

  configure ({emails}) {
    this.mailsReceivers = emails
  }
  load () {
    // TODO
    // pour hours enlever les null
    let parsedHostDaysLab1 = require('/home/thannos/xo-server/lab1_days.json')
    let parsedHostHoursLab1 = require('/home/thannos/xo-server/lab1_hours.json')
    let parsedHostDaysLab2 = require('/home/thannos/xo-server/lab2_days.json')
    let parsedHostHoursLab2 = require('/home/thannos/xo-server/lab2_hours.json')
    let parsedVmDaysNfs = require('/home/thannos/xo-server/nfs_days.json')
    let parsedVmHoursNfs = require('/home/thannos/xo-server/nfs_hours.json')
    let parsedVmHoursSalt = require('/home/thannos/xo-server/salt_hours.json')
    let parsedVmDaysSalt = require('/home/thannos/xo-server/salt_days.json')
    // ===================================================================
    this._unset = this._xo.api.addMethod('generateUsageReport', () => {
      return 'heracles'
    })
    this._unset = this._xo.api.addMethod('generateCpuMeanL1Days', () => {
      return computeCpuMean(parsedHostDaysLab1.stats.cpus)
    })
    this._unset = this._xo.api.addMethod('generateCpuMaxL1Days', () => {
      return computeCpuMax(parsedHostDaysLab1.stats.cpus)
    })
    this._unset = this._xo.api.addMethod('generateCpuMinL1Days', () => {
      return computeCpuMin(parsedHostDaysLab1.stats.cpus)
    })

    this._unset = this._xo.api.addMethod('generateLoadMeanL1Days', () => {
      return computeMean(parsedHostDaysLab1.stats.load)
    })

    this._unset = this._xo.api.addMethod('generateLoadMaxL1Days', () => {
      return computeMax(parsedHostDaysLab1.stats.load)
    })

    this._unset = this._xo.api.addMethod('generateLoadMinL1Days', () => {
      return computeMin(parsedHostDaysLab1.stats.load)
    })

    this._unset = this._xo.api.addMethod('generateCpuMeanL2Days', () => {
      return computeCpuMean(parsedHostDaysLab2.stats.cpus)
    })
    this._unset = this._xo.api.addMethod('generateCpuMaxL2Days', () => {
      return computeCpuMax(parsedHostDaysLab2.stats.cpus)
    })
    this._unset = this._xo.api.addMethod('generateCpuMinL2Days', () => {
      return computeCpuMin(parsedHostDaysLab2.stats.cpus)
    })

    this._unset = this._xo.api.addMethod('generateCpuMeanNfsDays', () => {
      return computeCpuMean(parsedVmDaysNfs.stats.cpus)
    })
    this._unset = this._xo.api.addMethod('generateCpuMeanSaltDays', () => {
      return computeCpuMean(parsedVmDaysSalt.stats.cpus)
    })
    // CONCATENATION
    // totalMean = `${MeanenneCpuLab1}${MeanenneCpuLab2}`
  }
  unload () {
    this._unset()
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
