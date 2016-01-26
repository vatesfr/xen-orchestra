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
  let max = -Infinity
  for (let i = 0; i < values.length; i++) {
    if (values > max) {
      max = values
    }
  }
  return max
}

function computeCpuMax (cpus) {
  return computeMax(cpus.map(computeMax))
}

function computeMin (values) {
  let min = +Infinity
  for (let i = 0; i < values.length; i++) {
    if (values < min) {
      min = values
    }
  }
  return min
}

function computeCpuMin (cpus) {
  return computeMin(cpus.map(computeMin))
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
    const stats = {}

    stats['lab1_days'] = require('/home/thannos/xo-server/lab1_days.json')
    stats['lab1_hours'] = require('/home/thannos/xo-server/lab1_hours.json')
    stats['lab2_days'] = require('/home/thannos/xo-server/lab2_days.json')
    stats['lab2_hours'] = require('/home/thannos/xo-server/lab2_hours.json')
    stats['nfs_days'] = require('/home/thannos/xo-server/nfs_days.json')
    stats['nfs_hours'] = require('/home/thannos/xo-server/nfs_hours.json')
    stats['salt_hours'] = require('/home/thannos/xo-server/salt_hours.json')
    stats['salt_days'] = require('/home/thannos/xo-server/salt_days.json')

    // ===================================================================

    // xo-cli generateCpuReport machine=lab1
    this._unsets.push(this._xo.api.addMethod('generateCpuReport', ({ machine }) => {
      // TODO: compute and returns CPU mean, min & max.
    }))

    this._unsets.push(this._xo.api.addMethod('generateLoadMeanL1Days', () => {
      return computeMean(parsedHostDaysLab1.stats.load)
    }))

    this._unsets.push(this._xo.api.addMethod('generateLoadMaxL1Days', () => {
      return computeMax(parsedHostDaysLab1.stats.load)
    }))

    this._unsets.push(this._xo.api.addMethod('generateLoadMinL1Days', () => {
      return computeMin(parsedHostDaysLab1.stats.load)
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
