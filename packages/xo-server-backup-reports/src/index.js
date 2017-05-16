import humanFormat from 'human-format'
import moment from 'moment'
import { forEach, startCase } from 'lodash'

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

const ICON_FAILURE = '\u274C'
const ICON_SUCCESS = '\u2705'

const formatDate = timestamp =>
  moment(timestamp).format()

const formatDuration = milliseconds =>
  moment.duration(milliseconds).humanize()

const formatMethod = method =>
  startCase(method.slice(method.indexOf('.') + 1))

const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B'
  })

const formatSpeed = (bytes, milliseconds) =>
  humanFormat(bytes * 1e3 / milliseconds, {
    scale: 'binary',
    unit: 'B/S'
  })

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
    const { calls } = status
    const callIds = Object.keys(calls)

    const nCalls = callIds.length
    if (nCalls === 0) {
      return
    }

    const oneCall = calls[callIds[0]]

    const reportWhen = oneCall.params._reportWhen
    if (reportWhen === 'never') {
      return
    }

    const { method } = oneCall
    if (
      method !== 'vm.deltaCopy' &&
      method !== 'vm.rollingBackup' &&
      method !== 'vm.rollingDeltaBackup' &&
      method !== 'vm.rollingDrCopy' &&
      method !== 'vm.rollingSnapshot'
    ) {
      return
    }

    const reportOnFailure =
      reportWhen === 'fail' || // xo-web < 5
      reportWhen === 'failure'  // xo-web >= 5

    let globalSize = 0
    let nFailures = 0

    const failedBackupsText = []
    const nagiosText = []
    const successfulBackupText = []

    forEach(calls, call => {
      const { id = call.params.vm } = call.params

      let vm
      try {
        vm = this._xo.getObject(id)
      } catch (e) {}

      const { end, start } = call
      const duration = end - start
      const text = [
        `### ${vm !== undefined ? vm.name_label : 'VM not found'}`,
        '',
        `- UUID: ${vm !== undefined ? vm.uuid : id}`,
        `- Start time: ${formatDate(start)}`,
        `- End time: ${formatDate(end)}`,
        `- Duration: ${formatDuration(duration)}`
      ]

      const { error } = call
      if (error !== undefined) {
        ++nFailures

        const { message } = error

        failedBackupsText.push(
          ...text,
          `- Error: ${message}`,
          ''
        )

        nagiosText.push(
          `[ ${vm !== undefined ? vm.name_label : 'undefined'} : ${message} ]`
        )
      } else if (!reportOnFailure) {
        const { returnedValue } = call
        let size
        if (
          returnedValue != null &&
          (size = returnedValue.size) !== undefined
        ) {
          globalSize += size
          text.push(
            `- Size: ${formatSize(size)}`,
            `- Speed: ${formatSpeed(size, duration)}`
          )
        }

        successfulBackupText.push(
          ...text,
          ''
        )
      }
    })

    if (reportOnFailure && nFailures === 0) {
      return
    }

    const { end, start } = status
    const { tag } = oneCall.params
    const duration = end - start
    const globalSuccess = nFailures === 0
    const nSuccesses = nCalls - nFailures

    let markdown = [
      `## Global status for "${tag}" (${formatMethod(method)}): ${
        nFailures === 0 ? `Success ${ICON_SUCCESS}` : `Failure ${ICON_FAILURE}`
      }`,
      '',
      `- Start time: ${formatDate(start)}`,
      `- End time: ${formatDate(end)}`,
      `- Duration: ${formatDuration(duration)}`,
      `- Successes: ${nSuccesses}`,
      `- Failures: ${nFailures}`
    ]
    if (globalSize !== 0) {
      markdown.push(
        `- Size: ${formatSize(globalSize)}`,
        `- Speed: ${formatSpeed(globalSize, duration)}`
      )
    }
    markdown.push('')

    if (nFailures !== 0) {
      markdown.push(
        `## ${ICON_FAILURE} Failures (${nFailures})`,
        '',
        ...failedBackupsText
      )
    }

    if (nSuccesses !== 0 && !reportOnFailure) {
      markdown.push(
        `## ${ICON_SUCCESS} Successes (${nSuccesses})`,
        '',
        ...successfulBackupText
      )
    }

    markdown = markdown.join('\n')
    console.log(markdown)

    const xo = this._xo
    return Promise.all([
      xo.sendEmail !== undefined && xo.sendEmail({
        to: this._mailsReceivers,
        subject: `[Xen Orchestra][${globalSuccess ? 'Success' : 'Failure'}] Backup report for ${tag}`,
        markdown
      }),
      xo.sendToXmppClient !== undefined && xo.sendToXmppClient({
        to: this._xmppReceivers,
        message: markdown
      }),
      xo.sendSlackMessage !== undefined && xo.sendSlackMessage({
        message: markdown
      }),
      xo.sendPassiveCheck !== undefined && xo.sendPassiveCheck({
        status: globalSuccess ? 0 : 2,
        message: globalSuccess
          ? `[Xen Orchestra] [Success] Backup report for ${tag}`
          : `[Xen Orchestra] [Failure] Backup report for ${tag} - VMs : ${nagiosText.join(' ')}`
      })
    ])
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
