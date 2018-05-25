import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { find, forEach, get, startCase } from 'lodash'

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

const NO_VMS_MATCH_THIS_PATTERN = 'no VMs match this pattern'
const NO_SUCH_OBJECT_ERROR = 'no such object'
const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_MESSAGE =
  '[(unhealthy VDI chain) Job canceled to protect the VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection)'

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

  _wrapper (status, job, schedule, runJobId) {
    return new Promise(resolve =>
      resolve(
        job.type === 'backup'
          ? this._backupNgListener(status, job, schedule, runJobId)
          : this._listener(status, job, schedule, runJobId)
      )
    ).catch(logError)
  }

  async _backupNgListener (_1, _2, { timezone }, runJobId) {
    const xo = this._xo
    const logs = await xo.getBackupNgLogs(runJobId)
    const jobLog = logs['roots'][0]
    const vmsTaskLog = logs[jobLog.id]

    const { reportWhen, mode } = jobLog.data || {}
    if (reportWhen === 'never') {
      return
    }

    const formatDate = createDateFormater(timezone)
    const jobName = (await xo.getJob(jobLog.jobId, 'backup')).name

    if (jobLog.error !== undefined) {
      const [globalStatus, icon] =
        jobLog.error.message === NO_VMS_MATCH_THIS_PATTERN
          ? ['Skipped', ICON_SKIPPED]
          : ['Failure', ICON_FAILURE]
      let markdown = [
        `##  Global status: ${globalStatus}`,
        '',
        `- **mode**: ${mode}`,
        `- **Start time**: ${formatDate(jobLog.start)}`,
        `- **End time**: ${formatDate(jobLog.end)}`,
        `- **Duration**: ${formatDuration(jobLog.duration)}`,
        `- **Error**: ${jobLog.error.message}`,
        '---',
        '',
        `*${pkg.name} v${pkg.version}*`,
      ]

      markdown = markdown.join('\n')
      return this._sendReport({
        subject: `[Xen Orchestra] ${globalStatus} − Backup report for ${jobName} ${icon}`,
        markdown,
        nagiosStatus: 2,
        nagiosMarkdown: `[Xen Orchestra] [${globalStatus}] Backup report for ${jobName} - Error : ${
          jobLog.error.message
        }`,
      })
    }

    const failedVmsText = []
    const skippedVmsText = []
    const successfulVmsText = []
    const nagiosText = []

    let globalMergeSize = 0
    let globalTransferSize = 0
    let nFailures = 0
    let nSkipped = 0

    for (const vmTaskLog of vmsTaskLog || []) {
      const vmTaskStatus = vmTaskLog.status
      if (vmTaskStatus === 'success' && reportWhen === 'failure') {
        return
      }

      const vmId = vmTaskLog.data.id
      let vm
      try {
        vm = xo.getObject(vmId)
      } catch (e) {}
      const text = [
        `### ${vm !== undefined ? vm.name_label : 'VM not found'}`,
        '',
        `- **UUID**: ${vm !== undefined ? vm.uuid : vmId}`,
        `- **Start time**: ${formatDate(vmTaskLog.start)}`,
        `- **End time**: ${formatDate(vmTaskLog.end)}`,
        `- **Duration**: ${formatDuration(vmTaskLog.duration)}`,
      ]

      const failedSubTasks = []
      const operationsText = []
      const srsText = []
      const remotesText = []
      for (const subTaskLog of logs[vmTaskLog.taskId] || []) {
        const { data, status, result, message } = subTaskLog
        const icon =
          subTaskLog.status === 'success' ? ICON_SUCCESS : ICON_FAILURE
        const errorMessage = `  **Error**: ${get(result, 'message')}`

        if (message === 'snapshot') {
          operationsText.push(`- **Snapshot** ${icon}`)
          if (status === 'failure') {
            failedSubTasks.push('Snapshot')
            operationsText.push('', errorMessage)
          }
        } else if (data.type === 'remote') {
          const remoteId = data.id
          const remote = await xo.getRemote(remoteId).catch(() => {})
          remotesText.push(
            `- **${
              remote !== undefined ? remote.name : `Remote Not found`
            }** (${remoteId}) ${icon}`
          )
          if (status === 'failure') {
            failedSubTasks.push(remote !== undefined ? remote.name : remoteId)
            remotesText.push('', errorMessage)
          }
        } else {
          const srId = data.id
          let sr
          try {
            sr = xo.getObject(srId)
          } catch (e) {}
          const [srName, srUuid] =
            sr !== undefined ? [sr.name_label, sr.uuid] : [`SR Not found`, srId]
          srsText.push(`- **${srName}** (${srUuid}) ${icon}`)
          if (status === 'failure') {
            failedSubTasks.push(sr !== undefined ? sr.name_label : srId)
            srsText.push('', errorMessage)
          }
        }
      }

      if (operationsText.length !== 0) {
        operationsText.unshift(`#### Operations`, '')
      }
      if (srsText.length !== 0) {
        srsText.unshift(`#### SRs`, '')
      }
      if (remotesText.length !== 0) {
        remotesText.unshift(`#### remotes`, '')
      }
      const subText = [...operationsText, '', ...srsText, '', ...remotesText]
      const result = vmTaskLog.result
      if (vmTaskStatus === 'failure' && result !== undefined) {
        const { message } = result
        if (isSkippedError(result)) {
          ++nSkipped
          skippedVmsText.push(
            ...text,
            `- **Reason**: ${
              message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : message
            }`,
            ''
          )
          nagiosText.push(
            `[(Skipped) ${
              vm !== undefined ? vm.name_label : 'undefined'
            } : ${message} ]`
          )
        } else {
          ++nFailures
          failedVmsText.push(...text, `- **Error**: ${message}`, '')

          nagiosText.push(
            `[(Failed) ${
              vm !== undefined ? vm.name_label : 'undefined'
            } : ${message} ]`
          )
        }
      } else {
        let transferSize, transferDuration, mergeSize, mergeDuration

        forEach(logs[vmTaskLog.taskId], ({ taskId }) => {
          if (transferSize !== undefined) {
            return false
          }

          const transferTask = find(logs[taskId], { message: 'transfer' })
          if (transferTask !== undefined) {
            transferSize = transferTask.result.size
            transferDuration = transferTask.end - transferTask.start
          }

          const mergeTask = find(logs[taskId], { message: 'merge' })
          if (mergeTask !== undefined) {
            mergeSize = mergeTask.result.size
            mergeDuration = mergeTask.end - mergeTask.start
          }
        })
        if (transferSize !== undefined) {
          globalTransferSize += transferSize
          text.push(
            `- **Transfer size**: ${formatSize(transferSize)}`,
            `- **Transfer speed**: ${formatSpeed(
              transferSize,
              transferDuration
            )}`
          )
        }
        if (mergeSize !== undefined) {
          globalMergeSize += mergeSize
          text.push(
            `- **Merge size**: ${formatSize(mergeSize)}`,
            `- **Merge speed**: ${formatSpeed(mergeSize, mergeDuration)}`
          )
        }
        if (vmTaskStatus === 'failure') {
          ++nFailures
          failedVmsText.push(...text, '', '', ...subText, '')
          nagiosText.push(
            `[(Failed) ${
              vm !== undefined ? vm.name_label : 'undefined'
            }: (failed)[${failedSubTasks.toString()}]]`
          )
        } else {
          successfulVmsText.push(...text, '', '', ...subText, '')
        }
      }
    }
    const globalSuccess = nFailures === 0 && nSkipped === 0
    if (reportWhen === 'failure' && globalSuccess) {
      return
    }

    const nVms = vmsTaskLog.length
    const nSuccesses = nVms - nFailures - nSkipped
    const globalStatus = globalSuccess
      ? `Success`
      : nFailures !== 0 ? `Failure` : `Skipped`
    let markdown = [
      `##  Global status: ${globalStatus}`,
      '',
      `- **mode**: ${mode}`,
      `- **Start time**: ${formatDate(jobLog.start)}`,
      `- **End time**: ${formatDate(jobLog.end)}`,
      `- **Duration**: ${formatDuration(jobLog.duration)}`,
      `- **Successes**: ${nSuccesses} / ${nVms}`,
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
        ...failedVmsText
      )
    }

    if (nSkipped !== 0) {
      markdown.push('---', '', `## ${nSkipped} Skipped`, '', ...skippedVmsText)
    }

    if (nSuccesses !== 0 && reportWhen !== 'failure') {
      markdown.push(
        '---',
        '',
        `## ${nSuccesses} Success${nSuccesses === 1 ? '' : 'es'}`,
        '',
        ...successfulVmsText
      )
    }

    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)
    markdown = markdown.join('\n')
    return this._sendReport({
      markdown,
      subject: `[Xen Orchestra] ${globalStatus} − Backup report for ${jobName} ${
        globalSuccess
          ? ICON_SUCCESS
          : nFailures !== 0 ? ICON_FAILURE : ICON_SKIPPED
      }`,
      nagiosStatus: globalSuccess ? 0 : 2,
      nagiosMarkdown: globalSuccess
        ? `[Xen Orchestra] [Success] Backup report for ${jobName}`
        : `[Xen Orchestra] [${
            nFailures !== 0 ? 'Failure' : 'Skipped'
          }] Backup report for ${jobName} - VMs : ${nagiosText.join(' ')}`,
    })
  }

  _sendReport ({ markdown, subject, nagiosStatus, nagiosMarkdown }) {
    const xo = this._xo
    return Promise.all([
      xo.sendEmail !== undefined &&
        xo.sendEmail({
          to: this._mailsReceivers,
          subject,
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
          nagiosStatus,
          message: nagiosMarkdown,
        }),
    ])
  }

  _listener (status) {
    const { calls, timezone, error } = status
    const formatDate = createDateFormater(timezone)

    if (status.error !== undefined) {
      const [globalStatus, icon] =
        error.message === NO_VMS_MATCH_THIS_PATTERN
          ? ['Skipped', ICON_SKIPPED]
          : ['Failure', ICON_FAILURE]

      let markdown = [
        `##  Global status: ${globalStatus}`,
        '',
        `- **Start time**: ${formatDate(status.start)}`,
        `- **End time**: ${formatDate(status.end)}`,
        `- **Duration**: ${formatDuration(status.end - status.start)}`,
        `- **Error**: ${error.message}`,
        '---',
        '',
        `*${pkg.name} v${pkg.version}*`,
      ]

      markdown = markdown.join('\n')
      return this._sendReport({
        subject: `[Xen Orchestra] ${globalStatus} ${icon}`,
        markdown,
        nagiosStatus: 2,
        nagiosMarkdown: `[Xen Orchestra] [${globalStatus}] Error : ${
          error.message
        }`,
      })
    }

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
          skippedBackupsText.push(
            ...text,
            `- **Reason**: ${
              message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : message
            }`,
            ''
          )

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

    const { tag } = oneCall.params
    const duration = status.end - status.start
    const nSuccesses = nCalls - nFailures - nSkipped
    const globalStatus = globalSuccess
      ? `Success`
      : nFailures !== 0 ? `Failure` : `Skipped`

    let markdown = [
      `##  Global status: ${globalStatus}`,
      '',
      `- **Type**: ${formatMethod(method)}`,
      `- **Start time**: ${formatDate(status.start)}`,
      `- **End time**: ${formatDate(status.end)}`,
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

    return this._sendReport({
      markdown,
      subject: `[Xen Orchestra] ${globalStatus} − Backup report for ${tag} ${
        globalSuccess
          ? ICON_SUCCESS
          : nFailures !== 0 ? ICON_FAILURE : ICON_SKIPPED
      }`,
      nagiosStatus: globalSuccess ? 0 : 2,
      nagiosMarkdown: globalSuccess
        ? `[Xen Orchestra] [Success] Backup report for ${tag}`
        : `[Xen Orchestra] [${
            nFailures !== 0 ? 'Failure' : 'Skipped'
          }] Backup report for ${tag} - VMs : ${nagiosText.join(' ')}`,
    })
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
