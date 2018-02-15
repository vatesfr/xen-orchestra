import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { forEach, startCase } from 'lodash'

import pkg from '../package'

export const configurationSchema = {
  type: 'object',

  properties: {
    toMails: {
      type: 'array',
      title: 'mails',
      description: 'an array of recipients (mails)',

      items: {
        type: 'string',
      },
      minItems: 1,
    },
    toXmpp: {
      type: 'array',
      title: 'xmpp address',
      description: 'an array of recipients (xmpp)',

      items: {
        type: 'string',
      },
      minItems: 1,
    },
  },
}

// ===================================================================

const ICON_FAILURE = '🚨'
const ICON_SKIPPED = '⏩'
const ICON_SUCCESS = '✔'

const DATE_FORMAT = 'dddd, MMMM Do YYYY, h:mm:ss a'
const createDateFormater = timezone =>
  timezone !== undefined
    ? timestamp =>
      moment(timestamp)
        .tz(timezone)
        .format(DATE_FORMAT)
    : timestamp => moment(timestamp).format(DATE_FORMAT)

const formatDuration = milliseconds => moment.duration(milliseconds).humanize()

const formatMethod = method => startCase(method.slice(method.indexOf('.') + 1))

const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

const formatSpeed = (bytes, milliseconds) =>
  humanFormat(bytes * 1e3 / milliseconds, {
    scale: 'binary',
    unit: 'B/s',
  })

const logError = e => {
  console.error('backup report error:', e)
}

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const NO_SUCH_OBJECT_ERROR = 'no such object'

const isSkippedError = error =>
  error.message === UNHEALTHY_VDI_CHAIN_ERROR ||
  error.message === NO_SUCH_OBJECT_ERROR

class BackupReportsXoPlugin {
  constructor (xo) {
    this._xo = xo
    this._report = this._wrapper.bind(this)
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
    return new Promise(resolve => resolve(this._listener(status))).catch(
      logError
    )
  }

  _listener (status) {
    const { calls } = status
    const callIds = Object.keys(calls)

    const nCalls = callIds.length
    if (nCalls === 0) {
      return
    }

    const oneCall = calls[callIds[0]]

    const { _reportWhen: reportWhen = 'failure' } = oneCall.params
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

    const reportOnFailure = reportWhen === 'fail' || reportWhen === 'failure' // xo-web < 5 // xo-web >= 5

    let globalMergeSize = 0
    let globalTransferSize = 0
    let nFailures = 0
    let nSkipped = 0

    const failedBackupsText = []
    const nagiosText = []
    const skippedBackupsText = []
    const successfulBackupText = []

    const formatDate = createDateFormater(status.timezone)

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
        `- **UUID**: ${vm !== undefined ? vm.uuid : id}`,
        `- **Start time**: ${formatDate(start)}`,
        `- **End time**: ${formatDate(end)}`,
        `- **Duration**: ${formatDuration(duration)}`,
      ]

      const { error } = call
      if (error !== undefined) {
        const { message } = error

        if (isSkippedError(error)) {
          ++nSkipped
          skippedBackupsText.push(...text, `- **Reason**: ${message}`, '')

          nagiosText.push(
            `[(Skipped) ${
              vm !== undefined ? vm.name_label : 'undefined'
            } : ${message} ]`
          )
        } else {
          ++nFailures
          failedBackupsText.push(...text, `- **Error**: ${message}`, '')

          nagiosText.push(
            `[(Failed) ${
              vm !== undefined ? vm.name_label : 'undefined'
            } : ${message} ]`
          )
        }
      } else if (!reportOnFailure) {
        const { returnedValue } = call
        if (returnedValue != null) {
          const { mergeSize, transferSize } = returnedValue
          if (transferSize !== undefined) {
            globalTransferSize += transferSize
            text.push(
              `- **Transfer size**: ${formatSize(transferSize)}`,
              `- **Transfer speed**: ${formatSpeed(
                transferSize,
                returnedValue.transferDuration
              )}`
            )
          }
          if (mergeSize !== undefined) {
            globalMergeSize += mergeSize
            text.push(
              `- **Merge size**: ${formatSize(mergeSize)}`,
              `- **Merge speed**: ${formatSpeed(
                mergeSize,
                returnedValue.mergeDuration
              )}`
            )
          }
        }

        successfulBackupText.push(...text, '')
      }
    })

    const globalSuccess = nFailures === 0 && nSkipped === 0
    if (reportOnFailure && globalSuccess) {
      return
    }

    const { end, start } = status
    const { tag } = oneCall.params
    const duration = end - start
    const nSuccesses = nCalls - nFailures - nSkipped
    const globalStatus = globalSuccess
      ? `Success`
      : nFailures !== 0 ? `Failure` : `Skipped`

    let markdown = [
      `##  Global status: ${globalStatus}`,
      '',
      `- **Type**: ${formatMethod(method)}`,
      `- **Start time**: ${formatDate(start)}`,
      `- **End time**: ${formatDate(end)}`,
      `- **Duration**: ${formatDuration(duration)}`,
      `- **Successes**: ${nSuccesses} / ${nCalls}`,
    ]
    if (globalTransferSize !== 0) {
      markdown.push(`- **Transfer size**: ${formatSize(globalTransferSize)}`)
    }
    if (globalMergeSize !== 0) {
      markdown.push(`- **Merge size**: ${formatSize(globalMergeSize)}`)
    }
    markdown.push('')

    if (nFailures !== 0) {
      markdown.push(
        '---',
        '',
        `## ${nFailures} Failure${nFailures === 1 ? '' : 's'}`,
        '',
        ...failedBackupsText
      )
    }

    if (nSkipped !== 0) {
      markdown.push(
        '---',
        '',
        `## ${nSkipped} Skipped`,
        '',
        ...skippedBackupsText
      )
    }

    if (nSuccesses !== 0 && !reportOnFailure) {
      markdown.push(
        '---',
        '',
        `## ${nSuccesses} Success${nSuccesses === 1 ? '' : 'es'}`,
        '',
        ...successfulBackupText
      )
    }

    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)

    markdown = markdown.join('\n')

    const xo = this._xo
    return Promise.all([
      xo.sendEmail !== undefined &&
        xo.sendEmail({
          to: this._mailsReceivers,
          subject: `[Xen Orchestra] ${globalStatus} − Backup report for ${tag} ${
            globalSuccess
              ? ICON_SUCCESS
              : nFailures !== 0 ? ICON_FAILURE : ICON_SKIPPED
          }`,
          markdown,
        }),
      xo.sendToXmppClient !== undefined &&
        xo.sendToXmppClient({
          to: this._xmppReceivers,
          message: markdown,
        }),
      xo.sendSlackMessage !== undefined &&
        xo.sendSlackMessage({
          message: markdown,
        }),
      xo.sendPassiveCheck !== undefined &&
        xo.sendPassiveCheck({
          status: globalSuccess ? 0 : 2,
          message: globalSuccess
            ? `[Xen Orchestra] [Success] Backup report for ${tag}`
            : `[Xen Orchestra] [${
              nFailures !== 0 ? 'Failure' : 'Skipped'
            }] Backup report for ${tag} - VMs : ${nagiosText.join(' ')}`,
        }),
    ])
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
