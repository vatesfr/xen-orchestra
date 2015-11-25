import forEach from 'lodash.foreach'
import moment from 'moment'

export const configurationSchema = {
  type: 'object',
  properties: {
    to: {
      type: 'array',
      items: {
        type: 'string'
      },
      minItems: 1
    }
  }
}

// ===================================================================

class BackupReportsXoPlugin {
  constructor (xo) {
    this._xo = xo
    this._report = ::this._wrapper
  }

  configure ({to}) {
    this._receivers = to
  }

  load () {
    this._xo.on('job:terminated', this._report)
  }

  unload () {
    this._xo.removeListener('job:terminated', this._report)
  }

  async _wrapper (status) {
    try {
      await this._listener(status)
    } catch (e) {
      console.error('backup report error: ' + e)
    }
  }

  async _listener (status) {
    let nSuccess = 0
    let nCalls = 0

    const text = []

    forEach(status.calls, call => {
      // Ignore call if it's not a Backup or a Snapshot.
      if (call.method !== 'vm.rollingBackup' && call.method !== 'vm.rollingSnapshot') {
        return
      }

      let vmStatus

      if (call.error) {
        vmStatus = 'Fail'
      } else {
        nSuccess++
        vmStatus = 'Success'
      }

      nCalls++

      let vmName

      try {
        const vm = this._xo.getObject(call.params.id)
        vmName = vm.name_label
      } catch (e) {
        vmName = 'Vm name not found'
      }

      const start = moment(call.start)
      const end = moment(call.end)
      const duration = moment.duration(end - start).humanize()

      text.push([`### VM : ${vmName}`,
                 `UUID: ${call.params.id}`,
                 `Status: ${vmStatus}`,
                 `Start time: ${start.toString()}`,
                 `End time: ${end.toString()}`,
                 `Duration: ${duration}`
                ].join('\n  - '))
    })

    // No backup calls.
    if (nCalls === 0) {
      return
    }

    const globalStatus = nSuccess === nCalls
          ? 'Success'
          : 'Fail'

    const start = moment(status.start)
    const end = moment(status.end)
    const duration = moment.duration(end - start).humanize()

    // Global status.
    text.unshift([`## Global status: ${globalStatus}`,
                  `Start time: ${start.toString()}`,
                  `End time: ${end.toString()}`,
                  `Duration: ${duration}`,
                  `Successful backed up VM number: ${nSuccess}`,
                  `Failed backed up VM: ${nCalls - nSuccess}`
                 ].join('\n  - '))

    // TODO : Handle errors when `sendEmail` isn't present. (Plugin dependencies)
    this._xo.sendEmail({
      to: this._receivers,
      subject: 'Backup Reports (XenOrchestra)',
      markdown: text.join('\n')
    }).catch(e => console.error('Unable to send email: ', e))
  }
}

// ===================================================================

export default ({xo}) => new BackupReportsXoPlugin(xo)
