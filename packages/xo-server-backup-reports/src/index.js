import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { capitalize, forEach, get, groupBy, startCase, isEmpty } from 'lodash'
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

// to remove
export const testSchema = {
  type: 'object',

  properties: {
    runId: {
      type: 'string',
      description: "job's runId",
    },
  },

  additionalProperties: false,
  required: ['runId'],
}

// ===================================================================

const INDENT = '  '

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

// ===================================================================

const MARKDOWN = {
  success: async function (vmTasks, markdown, ...args) {
    const size = vmTasks.length
    markdown.push('---', '', `## ${size} Success${size === 1 ? '' : 'es'}`, '')
    await this._addVmsMarkdown(vmTasks, markdown, ...args)
  },
  failure: async function (vmTasks, markdown, ...args) {
    const size = vmTasks.length
    markdown.push('---', '', `## ${size} Failure${size === 1 ? '' : 's'}`, '')
    await this._addVmsMarkdown(vmTasks, markdown, ...args)
  },
  interrupted: async function (vmTasks, markdown, ...args) {
    const size = vmTasks.length
    markdown.push('---', '', `## ${size} Interrupted'}`, '')
    await this._addVmsMarkdown(vmTasks, markdown, ...args)
  },
  skipped: async function (vmTasks, markdown, ...args) {
    const size = vmTasks.length
    markdown.push('---', '', `## ${size} Skipped`, '')
    await this._addVmsMarkdown(vmTasks, markdown, ...args)
  },
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
    this._formatDate = null
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

  // to remove
  test ({ runId }) {
    return this._backupNgListener(undefined, undefined, undefined, runId)
  }

  _getTemporalDataMarkdown (start, end, nbIndent = 0) {
    const indent = INDENT.repeat(nbIndent)

    const markdown = [`${indent}- **Start time**: ${this._formatDate(start)}`]
    if (end !== undefined) {
      markdown.push(`${indent}- **End time**: ${this._formatDate(end)}`)
      const duration = end - start
      if (duration >= 1) {
        markdown.push(`${indent}- **Duration**: ${formatDuration(duration)}`)
      }
    }
    return markdown
  }

  _addOperationMarkdown (
    operationTask,
    type,
    markdown,
    globalTransferMergeSize
  ) {
    const size = get(operationTask.result, 'size')
    const status = operationTask.status
    if (status === 'success' && !(size > 0)) {
      return
    }

    markdown.push(
      `${INDENT.repeat(2)}- **${capitalize(type)}** ${
        STATUS_ICON[operationTask.status]
      }`,
      ...this._getTemporalDataMarkdown(
        operationTask.start,
        operationTask.end,
        3
      )
    )

    if (status === 'success') {
      markdown.push(
        `${INDENT.repeat(3)}- **Size**: ${formatSize(size)}`,
        `${INDENT.repeat(3)}- **Speed**: ${formatSpeed(
          size,
          operationTask.end - operationTask.start
        )}`
      )
      globalTransferMergeSize[type] += size
      return
    }

    const message = get(operationTask.result, 'message')
    if (message !== undefined) {
      markdown.push(`${INDENT.repeat(3)}- **Error**: ${message}`)
    }
  }

  async _getTargetInfo (type, id) {
    const xo = this._xo
    if (type === 'sr') {
      let sr
      try {
        sr = xo.getObject(id)
      } catch (e) {}
      return sr !== undefined
        ? {
            name: sr.name_label,
            id: sr.uuid,
          }
        : {
            name: 'SR Not found',
            id,
          }
    }
    const remote = await this._xo.getRemote(id).catch(() => {})
    return {
      name: remote !== undefined ? remote.name : `Remote Not found`,
      id,
    }
  }

  async _addTargetsMarkdown (
    targetTasks,
    type,
    markdown,
    globalTransferMergeSize
  ) {
    markdown.push(type === 'remote' ? '- **Remotes**' : '- **SRs**')
    for (const targetTask of targetTasks) {
      const { name, id } = await this._getTargetInfo(type, targetTask.data.id)
      markdown.push(
        `${INDENT}- **${name}** (${id}) ${STATUS_ICON[targetTask.status]}`,
        ...this._getTemporalDataMarkdown(targetTask.start, targetTask.end, 2)
      )
      const message = get(targetTask.result, 'message')
      if (message !== undefined) {
        markdown.push(`${INDENT.repeat(2)}- **Error**: ${message}}`)
      }

      const { transfer: transferTasks, merge: mergeTasks } = groupBy(
        targetTask.tasks,
        'message'
      )
      if (transferTasks !== undefined) {
        this._addOperationMarkdown(
          transferTasks[0],
          'transfer',
          markdown,
          globalTransferMergeSize
        )
      }
      if (mergeTasks !== undefined) {
        this._addOperationMarkdown(
          mergeTasks[0],
          'merge',
          markdown,
          globalTransferMergeSize
        )
      }
    }
  }

  _addSnapshotMarkdown (task, markdown) {
    markdown.push(
      `- **Snapshot** ${ICON_SUCCESS}`,
      ...this._getTemporalDataMarkdown(task.start, task.end, 1)
    )
  }

  async _addVmsMarkdown (
    vmTasks,
    markdown,
    nagiosText,
    globalTransferMergeSize
  ) {
    for (const vmTask of vmTasks) {
      const id = vmTask.data.id
      let vm
      try {
        vm = this._xo.getObject(id)
      } catch (e) {}
      const [name, uuid] =
        vm !== undefined ? [vm.name_label, vm.uuid] : ['VM not found', id]
      markdown.push(
        '',
        `### ${name}`,
        '',
        `- **UUID**: ${uuid}`,
        ...this._getTemporalDataMarkdown(vmTask.start, vmTask.end)
      )

      const message = get(vmTask.result, 'message')
      if (message !== undefined) {
        if (vmTask.status === 'skipped') {
          markdown.push(
            `- **Reason**: ${
              message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : message
            }`
          )
          nagiosText.push(`[(Skipped) ${name} : ${message}]`)
        } else {
          markdown.push(`- **Error**: ${message}`)
          nagiosText.push(
            `[(${
              vmTask.status === 'interrupted' ? 'Interrupted' : 'Failed'
            }) ${name} : ${message}]`
          )
        }
      }

      const snapshotAndTargetsTasks = vmTask.tasks
      if (isEmpty(snapshotAndTargetsTasks)) {
        continue
      }

      const { snapshot: snapshotTasks, export: exportTasks = [] } = groupBy(
        snapshotAndTargetsTasks,
        'message'
      )
      this._addSnapshotMarkdown(snapshotTasks[0], markdown)

      const { remote: remoteTasks, SR: srTasks } = groupBy(
        exportTasks,
        'data.type'
      )
      if (remoteTasks !== undefined) {
        await this._addTargetsMarkdown(
          remoteTasks,
          'remote',
          markdown,
          globalTransferMergeSize
        )
      }
      if (srTasks !== undefined) {
        await this._addTargetsMarkdown(
          srTasks,
          'sr',
          markdown,
          globalTransferMergeSize
        )
      }
    }
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
    this._formatDate = createDateFormater(schedule.timezone)

    if (
      (log.status === 'failure' || log.status === 'skipped') &&
      log.result !== undefined
    ) {
      let markdown = [
        `##  Global status: ${log.status}`,
        '',
        `- **mode**: ${mode}`,
        ...this._getTemporalDataMarkdown(log.start, log.end),
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

    const nagiosText = []
    const markdown = []
    let nSuccesses = 0
    const globalTransferMergeSize = {
      transfer: 0,
      merge: 0,
    }
    const vmsTasksByStatus = groupBy(log.tasks, 'status')
    for (const status in vmsTasksByStatus) {
      const tasks = vmsTasksByStatus[status]
      if (status === 'success') {
        if (reportWhen === 'failure') {
          return
        }
        nSuccesses = tasks.length
      }

      const addMarkdownFn = MARKDOWN[status]
      if (addMarkdownFn !== undefined) {
        await addMarkdownFn.call(
          this,
          tasks,
          markdown,
          nagiosText,
          globalTransferMergeSize
        )
      }
    }

    if (globalTransferMergeSize.transfer !== 0) {
      markdown.unshift(
        `- **Transfer size**: ${formatSize(globalTransferMergeSize.transfer)}`
      )
    }
    if (globalTransferMergeSize.merge !== 0) {
      markdown.unshift(
        `- **Merge size**: ${formatSize(globalTransferMergeSize.merge)}`
      )
    }
    const nVms = log.tasks.length
    markdown.unshift(
      `##  Global status: ${log.status}`,
      '',
      `- **mode**: ${mode}`,
      ...this._getTemporalDataMarkdown(log.start, log.end),
      `- **Successes**: ${nSuccesses} / ${nVms}`
    )
    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)
    return this._sendReport({
      markdown: markdown.join('\n'),
      subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${
        STATUS_ICON[log.status]
      }`,
      nagiosStatus: log.status === 'success' ? 0 : 2,
      nagiosMarkdown:
        log.status === 'success'
          ? `[Xen Orchestra] [Success] Backup report for ${jobName}`
          : `[Xen Orchestra] [${capitalize(
              log.status
            )}] Backup report for ${jobName} - VMs : ${nagiosText.join(' ')}`,
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
