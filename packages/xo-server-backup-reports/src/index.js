import moment from 'moment-timezone'
import { capitalize, forEach, get, groupBy, startCase } from 'lodash'
import pkg from '../package'

import MessageGenerator from './message-generator'
import {
  formatSize,
  formatSpeed,
  INDENT,
  STATUS_ICON,
  UNHEALTHY_VDI_CHAIN_ERROR,
  UNHEALTHY_VDI_CHAIN_MESSAGE,
} from './utils'

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

export const testSchema = {
  type: 'object',

  properties: {
    runId: {
      type: 'string',
      description: `<a href="https://xen-orchestra.com/docs/backups.html#backups-execution" rel="noopener noreferrer" target="_blank">job's runId</a>`,
    },
  },

  additionalProperties: false,
  required: ['runId'],
}

// ===================================================================

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

const logError = e => {
  console.error('backup report error:', e)
}

const NO_VMS_MATCH_THIS_PATTERN = 'no VMs match this pattern'
const NO_SUCH_OBJECT_ERROR = 'no such object'

const isSkippedError = error =>
  error.message === UNHEALTHY_VDI_CHAIN_ERROR ||
  error.message === NO_SUCH_OBJECT_ERROR

const handleVmsTask = getHeader => async (tasks, message) => {
  message.generate().push('---', '', getHeader(tasks.length), '')
  for (const task of tasks) {
    await message.handleVmTask(task)
  }
}

const GENERATORS_BY_VM_STATUS = {
  success: handleVmsTask(size => `## ${size} Success${size === 1 ? '' : 'es'}`),
  failure: handleVmsTask(size => `## ${size} Failure${size === 1 ? '' : 's'}`),
  skipped: handleVmsTask(size => `## ${size} Skipped`),
  interrupted: handleVmsTask(size => `## ${size} Interrupted`),
}

const createGetTemporalDataMarkdown = formatDate => (
  start,
  end,
  nbIndent = 0
) => {
  const indent = INDENT.repeat(nbIndent)

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

  test ({ runId }) {
    return this._backupNgListener(undefined, undefined, undefined, runId)
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
    if (log === undefined) {
      throw new Error(`no log found with runId=${JSON.stringify(runJobId)}`)
    }

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
      return this._sendReport({
        subject: `[Xen Orchestra] ${
          log.status
        } − Backup report for ${jobName} ${STATUS_ICON[log.status]}`,
        markdown: [
          `##  Global status: ${log.status}`,
          '',
          `- **mode**: ${mode}`,
          ...getTemporalDataMarkdown(log.start, log.end),
          `- **Error**: ${log.result.message}`,
          '---',
          '',
          `*${pkg.name} v${pkg.version}*`,
        ].join('\n'),
        nagiosStatus: 2,
        nagiosMarkdown: `[Xen Orchestra] [${
          log.status
        }] Backup report for ${jobName} - Error : ${log.result.message}`,
      })
    }

    const vmTasksByStatus = groupBy(log.tasks, 'status')
    const message = new MessageGenerator(xo, log, getTemporalDataMarkdown)
    for (const status in vmTasksByStatus) {
      const vmTasksGenerator = GENERATORS_BY_VM_STATUS[status]
      vmTasksGenerator !== undefined &&
        (await vmTasksGenerator(vmTasksByStatus[status], message))
    }

    const nVms = log.tasks.length
    const nSuccesses = get(vmTasksByStatus.success, 'length') || 0
    const markdown = [
      `##  Global status: ${log.status}`,
      '',
      `- **mode**: ${mode}`,
      ...getTemporalDataMarkdown(log.start, log.end),
      `- **Successes**: ${nSuccesses} / ${nVms}`,
    ]

    const globalTransferSize = message.getGlobalTransferSize()
    globalTransferSize !== 0 &&
      markdown.push(`- **Transfer size**: ${formatSize(globalTransferSize)}`)
    const globalMergeSize = message.getGlobalMergeSize()
    globalMergeSize !== 0 &&
      markdown.push(`- **Merge size**: ${formatSize(globalMergeSize)}`)

    markdown.push(
      '',
      ...message.generate(),
      '---',
      '',
      `*${pkg.name} v${pkg.version}*`
    )

    return this._sendReport({
      markdown: markdown.join('\n'),
      subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${
        STATUS_ICON[log.status]
      }`,
      nagiosStatus: log.status === 'success' ? 0 : 2,
      nagiosMarkdown: `[Xen Orchestra] [${capitalize(
        log.status
      )}] Backup report for ${jobName}${
        log.status !== 'success'
          ? ` - VMs : ${message.generateNagiosText().join(' ')}`
          : ''
      }`,
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
          ? ['Skipped', STATUS_ICON.skipped]
          : ['Failure', STATUS_ICON.failure]

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
          ? STATUS_ICON.success
          : nFailures !== 0
            ? STATUS_ICON.failure
            : STATUS_ICON.skipped
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
