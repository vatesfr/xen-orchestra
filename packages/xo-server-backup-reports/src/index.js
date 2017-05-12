import humanFormat from 'human-format'
import moment from 'moment'
import { forEach } from 'lodash'

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

const logError = e => {
  console.error('backup report error:', e)
}

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

  _wrapper (status) {
    return new Promise(resolve => resolve(this._listener(status))).catch(logError)
  }

  _listener (status) {
    let globalAverageSpeed = 0
    let nCalls = 0
    let nSuccess = 0
    let reportOnFailure
    let reportWhen

    const failedBackupsText = []
    const nagiosText = []
    const successfulBackupText = []

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
      reportOnFailure = reportWhen === 'failure' || reportWhen === 'fail'

      if (reportWhen === 'never') {
        return
      }

      nCalls++
      if (!call.error) {
        nSuccess++
      }

      let vm

      try {
        vm = this._xo.getObject(call.params.id || call.params.vm)
      } catch (e) {}

      const start = moment(call.start)
      const end = moment(call.end)
      const duration = moment.duration(end - start).humanize()

      if (call.error) {
        failedBackupsText.push(
          `### VM : ${vm ? vm.name_label : 'not found'}`,
          `  - UUID: ${vm ? vm.uuid : call.params.id}`,
          `  - Error: ${call.error.message}`,
          `  - Start time: ${String(start)}`,
          `  - End time: ${String(end)}`,
          `  - Duration: ${duration}`,
          ''
        )

        nagiosText.push(
          `[ ${vm ? vm.name_label : 'undefined'} : ${call.error.message} ]`
        )
      } else if (!reportOnFailure) {
        let averageSpeed

        if (call.method === 'vm.rollingBackup' || call.method === 'vm.rollingDeltaBackup') {
          const dataLength = call.returnedValue.size
          averageSpeed = dataLength / moment.duration(end - start).asSeconds()
          globalAverageSpeed += averageSpeed
        }

        successfulBackupText.push(
          `### VM : ${vm.name_label}`,
          `  - UUID: ${vm.uuid}`,
          `  - Start time: ${String(start)}`,
          `  - End time: ${String(end)}`,
          `  - Duration: ${duration}`
        )

        if (averageSpeed !== undefined) {
          successfulBackupText.push(`  - Average speed: ${humanFormat(
            averageSpeed,
            { scale: 'binary', unit: 'B/S' }
          )}`)
        }
        successfulBackupText.push('')
      }
    })

    // No backup calls.
    if (nCalls === 0) {
      return
    }

    const globalSuccess = nSuccess === nCalls
    if (globalSuccess && (
      reportWhen === 'fail' || // xo-web < 5
      reportWhen === 'failure' // xo-web >= 5
    )) {
      return
    }

    const start = moment(status.start)
    const end = moment(status.end)
    const duration = moment.duration(end - start).humanize()
    let method = status.calls[Object.keys(status.calls)[0]].method
    method = method.slice(method.indexOf('.') + 1)
      .replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase()) // humanize
    const tag = status.calls[Object.keys(status.calls)[0]].params.tag
    const failIcon = '\u274C'
    const successIcon = '\u2705'

    if (nCalls - nSuccess > 0) {
      failedBackupsText.unshift(`## Failed backups: ${failIcon}`, '')
    }
    if (nSuccess > 0 && !reportOnFailure) {
      successfulBackupText.unshift(`## Successful backups: ${successIcon}`, '')
    }

    // Global status.
    const globalText = [
      `## Global status for "${tag}" (${method}): ${globalSuccess ? `Success ${successIcon}` : `Fail ${failIcon}`}`,
      `  - Start time: ${String(start)}`,
      `  - End time: ${String(end)}`,
      `  - Duration: ${duration}`,
      `  - Successful backed up VM number: ${nSuccess}`,
      `  - Failed backed up VM: ${nCalls - nSuccess}`
    ]
    if (globalAverageSpeed !== 0) {
      globalText.push(`  - Average speed: ${humanFormat(
        globalAverageSpeed / nSuccess,
        { scale: 'binary', unit: 'B/S' }
      )}`)
    }
    globalText.push('')

    const markdown = globalText.concat(failedBackupsText, successfulBackupText).join('\n')
    const markdownNagios = nagiosText.join(' ')

    // TODO : Handle errors when `sendEmail` isn't present. (Plugin dependencies)

    const xo = this._xo
    return Promise.all([
      xo.sendEmail && xo.sendEmail({
        to: this._mailsReceivers,
        subject: `[Xen Orchestra][${globalSuccess ? 'Success' : 'Failure'}] Backup report for ${tag}`,
        markdown
      }),
      xo.sendToXmppClient && xo.sendToXmppClient({
        to: this._xmppReceivers,
        message: markdown
      }),
      xo.sendSlackMessage && xo.sendSlackMessage({
        message: markdown
      }),
      xo.sendPassiveCheck && xo.sendPassiveCheck({
        status: globalSuccess ? 0 : 2,
        message: globalSuccess ? `[Xen Orchestra] [Success] Backup report for ${tag}` : `[Xen Orchestra] [Failure] Backup report for ${tag} - VMs : ${markdownNagios}`
      })
    ])
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
