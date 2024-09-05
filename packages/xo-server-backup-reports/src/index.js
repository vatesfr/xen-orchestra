import moment from 'moment-timezone'
import { createLogger } from '@xen-orchestra/log'
import { get } from '@xen-orchestra/defined'
import { forEach, groupBy } from 'lodash'

import pkg from '../package'
import * as templates from '../templates/index.js'

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

const DEFAULT_TEMPLATE = 'mjml'

const UNKNOWN_ITEM = 'Unknown'

const DATE_FORMAT = 'dddd, MMMM Do YYYY, h:mm:ss a'
const createDateFormatter = timezone =>
  timezone !== undefined
    ? timestamp => moment(timestamp).tz(timezone).format(DATE_FORMAT)
    : timestamp => moment(timestamp).format(DATE_FORMAT)

const noop = Function.prototype

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_MESSAGE =
  '(unhealthy VDI chain) Job canceled to protect the VDI chain. See https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

const getAdditionnalData = async (task, props) => {
  if (task.data?.type === 'remote') {
    const name = await props.xo.getRemote(task.data.id).then(
      ({ name }) => name,
      error => {
        logger.warn(error)
        return UNKNOWN_ITEM
      }
    )
    return { name }
  }
  return {}
}
// ===================================================================

class BackupReportsXoPlugin {
  constructor(xo) {
    this._xo = xo

    const report = this._report
    this._report = (...args) =>
      xo.tasks
        .create(
          { type: 'xo:xo-server-backup-reports:sendReport', name: 'Sending backup report', runId: args[0] },
          { clearLogOnSuccess: true }
        )
        .run(() => report.call(this, ...args))

    this._eventListener = (...args) => this._report(...args).catch(noop)
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

  async _report(runJobId, { type } = {}, force) {
    if (type === 'call') {
      // jobs that are not backups
      return
    }
    const xo = this._xo

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
        (reportWhen === 'failure' && log.status === 'success') ||
        (reportWhen === 'error' && (log.status === 'success' || log.status === 'skipped')))
    ) {
      return
    }

    const [job, schedule] = await Promise.all([
      await xo.getJob(log.jobId),
      await xo.getSchedule(log.scheduleId).catch(error => {
        logger.warn(error)
      }),
    ])

    if (job.type === 'backup' || job.type === 'mirrorBackup') {
      return this._vmHandler(log, job, schedule, force)
    } else if (job.type === 'metadataBackup') {
      return this._metadataHandler(log, job, schedule, force)
    }

