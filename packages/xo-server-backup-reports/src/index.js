import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { createLogger } from '@xen-orchestra/log'
import { forEach, groupBy, startCase } from 'lodash'
import { get } from '@xen-orchestra/defined'
import pkg from '../package'

const logger = createLogger('xo:xo-server-backup-reports')

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

const INDENT = '  '
const UNKNOWN_ITEM = 'Unknown'

const ICON_FAILURE = '🚨'
const ICON_INTERRUPTED = '⚠️'
const ICON_SKIPPED = '⏩'
const ICON_SUCCESS = '✔'
const ICON_WARNING = '⚠️'

const STATUS_ICON = {
  failure: ICON_FAILURE,
  interrupted: ICON_INTERRUPTED,
  skipped: ICON_SKIPPED,
  success: ICON_SUCCESS,
}

const DATE_FORMAT = 'dddd, MMMM Do YYYY, h:mm:ss a'
const createDateFormatter = timezone =>
  timezone !== undefined
    ? timestamp => moment(timestamp).tz(timezone).format(DATE_FORMAT)
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

const NO_VMS_MATCH_THIS_PATTERN = 'no VMs match this pattern'
const NO_SUCH_OBJECT_ERROR = 'no such object'
const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_MESSAGE =
  '[(unhealthy VDI chain) Job canceled to protect the VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection)'

const isSkippedError = error => error.message === UNHEALTHY_VDI_CHAIN_ERROR || error.message === NO_SUCH_OBJECT_ERROR

// ===================================================================

const STATUS = ['failure', 'interrupted', 'skipped', 'success']
const TITLE_BY_STATUS = {
  failure: n => `## ${n} Failure${n === 1 ? '' : 's'}`,
  interrupted: n => `## ${n} Interrupted`,
  skipped: n => `## ${n} Skipped`,
  success: n => `## ${n} Success${n === 1 ? '' : 'es'}`,
}

const getTemporalDataMarkdown = (end, start, formatDate) => {
  const markdown = [`- **Start time**: ${formatDate(start)}`]
  if (end !== undefined) {
    markdown.push(`- **End time**: ${formatDate(end)}`)
    const duration = end - start
    if (duration >= 1) {
      markdown.push(`- **Duration**: ${formatDuration(duration)}`)
    }
  }
  return markdown
}

const getWarningsMarkdown = (warnings = []) => warnings.map(({ message }) => `- **${ICON_WARNING} ${message}**`)

const getErrorMarkdown = task => {
  let message
  if (task.status === 'success' || (message = task.result?.message ?? task.result?.code) === undefined) {
    return
  }

  const label = task.status === 'skipped' ? 'Reason' : 'Error'
  return `- **${label}**: ${message}`
}

const MARKDOWN_BY_TYPE = {
  pool(task, { formatDate }) {
    const { id, pool = {}, poolMaster = {} } = task.data
    const name = pool.name_label || poolMaster.name_label || UNKNOWN_ITEM

    return {
      body: [
        pool.uuid !== undefined ? `- **UUID**: ${pool.uuid}` : `- **ID**: ${id}`,
        ...getTemporalDataMarkdown(task.end, task.start, formatDate),
        getErrorMarkdown(task),
      ],
      title: `[pool] ${name}`,
    }
  },
  xo(task, { formatDate, jobName }) {
    return {
      body: [...getTemporalDataMarkdown(task.end, task.start, formatDate), getErrorMarkdown(task)],
      title: `[XO] ${jobName}`,
    }
  },
  async remote(task, { formatDate, xo }) {
    const id = task.data.id
    const name = await xo.getRemote(id).then(
      ({ name }) => name,
      error => {
        logger.warn(error)
        return UNKNOWN_ITEM
      }
    )
    return {
      body: [`- **ID**: ${id}`, ...getTemporalDataMarkdown(task.end, task.start, formatDate), getErrorMarkdown(task)],
      title: `[remote] ${name}`,
    }
  },
}

const getMarkdown = (task, props) => MARKDOWN_BY_TYPE[task.data?.type]?.(task, props)

