import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { forEach, get, startCase } from 'lodash'
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
const ICON_INTERRUPTED = '⚠️'
const ICON_SKIPPED = '⏩'
const ICON_SUCCESS = '✔'

const STATUS_ICON = {
  failure: ICON_FAILURE,
  interrupted: ICON_INTERRUPTED,
  skipped: ICON_SKIPPED,
  success: ICON_SUCCESS,
}

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
  milliseconds > 0
    ? humanFormat((bytes * 1e3) / milliseconds, {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'

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

const createGetTemporalDataMarkdown = formatDate => (
  start,
  end,
  nbIndent = 0
) => {
  const indent = '  '.repeat(nbIndent)

  const markdown = [`${indent}- **Start time**: ${formatDate(start)}`]
  if (end !== undefined) {
    markdown.push(`${indent}- **End time**: ${formatDate(end)}`)
    const duration = end - start
    if (duration >= 1) {
      markdown.push(`${indent}- **Duration**: ${formatDuration(duration)}`)
    }
  }
  return markdown
}

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

  async _backupNgListener (_1, _2, schedule, runJobId) {
    const xo = this._xo
    const log = await xo.getBackupNgLogs(runJobId)

    const { reportWhen, mode } = log.data || {}
    if (
      reportWhen === 'never' ||
      (log.status === 'success' && reportWhen === 'failure')
    ) {
      return
    }

    if (schedule === undefined) {
      schedule = await xo.getSchedule(log.scheduleId)
    }

    const jobName = (await xo.getJob(log.jobId, 'backup')).name
    const formatDate = createDateFormater(schedule.timezone)
    const getTemporalDataMarkdown = createGetTemporalDataMarkdown(formatDate)

    if (
      (log.status === 'failure' || log.status === 'skipped') &&
      log.result !== undefined
    ) {
      let markdown = [
        `##  Global status: ${log.status}`,
        '',
        `- **mode**: ${mode}`,
        ...getTemporalDataMarkdown(log.start, log.end),
        `- **Error**: ${log.result.message}`,
        '---',
        '',
        `*${pkg.name} v${pkg.version}*`,
      ]

      markdown = markdown.join('\n')
      return this._sendReport({
        subject: `[Xen Orchestra] ${
          log.status
        } − Backup report for ${jobName} ${STATUS_ICON[log.status]}`,
        markdown,
        nagiosStatus: 2,
        nagiosMarkdown: `[Xen Orchestra] [${
          log.status
        }] Backup report for ${jobName} - Error : ${log.result.message}`,
      })
    }

    const failedVmsText = []
    const skippedVmsText = []
    const successfulVmsText = []
    const interruptedVmsText = []
    const nagiosText = []

    let globalMergeSize = 0
    let globalTransferSize = 0
    let nFailures = 0
    let nSkipped = 0
    let nInterrupted = 0
    for (const taskLog of log.tasks) {
      if (taskLog.status === 'success' && reportWhen === 'failure') {
        continue
      }

      const vmId = taskLog.data.id
      let vm
      try {
        vm = xo.getObject(vmId)
      } catch (e) {}
      const text = [
        `### ${vm !== undefined ? vm.name_label : 'VM not found'}`,
        '',
        `- **UUID**: ${vm !== undefined ? vm.uuid : vmId}`,
        ...getTemporalDataMarkdown(taskLog.start, taskLog.end),
      ]

      const failedSubTasks = []
      const snapshotText = []
      const srsText = []
      const remotesText = []

      for (const subTaskLog of taskLog.tasks || []) {
        if (
          subTaskLog.message !== 'export' &&
          subTaskLog.message !== 'snapshot'
        ) {
          continue
        }

        const icon = STATUS_ICON[subTaskLog.status]
        const errorMessage = `    - **Error**: ${get(
          subTaskLog.result,
          'message'
        )}`

        if (subTaskLog.message === 'snapshot') {
          snapshotText.push(
            `- **Snapshot** ${icon}`,
            ...getTemporalDataMarkdown(subTaskLog.start, subTaskLog.end, 1)
          )
        } else if (subTaskLog.data.type === 'remote') {
          const id = subTaskLog.data.id
          const remote = await xo.getRemote(id).catch(() => {})
          remotesText.push(
            `  - **${
              remote !== undefined ? remote.name : `Remote Not found`
            }** (${id}) ${icon}`,
            ...getTemporalDataMarkdown(subTaskLog.start, subTaskLog.end, 2)
          )
          if (subTaskLog.status === 'failure') {
            failedSubTasks.push(remote !== undefined ? remote.name : id)
            remotesText.push('', errorMessage)
          }
        } else {
          const id = subTaskLog.data.id
          let sr
          try {
            sr = xo.getObject(id)
          } catch (e) {}
          const [srName, srUuid] =
            sr !== undefined ? [sr.name_label, sr.uuid] : [`SR Not found`, id]
          srsText.push(
            `  - **${srName}** (${srUuid}) ${icon}`,
            ...getTemporalDataMarkdown(subTaskLog.start, subTaskLog.end, 2)
          )
          if (subTaskLog.status === 'failure') {
            failedSubTasks.push(sr !== undefined ? sr.name_label : id)
            srsText.push('', errorMessage)
          }
        }

        forEach(subTaskLog.tasks, operationLog => {
          if (
            operationLog.message !== 'merge' &&
            operationLog.message !== 'transfer'
          ) {
            return
          }

          const operationInfoText = []
          if (operationLog.status === 'success') {
            const size = operationLog.result.size
            if (operationLog.message === 'merge') {
              globalMergeSize += size
            } else {
              globalTransferSize += size
            }

            operationInfoText.push(
              `      - **Size**: ${formatSize(size)}`,
              `      - **Speed**: ${formatSpeed(
                size,
                operationLog.end - operationLog.start
              )}`
            )
          } else if (get(operationLog.result, 'message') !== undefined) {
            operationInfoText.push(
              `      - **Error**: ${get(operationLog.result, 'message')}`
            )
          }
          const operationText = [
            `    - **${operationLog.message}** ${
              STATUS_ICON[operationLog.status]
            }`,
            ...getTemporalDataMarkdown(operationLog.start, operationLog.end, 3),
            ...operationInfoText,
          ].join('\n')
          if (get(subTaskLog, 'data.type') === 'remote') {
            remotesText.push(operationText)
            remotesText.join('\n')
          }
          if (get(subTaskLog, 'data.type') === 'SR') {
            srsText.push(operationText)
            srsText.join('\n')
          }
        })
      }

      if (srsText.length !== 0) {
        srsText.unshift(`- **SRs**`)
      }
      if (remotesText.length !== 0) {
        remotesText.unshift(`- **Remotes**`)
      }
      const subText = [...snapshotText, '', ...srsText, '', ...remotesText]
      if (taskLog.result !== undefined) {
        if (taskLog.status === 'skipped') {
          ++nSkipped
          skippedVmsText.push(
            ...text,
            `- **Reason**: ${
              taskLog.result.message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : taskLog.result.message
            }`,
            ''
          )
          nagiosText.push(
            `[(Skipped) ${vm !== undefined ? vm.name_label : 'undefined'} : ${
              taskLog.result.message
            } ]`
          )
        } else {
          ++nFailures
          failedVmsText.push(
            ...text,
            `- **Error**: ${taskLog.result.message}`,
            ''
          )

          nagiosText.push(
            `[(Failed) ${vm !== undefined ? vm.name_label : 'undefined'} : ${
              taskLog.result.message
            } ]`
          )
        }
      } else {
        if (taskLog.status === 'failure') {
          ++nFailures
          failedVmsText.push(...text, '', '', ...subText, '')
          nagiosText.push(
            `[${
              vm !== undefined ? vm.name_label : 'undefined'
            }: (failed)[${failedSubTasks.toString()}]]`
          )
        } else if (taskLog.status === 'interrupted') {
          ++nInterrupted
          interruptedVmsText.push(...text, '', '', ...subText, '')
          nagiosText.push(
            `[(Interrupted) ${vm !== undefined ? vm.name_label : 'undefined'}]`
          )
        } else {
          successfulVmsText.push(...text, '', '', ...subText, '')
        }
      }
    }

    const nVms = log.tasks.length
    const nSuccesses = nVms - nFailures - nSkipped - nInterrupted
    let markdown = [
      `##  Global status: ${log.status}`,
      '',
      `- **mode**: ${mode}`,
      ...getTemporalDataMarkdown(log.start, log.end),
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

    if (nInterrupted !== 0) {
      markdown.push(
        '---',
        '',
        `## ${nInterrupted} Interrupted`,
        '',
        ...interruptedVmsText
      )
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
      subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${
        STATUS_ICON[log.status]
      }`,
      nagiosStatus: log.status === 'success' ? 0 : 2,
      nagiosMarkdown:
        log.status === 'success'
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
          status: nagiosStatus,
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
      : nFailures !== 0
        ? `Failure`
        : `Skipped`

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
          : nFailures !== 0
            ? ICON_FAILURE
            : ICON_SKIPPED
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