    throw new Error(`Unknown backup job type: ${job.type}`)
  }

  async _metadataHandler(log, { name: jobName, settings }, schedule, force) {
    const xo = this._xo

    const formatDate = createDateFormatter(schedule?.timezone)

    const mailReceivers = get(() => settings[''].reportRecipients)

    const tasksByStatus = groupBy(log.tasks, 'status')

    if (!force && log.data.reportWhen === 'failure') {
      delete tasksByStatus.success
    }

    for (const taskBatch of Object.values(tasksByStatus)) {
      for (const task of taskBatch) {
        task.additionnalData = await getAdditionnalData(task, { xo })

        const subTasks = task.tasks
        if (subTasks !== undefined) {
          for (const subTask of subTasks) {
            subTask.additionnalData = await getAdditionnalData(subTask, { xo })
          }
        }
      }
    }

    const context = {
      jobName,
      log,
      pkg,
      tasksByStatus,
      formatDate,
    }

    const backupReportTpl = log.data?.backupReportTpl ?? DEFAULT_TEMPLATE
    return this._sendReport({
      ...(await templates.markdown.transform(templates.markdown.$metadata(context))),
      ...(await templates.compactMarkdown.transform(templates.compactMarkdown.$metadata(context))),
      ...(await templates[backupReportTpl].transform(templates[backupReportTpl].$metadata(context))),
      mailReceivers,
      subject: templates.mjml.$metadataSubject(context),
      success: log.status === 'success',
    })
  }

  async _vmHandler(log, { name: jobName, settings }, schedule, force) {
    const xo = this._xo

    const mailReceivers = get(() => settings[''].reportRecipients)
    const { reportWhen } = log.data || {}

    const formatDate = createDateFormatter(schedule?.timezone)

    const failedTasks = []
    const skippedVms = []
    const successfulVms = []
    const interruptedVms = []

    let globalMergeSize = 0
    let globalTransferSize = 0
    let nFailures = 0
    let nSkipped = 0
    let nSuccesses = 0
    let nInterrupted = 0

    for (const taskLog of log.tasks ?? []) {
      const { type, id } = taskLog.data ?? {}
      if (taskLog.message === 'get SR record' || taskLog.message === 'get remote adapter') {
        ++nFailures

        try {
          if (type === 'SR') {
            const { name_label: name, uuid } = xo.getObject(id)
            failedTasks.push({ taskLog, name, uuid })
          } else {
            const { name } = await xo.getRemote(id)
            failedTasks.push({ taskLog, name, uuid: id })
          }
        } catch (error) {
          logger.warn(error)
          failedTasks.push({ taskLog, name: UNKNOWN_ITEM, uuid: id })
        }

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

      const failedSubTasks = [] // not used at the moment
      const snapshotSubtasks = []
      const srsSubTasks = []
      const remotesSubTasks = []

      for (const subTaskLog of taskLog.tasks ?? []) {
        if (subTaskLog.message !== 'export' && subTaskLog.message !== 'snapshot') {
          continue
        }

        const type = subTaskLog.data?.type

        if (subTaskLog.message === 'snapshot') {
          snapshotSubtasks.push({ subTaskLog })
        } else if (type === 'remote') {
          const id = subTaskLog.data.id
          const remote = await xo.getRemote(id).catch(error => {
            logger.warn(error)
          })
          const title = remote !== undefined ? remote.name : `Remote Not found`

          remotesSubTasks.push({ subTaskLog, title, id })

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
          srsSubTasks.push({ subTaskLog, title: srName, id: srUuid })
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

          if (type === 'remote') {
            remotesSubTasks.push({ operationLog })
          } else if (type === 'SR') {
            srsSubTasks.push({ operationLog })
          }
        })
      }

      if (taskLog.result !== undefined) {
        if (taskLog.status === 'skipped') {
          ++nSkipped
          skippedVms.push({
            taskLog,
            vm,
            message:
              taskLog.result.message === UNHEALTHY_VDI_CHAIN_ERROR
                ? UNHEALTHY_VDI_CHAIN_MESSAGE
                : taskLog.result.message,
          })
        } else {
          ++nFailures
          failedTasks.push({ taskLog, vm })
        }
      } else {
        if (taskLog.status === 'failure') {
          ++nFailures
          failedTasks.push({ taskLog, vm, snapshotSubtasks, srsSubTasks, remotesSubTasks })
        } else if (taskLog.status === 'interrupted') {
          ++nInterrupted
          interruptedVms.push({ taskLog, vm, snapshotSubtasks, srsSubTasks, remotesSubTasks })
        } else {
          ++nSuccesses
          successfulVms.push({ taskLog, vm, snapshotSubtasks, srsSubTasks, remotesSubTasks })
        }
      }
    }

    const nVmTasks = nSuccesses + nFailures + nSkipped + nInterrupted

    const context = {
      jobName,
      log,
      pkg,
      tasksByStatus: {
        failure: { tasks: failedTasks, count: nFailures },
        skipped: { tasks: skippedVms, count: nSkipped },
        interrupted: { tasks: interruptedVms, count: nInterrupted },
        success: { tasks: force || reportWhen !== 'failure' ? successfulVms : [], count: nSuccesses },
        vmTasks: { count: nVmTasks },
      },
      formatDate,
      globalMergeSize,
      globalTransferSize,
    }

    const backupReportTpl = log.data?.backupReportTpl ?? DEFAULT_TEMPLATE
    return this._sendReport({
      ...(await templates.markdown.transform(templates.markdown.$vm(context))),
      ...(await templates.compactMarkdown.transform(templates.compactMarkdown.$vm(context))),
      ...(await templates[backupReportTpl].transform(templates[backupReportTpl].$vm(context))),
      mailReceivers,
      subject: templates.mjml.$vmSubject(context),
      success: log.status === 'success',
    })
  }

  async _sendReport({ mailReceivers, markdown, compactMarkdown, html, subject, success }) {
    if (mailReceivers === undefined || mailReceivers.length === 0) {
      mailReceivers = this._mailsReceivers
    }

    const xo = this._xo
    const promises = [
      mailReceivers !== undefined &&
        (xo.sendEmail === undefined
          ? Promise.reject(new Error('transport-email plugin not enabled'))
          : xo.sendEmail({
              to: mailReceivers,
              subject,
              html,
              text: markdown,
            })),
      this._xmppReceivers !== undefined &&
        (xo.sendEmail === undefined
          ? Promise.reject(new Error('transport-xmpp plugin not enabled'))
          : xo.sendToXmppClient({
              to: this._xmppReceivers,
              message: compactMarkdown,
            })),
      xo.sendSlackMessage !== undefined &&
        xo.sendSlackMessage({
          message: compactMarkdown,
        }),
      xo.sendIcinga2Status !== undefined &&
        xo.sendIcinga2Status({
          status: success ? 'OK' : 'CRITICAL',
          message: compactMarkdown,
        }),
    ]

    const errors = []
    const pushError = errors.push.bind(errors)

    await Promise.all(promises.filter(Boolean).map(_ => _.catch(pushError)))

    if (errors.length !== 0) {
      throw new AggregateError(
        errors,
        errors
          .map(_ => _.message)
          .filter(_ => _ != null && _.length !== 0)
          .join(', ')
      )
    }
  }
}

// ===================================================================

export default ({ xo }) => new BackupReportsXoPlugin(xo)