const toMarkdown = parts => {
  const lines = []
  let indentLevel = -1

  const helper = part => {
    if (typeof part === 'string') {
      lines.push(`${INDENT.repeat(indentLevel)}${part}`)
    } else if (Array.isArray(part)) {
      ++indentLevel
      part.forEach(helper)
      --indentLevel
    }
  }
  helper(parts)

  return lines.join('\n')
}

// ===================================================================

class BackupReportsXoPlugin {
  constructor(xo) {
    this._xo = xo
    this._eventListener = async (...args) => {
      try {
        await this._report(...args)
      } catch (error) {
        logger.warn(error)
      }
    }
  }

  configure({ toMails, toXmpp }) {
    this._mailsReceivers = toMails
    this._xmppReceivers = toXmpp
  }

  load() {
    this._xo.on('job:terminated', this._eventListener)
  }

  test({ runId }) {
    return this._report(runId, undefined, true)
  }

  unload() {
    this._xo.removeListener('job:terminated', this._eventListener)
  }

  async _report(runJobId, { type, status } = {}, force) {
    const xo = this._xo
    if (type === 'call') {
      return this._legacyVmHandler(status)
    }

    const log = await xo.getBackupNgLogs(runJobId)
    if (log === undefined) {
      throw new Error(`no log found with runId=${JSON.stringify(runJobId)}`)
    }

    const reportWhen = log.data.reportWhen
    if (
      !force &&
      (reportWhen === 'never' ||
        // Handle improper value introduced by:
        // https://github.com/vatesfr/xen-orchestra/commit/753ee994f2948bbaca9d3161eaab82329a682773#diff-9c044ab8a42ed6576ea927a64c1ec3ebR105
        reportWhen === 'Never' ||
        (reportWhen === 'failure' && log.status === 'success'))
    ) {
      return
    }

    const [job, schedule] = await Promise.all([
      await xo.getJob(log.jobId),
      await xo.getSchedule(log.scheduleId).catch(error => {
        logger.warn(error)
      }),
    ])

    if (job.type === 'backup') {
      return this._ngVmHandler(log, job, schedule, force)
    } else if (job.type === 'metadataBackup') {
      return this._metadataHandler(log, job, schedule, force)
    }

    throw new Error(`Unknown backup job type: ${job.type}`)
  }

  async _metadataHandler(log, { name: jobName }, schedule, force) {
    const xo = this._xo

    const formatDate = createDateFormatter(schedule?.timezone)

    const tasksByStatus = groupBy(log.tasks, 'status')
    const n = log.tasks?.length ?? 0
    const nSuccesses = tasksByStatus.success?.length ?? 0

    if (!force && log.data.reportWhen === 'failure') {
      delete tasksByStatus.success
    }

    // header
    const markdown = [
      `##  Global status: ${log.status}`,
      '',
      `- **Job ID**: ${log.jobId}`,
      `- **Job name**: ${jobName}`,
      `- **Run ID**: ${log.id}`,
      ...getTemporalDataMarkdown(log.end, log.start, formatDate),
      n !== 0 && `- **Successes**: ${nSuccesses} / ${n}`,
      ...getWarningsMarkdown(log.warnings),
      getErrorMarkdown(log),
    ]

    // body
    for (const status of STATUS) {
      const tasks = tasksByStatus[status]
      if (tasks === undefined) {
        continue
      }

      // tasks header
      markdown.push('---', '', TITLE_BY_STATUS[status](tasks.length))

      // tasks body
      for (const task of tasks) {
        const taskMarkdown = await getMarkdown(task, {
          formatDate,
          jobName: log.jobName,
          xo,
        })
        if (taskMarkdown === undefined) {
          continue
        }

        const { title, body } = taskMarkdown
        const subMarkdown = [...body, ...getWarningsMarkdown(task.warnings)]

        for (const subTask of task.tasks ?? []) {
          const taskMarkdown = await getMarkdown(subTask, { formatDate, xo })
          if (taskMarkdown === undefined) {
            continue
          }

          const icon = STATUS_ICON[subTask.status]
          const { title, body } = taskMarkdown
          subMarkdown.push([`- **${title}** ${icon}`, [...body, ...getWarningsMarkdown(subTask.warnings)]])
        }
        markdown.push('', '', `### ${title}`, ...subMarkdown)
      }
    }

    // footer
    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)

