import forEach from 'lodash.foreach'
import moment from 'moment'

export const configurationSchema = {
  type: 'object',

  properties: {
    toMails: {
      type: 'array',
      title: 'mails',
      description: 'an array of recipients (mails)',

      items: {
        type: 'string'
      },
      minItems: 1
    },
    toXmpp: {
      type: 'array',
      title: 'xmpp address',
      description: 'an array of recipients (xmpp)',

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

  configure ({ toMails, toXmpp }) {
    this._mailsReceivers = toMails
    this._xmppReceivers = toXmpp
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
    let reportWhen

    const text = []

    forEach(status.calls, call => {
      // Ignore call if it's not a Backup a Snapshot or a Disaster Recovery.
      if (call.method !== 'vm.deltaCopy' &&
          call.method !== 'vm.rollingDeltaBackup' &&
          call.method !== 'vm.rollingDrCopy' &&
          call.method !== 'vm.rollingSnapshot' &&
          call.method !== 'vm.rollingBackup') {
        return
      }

      reportWhen = call.params._reportWhen

      if (reportWhen === 'never') {
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

      let vm

      try {
        vm = this._xo.getObject(call.params.id || call.params.vm)
      } catch (e) {}

      const start = moment(call.start)
      const end = moment(call.end)
      const duration = moment.duration(end - start).humanize()

      text.push([
        `### VM : ${vm ? vm.name_label : 'undefined'}`,
        `  - UUID: ${vm ? vm.uuid : 'undefined'}`,
        `  - Status: ${vmStatus}`,
        `  - Start time: ${String(start)}`,
        `  - End time: ${String(end)}`,
        `  - Duration: ${duration}`
      ].join('\n'))
    })

    // No backup calls.
    if (nCalls === 0) {
      return
    }

    const globalStatus = nSuccess === nCalls ? 'Success' : 'Fail'
    const start = moment(status.start)
    const end = moment(status.end)
    const duration = moment.duration(end - start).humanize()
    const tag = status.calls[status.start].params.tag

    if (reportWhen === 'fail' && globalStatus === 'Success') {
      return
    }

    // Global status.
    text.unshift([
      `## Global status for "${tag}": ${globalStatus}`,
      `  - Start time: ${String(start)}`,
      `  - End time: ${String(end)}`,
      `  - Duration: ${duration}`,
      `  - Successful backed up VM number: ${nSuccess}`,
      `  - Failed backed up VM: ${nCalls - nSuccess}`
    ].join('\n'))

    const markdown = text.join('\n')

    // TODO : Handle errors when `sendEmail` isn't present. (Plugin dependencies)

    if (this._xo.sendEmail) {
      await this._xo.sendEmail({
        to: this._mailsReceivers,
        subject: `Backup Reports for "${tag}" (XenOrchestra)`,
        markdown
      })
    }

    if (this._xo.sendToXmppClient) {
      this._xo.sendToXmppClient({
        to: this._xmppReceivers,
        message: markdown
      })
    }
  }
}

// ===================================================================

export default ({xo}) => new BackupReportsXoPlugin(xo)
