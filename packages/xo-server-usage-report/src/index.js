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
    this._unset = this._xo.api.addMethod('generateCpuMoyL1Days', () => {
      let moyenneCpu = 0
      let nb = 0
      for (let i = 0; i < parsedHostDaysLab1.stats.cpus.length;i++) {
        for (let j = 0; j < parsedHostDaysLab1.stats.cpus[i].length;j++) {
          if (parsedHostDaysLab1.stats.cpus[i][j]) {
            moyenneCpu += parsedHostDaysLab1.stats.cpus[i][j]
            nb++
          }
        }
      }
      moyenneCpu = moyenneCpu / (nb)
      return moyenneCpu
    })
    // trouver le max
    this._unset = this._xo.api.addMethod('generateCpuMaxL1Days', () => {
      let nb = 0
      let max = 0
      if (parsedHostDaysLab1.stats.cpus[0][0]) {
        let max = parsedHostDaysLab1.stats.cpus[0][0]
      }
      for (let i = 0; i < parsedHostDaysLab1.stats.cpus.length;i++) {
        for (let j = 0; j < parsedHostDaysLab1.stats.cpus[i].length;j++) {
          if (parsedHostDaysLab1.stats.cpus[i][j]) {
            {
              if (parsedHostDaysLab1.stats.cpus[i][j] > max) {
                max = parsedHostDaysLab1.stats.cpus[i][j]
              }
            }
            nb++
          }
        }
      }
      return max
    })
    // trouver le min
    this._unset = this._xo.api.addMethod('generateCpuMinL1Days', () => {
      let nb = 0
      let min = 0
      if (parsedHostDaysLab1.stats.cpus[0][0]) {
        let min = parsedHostDaysLab1.stats.cpus[0][0]
      }
      for (let i = 0; i < parsedHostDaysLab1.stats.cpus.length;i++) {
        for (let j = 0; j < parsedHostDaysLab1.stats.cpus[i].length;j++) {
          if (parsedHostDaysLab1.stats.cpus[i][j]) {
            {
              if (parsedHostDaysLab1.stats.cpus[i][j] < min) {
                min = parsedHostDaysLab1.stats.cpus[i][j]
              }
            }
            nb++
          }
        }
      }
      return min
    })
    // error peer
    // this._unset = this._xo.api.addMethod('generateLoadMoyL1Days', () => {
    //   let moyenneL = 0
    //   let nb = 0
    //   for (let i = 0; i < parsedHostDaysLab1.stats.load.length;i++) {
    //     for (let j = 0; j < parsedHostDaysLab1.stats.load[i].length;j++) {
    //       if (parsedHostDaysLab1.stats.load[i][j]) {
    //         moyenneL += parsedHostDaysLab1.stats.load[i][j]
    //         nb++
    //       }
    //     }
    //   }
    //   moyenneL = moyenneL / (nb)
    //   return moyenneL
    // })
    this._unset = this._xo.api.addMethod('generateCpuMoyL2Days', () => {
      let moyenneCpu = 0
      let nb = 0
      for (let i = 0; i < parsedHostDaysLab2.stats.cpus.length;i++) {
        for (let j = 0; j < parsedHostDaysLab2.stats.cpus[i].length;j++) {
          if (parsedHostDaysLab2.stats.cpus[i][j]) {
            moyenneCpu += parsedHostDaysLab2.stats.cpus[i][j]
            nb++
          }
        }
      }
      moyenneCpu = moyenneCpu / (nb)
      return moyenneCpu
    })
    //
    this._unset = this._xo.api.addMethod('generateCpuMoyNfsDays', () => {
      let moyenneCpu = 0
      let nb = 0
      for (let i = 0; i < parsedVmDaysNfs.stats.cpus.length;i++) {
        for (let j = 0; j < parsedVmDaysNfs.stats.cpus[i].length;j++) {
          if (parsedVmDaysNfs.stats.cpus[i][j]) {
            moyenneCpu += parsedVmDaysNfs.stats.cpus[i][j]
            nb++
          }
        }
      }
      moyenneCpu = moyenneCpu / (nb)
      return moyenneCpu
    })
    this._unset = this._xo.api.addMethod('generateCpuMoySaltDays', () => {
      let moyenneCpu = 0
      let nb = 0
      for (let i = 0; i < parsedVmDaysSalt.stats.cpus.length;i++) {
        for (let j = 0; j < parsedVmDaysSalt.stats.cpus[i].length;j++) {
          if (parsedVmDaysSalt.stats.cpus[i][j]) {
            moyenneCpu += parsedVmDaysSalt.stats.cpus[i][j]
            nb++
          }
        }
      }
      moyenneCpu = moyenneCpu / (nb)
      return moyenneCpu // renvoie null
    })
    // CONCATENATION
    // totalMoy = `${moyenneCpuLab1}${moyenneCpuLab2}`
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