    return this._sendReport({
      subject: `[Xen Orchestra] ${log.status} − Metadata backup report for ${log.jobName} ${STATUS_ICON[log.status]}`,
      markdown: toMarkdown(markdown),
      success: log.status === 'success',
    })
  }

  async _ngVmHandler(log, { name: jobName, settings }, schedule, force) {
    const xo = this._xo

    const mailReceivers = get(() => settings[''].reportRecipients)
    const { reportWhen, mode } = log.data || {}

    const formatDate = createDateFormatter(schedule?.timezone)

    if (log.tasks === undefined) {
      const markdown = [
        `##  Global status: ${log.status}`,
        '',
        `- **Job ID**: ${log.jobId}`,
        `- **Run ID**: ${log.id}`,
        `- **mode**: ${mode}`,
        ...getTemporalDataMarkdown(log.end, log.start, formatDate),
        getErrorMarkdown(log),
        ...getWarningsMarkdown(log.warnings),
        '---',
        '',
        `*${pkg.name} v${pkg.version}*`,
      ]
      return this._sendReport({
        subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${STATUS_ICON[log.status]}`,
        mailReceivers,
        markdown: toMarkdown(markdown),
        success: false,
      })
    }

    const failedTasksText = []
    const skippedVmsText = []
    const successfulVmsText = []
    const interruptedVmsText = []

    let globalMergeSize = 0
    let globalTransferSize = 0
    let nFailures = 0
    let nSkipped = 0
    let nSuccesses = 0
    let nInterrupted = 0

    for (const taskLog of log.tasks) {
      const { type, id } = taskLog.data ?? {}
      if (taskLog.message === 'get SR record' || taskLog.message === 'get remote adapter') {
        ++nFailures
        failedTasksText.push(
          // It will ensure that it will never be in a nested list
          ''
        )

        try {
          if (type === 'SR') {
            const { name_label: name, uuid } = xo.getObject(id)
            failedTasksText.push(`### ${name}`, '', `- **UUID**: ${uuid}`)
          } else {
            const { name } = await xo.getRemote(id)
            failedTasksText.push(`### ${name}`, '', `- **UUID**: ${id}`)
          }
        } catch (error) {
          logger.warn(error)
          failedTasksText.push(`### ${UNKNOWN_ITEM}`, '', `- **UUID**: ${id}`)
        }

        failedTasksText.push(
          `- **Type**: ${type}`,
          ...getTemporalDataMarkdown(taskLog.end, taskLog.start, formatDate),
          ...getWarningsMarkdown(taskLog.warnings),
          `- **Error**: ${taskLog.result.message}`
        )
        continue
      }

      if (type !== 'VM') {
        continue
      }

      if (!force && taskLog.status === 'success' && reportWhen === 'failure') {
        ++nSuccesses
        continue
      }

      let vm
      try {
        vm = xo.getObject(id)
      } catch (e) {}
      const text = [
        // It will ensure that it will never be in a nested list
        '',
        `### ${vm !== undefined ? vm.name_label : 'VM not found'}`,
        '',
        `- **UUID**: ${vm !== undefined ? vm.uuid : id}`,
        ...getTemporalDataMarkdown(taskLog.end, taskLog.start, formatDate),
        ...getWarningsMarkdown(taskLog.warnings),
      ]

      const failedSubTasks = []
      const snapshotText = []
      const srsText = []
      const remotesText = []

      for (const subTaskLog of taskLog.tasks ?? []) {
        if (subTaskLog.message !== 'export' && subTaskLog.message !== 'snapshot') {
          continue
        }

        const icon = STATUS_ICON[subTaskLog.status]
        const type = subTaskLog.data?.type
        const errorMarkdown = getErrorMarkdown(subTaskLog)

        if (subTaskLog.message === 'snapshot') {
          snapshotText.push(`- **Snapshot** ${icon}`, [
            ...getTemporalDataMarkdown(subTaskLog.end, subTaskLog.start, formatDate),
          ])
        } else if (type === 'remote') {
          const id = subTaskLog.data.id
          const remote = await xo.getRemote(id).catch(error => {
            logger.warn(error)
          })
          const title = remote !== undefined ? remote.name : `Remote Not found`

          remotesText.push(`- **${title}** (${id}) ${icon}`, [
            ...getTemporalDataMarkdown(subTaskLog.end, subTaskLog.start, formatDate),
            ...getWarningsMarkdown(subTaskLog.warnings),
            errorMarkdown,
          ])

          if (subTaskLog.status === 'failure') {
            failedSubTasks.push(remote !== undefined ? remote.name : id)
          }
        } else {
          const id = subTaskLog.data.id
          let sr
          try {
            sr = xo.getObject(id)
          } catch (e) {}
          const [srName, srUuid] = sr !== undefined ? [sr.name_label, sr.uuid] : [`SR Not found`, id]
          srsText.push(`- **${srName}** (${srUuid}) ${icon}`, [
            ...getTemporalDataMarkdown(subTaskLog.end, subTaskLog.start, formatDate),
            ...getWarningsMarkdown(subTaskLog.warnings),
            errorMarkdown,
          ])
          if (subTaskLog.status === 'failure') {
            failedSubTasks.push(sr !== undefined ? sr.name_label : id)
          }
        }

        forEach(subTaskLog.tasks, operationLog => {
          if (
            operationLog.message !== 'merge' &&
            operationLog.message !== 'transfer' &&
            operationLog.message !== 'health check'
          ) {
            return
          }

          const size = operationLog.result?.size
          if (size > 0) {
            if (operationLog.message === 'merge') {
              globalMergeSize += size
            } else {
              globalTransferSize += size
            }
          } // don't ignore health check
          else if (operationLog.status === 'success' && operationLog.message !== 'health check') {
            return
          }

          const operationText = [
            `- **${operationLog.message}** ${STATUS_ICON[operationLog.status]}`,
            [
              ...getTemporalDataMarkdown(operationLog.end, operationLog.start, formatDate),
              size > 0 && `- **Size**: ${formatSize(size)}`,
              size > 0 && `- **Speed**: ${formatSpeed(size, operationLog.end - operationLog.start)}`,
              ...getWarningsMarkdown(operationLog.warnings),
              getErrorMarkdown(operationLog),
            ],
          ]
          if (type === 'remote') {
            remotesText.push(operationText)
          } else if (type === 'SR') {
            srsText.push(operationText)
          }
        })
      }

      const subText = [
        ...snapshotText,
        srsText.length !== 0 && `- **SRs**`,
        srsText,
        remotesText.length !== 0 && `- **Remotes**`,
        remotesText,
      ]
      if (taskLog.result !== undefined) {
        if (taskLog.status === 'skipped') {
          ++nSkipped
          skippedVmsText.push(
            ...text,
            `- **Reason**: ${
              taskLog.result.message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : taskLog.result.message
            }`
          )
        } else {
          ++nFailures
          failedTasksText.push(...text, `- **Error**: ${taskLog.result.message}`)
        }
      } else {
        if (taskLog.status === 'failure') {
          ++nFailures
          failedTasksText.push(...text, ...subText)
        } else if (taskLog.status === 'interrupted') {
          ++nInterrupted
          interruptedVmsText.push(...text, ...subText)
        } else {
          ++nSuccesses
          successfulVmsText.push(...text, ...subText)
        }
      }
    }

    const nVmTasks = nSuccesses + nFailures + nSkipped + nInterrupted

    const markdown = [
      `##  Global status: ${log.status}`,
      '',
      `- **Job ID**: ${log.jobId}`,
      `- **Run ID**: ${log.id}`,
      `- **mode**: ${mode}`,
      ...getTemporalDataMarkdown(log.end, log.start, formatDate),
      `- **Successes**: ${nSuccesses} / ${nVmTasks}`,
      globalTransferSize !== 0 && `- **Transfer size**: ${formatSize(globalTransferSize)}`,
      globalMergeSize !== 0 && `- **Merge size**: ${formatSize(globalMergeSize)}`,
      ...getWarningsMarkdown(log.warnings),
      '',
    ]

    if (nFailures !== 0) {
      markdown.push('---', '', `## ${nFailures} Failure${nFailures === 1 ? '' : 's'}`, '', ...failedTasksText)
    }

    if (nSkipped !== 0) {
      markdown.push('---', '', `## ${nSkipped} Skipped`, '', ...skippedVmsText)
    }

    if (nInterrupted !== 0) {
      markdown.push('---', '', `## ${nInterrupted} Interrupted`, '', ...interruptedVmsText)
    }

    if (nSuccesses !== 0 && (force || reportWhen !== 'failure')) {
      markdown.push('---', '', `## ${nSuccesses} Success${nSuccesses === 1 ? '' : 'es'}`, '', ...successfulVmsText)
    }

    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)
    return this._sendReport({
      mailReceivers,
      markdown: toMarkdown(markdown),
      subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${STATUS_ICON[log.status]}`,
      success: log.status === 'success',
    })
  }

  _sendReport({ mailReceivers, markdown, subject, success }) {
    if (mailReceivers === undefined || mailReceivers.length === 0) {
      mailReceivers = this._mailsReceivers
    }

    const xo = this._xo
    return Promise.all([
      xo.sendEmail !== undefined &&
        xo.sendEmail({
          to: mailReceivers,
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
      xo.sendIcinga2Status !== undefined &&
        xo.sendIcinga2Status({
          status: success ? 'OK' : 'CRITICAL',
          message: markdown,
        }),
    ])
  }

  _legacyVmHandler(status) {
    const { calls, timezone, error } = status
    const formatDate = createDateFormatter(timezone)

    if (status.error !== undefined) {
      const [globalStatus, icon] =
        error.message === NO_VMS_MATCH_THIS_PATTERN ? ['Skipped', ICON_SKIPPED] : ['Failure', ICON_FAILURE]

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
        success: false,
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
            `- **Reason**: ${message === UNHEALTHY_VDI_CHAIN_ERROR ? UNHEALTHY_VDI_CHAIN_MESSAGE : message}`,
            ''
          )
        } else {
          ++nFailures
          failedBackupsText.push(...text, `- **Error**: ${message}`, '')
        }
      } else if (!reportOnFailure) {
        const { returnedValue } = call
        if (returnedValue != null) {
          const { mergeSize, transferSize } = returnedValue
          if (transferSize !== undefined) {
            globalTransferSize += transferSize
            text.push(
              `- **Transfer size**: ${formatSize(transferSize)}`,
              `- **Transfer speed**: ${formatSpeed(transferSize, returnedValue.transferDuration)}`
            )
          }
          if (mergeSize !== undefined) {
            globalMergeSize += mergeSize
            text.push(
              `- **Merge size**: ${formatSize(mergeSize)}`,
              `- **Merge speed**: ${formatSpeed(mergeSize, returnedValue.mergeDuration)}`
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
    const globalStatus = globalSuccess ? `Success` : nFailures !== 0 ? `Failure` : `Skipped`

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
      markdown.push('---', '', `## ${nFailures} Failure${nFailures === 1 ? '' : 's'}`, '', ...failedBackupsText)
    }

    if (nSkipped !== 0) {
      markdown.push('---', '', `## ${nSkipped} Skipped`, '', ...skippedBackupsText)
    }

    if (nSuccesses !== 0 && !reportOnFailure) {
      markdown.push('---', '', `## ${nSuccesses} Success${nSuccesses === 1 ? '' : 'es'}`, '', ...successfulBackupText)
    }

    markdown.push('---', '', `*${pkg.name} v${pkg.version}*`)

    markdown = markdown.join('\n')

    return this._sendReport({
      markdown,
      subject: `[Xen Orchestra] ${globalStatus} − Backup report for ${tag} ${
        globalSuccess ? ICON_SUCCESS : nFailures !== 0 ? ICON_FAILURE : ICON_SKIPPED
      }`,
      success: globalSuccess,
    })
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
