import Handlebars from 'handlebars'
import humanFormat from 'human-format'
import moment from 'moment-timezone'
import { createLogger } from '@xen-orchestra/log'
import { forEach, groupBy } from 'lodash'
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
Handlebars.registerHelper('formatDuration', formatDuration)

const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

Handlebars.registerHelper('formatSize', formatSize)

const formatSpeed = (bytes, milliseconds) =>
  milliseconds > 0
    ? humanFormat((bytes * 1e3) / milliseconds, {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'

Handlebars.registerHelper('formatSpeed', (bytes, start, end) => formatSpeed(bytes, end - start))

const noop = Function.prototype

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_MESSAGE =
  '[(unhealthy VDI chain) Job canceled to protect the VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection)'

// ===================================================================

const TITLE_BY_STATUS = {
  failure: n => `## ${n} Failure${n === 1 ? '' : 's'}`,
  interrupted: n => `## ${n} Interrupted`,
  skipped: n => `## ${n} Skipped`,
  success: n => `## ${n} Success${n === 1 ? '' : 'es'}`,
}

Handlebars.registerHelper('titleByStatus', function (status) {
  // To change maybe
  if (this && status in TITLE_BY_STATUS) {
    return TITLE_BY_STATUS[status](this.length)
  }
})

Handlebars.registerHelper('pluralizeStatus', function (status, pluralMark, number) {
  return number > 1 ? status + pluralMark : status
})

Handlebars.registerHelper('executeFunction', function (fct, arg) {
  // TODO : maybe replace this by registering formatDate as a helper
  return fct(arg)
})

Handlebars.registerHelper('reluSubtract', function (a, b, threshold) {
  const res = a - b
  return res >= threshold ? res : 0
})

const reportTemporalData = `- **Start time**: {{executeFunction formatDate start}}
{{#if end}}
- **End time**: {{executeFunction formatDate end}}
{{#if (reluSubtract end start 1)}}
- **Duration**: {{formatDuration (reluSubtract end start 1)}}
{{/if}}
{{/if}}`

Handlebars.registerPartial('reportTemporalData', reportTemporalData)

const reportWarnings = `{{#if warnings.length}}

{{#each warnings}}
- **${ICON_WARNING} {{message}}
{{/each}}
{{/if}}`

Handlebars.registerPartial('reportWarnings', reportWarnings)

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this)
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this)
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this)
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this)
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this)
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this)
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this)
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})

const reportError = `{{#ifCond task.status '!==' 'success'}}
{{#if task.result.message}}

- **{{#ifCond task.status '===' 'skipped'~}} Reason {{~^~}} Error {{~/ifCond}}**: {{task.result.message}}
{{else if task.result.code}}

- **{{#ifCond task.status '===' 'skipped'~}} Reason {{~^~}} Error {{~/ifCond}}**: {{task.result.code}}
{{/if}}
{{/ifCond}}`

Handlebars.registerPartial('reportError', reportError)

Handlebars.registerHelper('getIcon', function (status) {
  return STATUS_ICON[status]
})

const taskTitle = `{{#ifCond task.data.type '===' 'xo'}}
[XO] {{jobName}}
{{~/ifCond}}
{{#ifCond task.data.type '===' 'remote'}}
[remote] {{task.additionnalData.name}}
{{~/ifCond}}
{{#ifCond task.data.type '===' 'pool'}}
[pool] {{#if task.data.pool.name_label ~}} {{task.data.pool.name_label}} {{~else if task.data?.poolMaster?.name_label ~}} {{task.data.poolMaster.name_label}} {{~else~}} ${UNKNOWN_ITEM} {{~/if}}
{{~/ifCond}}`

Handlebars.registerPartial('taskTitle', taskTitle)

const taskBody = `{{#ifCond task.data.type '===' 'remote'}}
- **ID**: {{task.data.id}}
{{/ifCond}}
{{#ifCond task.data.type '===' 'pool'}}
{{#if task.data.pool.uuid}}
- **UUID**: {{task.data.pool.uuid}}
{{else}}
- **ID**: {{task.data.id}}
{{/if}}
{{/ifCond}}`

Handlebars.registerPartial('taskBody', taskBody)

const getTaskAdditionnalData = async (task, props) => {
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

const metadataSubTaskPartial = `{{#*inline "indentedBlock"}}
{{>taskBody task=.}}
{{>reportTemporalData}}
{{~>reportError task=.}}
{{~>reportWarnings}}
{{/inline}}
- **{{>taskTitle task=. jobName=''}}** {{getIcon status}}
  {{> indentedBlock}}`

Handlebars.registerPartial('metadataSubtask', metadataSubTaskPartial)

const metadataTemplate = `##  Global status: {{log.status}}

- **Job ID**: {{log.jobId}}
- **Job name**: {{jobName}}
- **Run ID**: {{log.id}}
{{>reportTemporalData end=log.end start=log.start}}
{{#if log.tasks.length}}
- **Successes**: {{#if tasksByStatus.success.length ~}} {{tasksByStatus.success.length}} {{~else~}} 0 {{~/if}} / {{log.tasks.length}}
{{/if}}
{{~>reportError task=log}}
{{~>reportWarnings warnings=log.warnings}}
{{#each tasksByStatus}}
---

{{titleByStatus @key}}
{{#each this}}


### {{>taskTitle task=. jobName=../../log.jobName}}
{{>taskBody task=.}}
{{>reportTemporalData formatDate=../../formatDate}}
{{~>reportError task=.}}
{{~>reportWarnings warnings=this.warnings}}
{{#each this.tasks}}
  {{>metadataSubtask formatDate=../../../formatDate}}
{{/each}}
{{/each}}
{{/each}}
---

*{{pkg.name}} v{{pkg.version}}*`

const compiledMetadataTemplate = Handlebars.compile(metadataTemplate)

// ===================================================================

const vmSubTaskPartial = `{{#if subTaskLog}}
- **{{title}}** ({{id}}) {{getIcon subTaskLog.status}}
  {{>reportTemporalData end=subTaskLog.end start=subTaskLog.start}}
  {{~>reportWarnings warnings=subTaskLog.warnings}}
  {{~>reportError task=subTaskLog}}
{{else}}
  - **{{operationLog.message}}** {{getIcon operationLog.status}}
    {{>reportTemporalData end=operationLog.end start=operationLog.start}}
    {{#if operationLog.result.size}}
    - **Size**: {{formatSize operationLog.result.size}}
    - **Speed**: {{formatSpeed operationLog.result.size operationLog.start operationLog.end}}
    {{/if}}
    {{~>reportWarnings warnings=operationLog.warnings}}
    {{~>reportError task=operationLog}}
{{/if}}
`

Handlebars.registerPartial('vmSubTaskPartial', vmSubTaskPartial)

const vmSubTextPartial = `{{#each snapshotSubtasks}}
- **Snapshot** {{getIcon subTaskLog.status}}
  {{>reportTemporalData end=subTaskLog.end start=subTaskLog.start formatDate=../formatDate}}
{{/each}}
{{#if srsSubTasks}}
- **SRs**
{{#each srsSubTasks}}
  {{>vmSubTaskPartial formatDate=../formatDate}}
{{/each}}
{{/if}}
{{#if remotesSubTasks}}
- **Remotes**
{{#each remotesSubTasks}}
  {{>vmSubTaskPartial formatDate=../formatDate}}
{{/each}}
{{/if}}
`

Handlebars.registerPartial('vmSubTextPartial', vmSubTextPartial)

const vmTextPartial = `
{{#if vm}}
### {{vm.name_label}}

- **UUID**: {{vm.uuid}}
{{else}}
### VM not found

- **UUID**: {{taskLog.data.id}}
{{/if}}
{{>reportTemporalData end=taskLog.end start=taskLog.start}}
{{~>reportWarnings warnings=taskLog.warnings}}
`

Handlebars.registerPartial('vmTextPartial', vmTextPartial)

const vmSuccessPartial = `---

## {{tasksByStatus.success.count}} {{pluralizeStatus 'Success' 'es' tasksByStatus.success.count}}

{{#each tasksByStatus.success.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/each}}
`

Handlebars.registerPartial('vmSuccessPartial', vmSuccessPartial)

const vmInterruptedPartial = `---

## {{tasksByStatus.interrupted.count}} Interrupted

{{#each tasksByStatus.interrupted.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/each}}
`

Handlebars.registerPartial('vmInterruptedPartial', vmInterruptedPartial)

const vmSkippedPartial = `---

## {{tasksByStatus.skipped.count}} Skipped

{{#each tasksByStatus.skipped.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
- **Reason**: {{message}}
{{/each}}
`

Handlebars.registerPartial('vmSkippedPartial', vmSkippedPartial)

const vmFailurePartial = `---

## {{tasksByStatus.failure.count}} {{pluralizeStatus 'Failure' 's' tasksByStatus.failure.count}}

{{#each tasksByStatus.failure.tasks}}
{{#if uuid}}

### {{name}}

- **UUID**: {{uuid}}
- **Type**: {{taskLog.data.type}}
{{>reportTemporalData end=taskLog.end start=taskLog.start}}
{{~>reportWarnings warnings=taskLog.warnings}}
- **Error**: {{taskLog.result.message}}
{{else}}
{{>vmTextPartial formatDate=../formatDate}}
{{#if taskLog.result}}
- **Error**: {{taskLog.result.message}}
{{else}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/if}}
{{/if}}
{{/each}}
`

Handlebars.registerPartial('vmFailurePartial', vmFailurePartial)

const vmTemplate = `##  Global status: {{log.status}}

- **Job ID**: {{log.jobId}}
- **Run ID**: {{log.id}}
- **mode**: {{log.data.mode}}
{{>reportTemporalData end=log.end start=log.start}}
{{#if log.tasks}}
- **Successes**: {{tasksByStatus.success.count}} / {{tasksByStatus.vmTasks.count}}
{{#if globalTransferSize}}
- **Transfer size**: {{formatSize globalTransferSize}}
{{/if}}
{{#if globalMergeSize}}
- **Merge size**: {{formatSize globalMergeSize}}
{{/if}}
{{~>reportWarnings warnings=log.warnings}}

{{#if tasksByStatus.failure.tasks}}
{{>vmFailurePartial}}
{{/if}}
{{#if tasksByStatus.skipped.tasks}}
{{>vmSkippedPartial}}
{{/if}}
{{#if tasksByStatus.interrupted.tasks}}
{{>vmInterruptedPartial}}
{{/if}}
{{#if tasksByStatus.success.tasks}}
{{>vmSuccessPartial}}
{{/if}}
{{else}}
{{~>reportError task=log}}
{{~>reportWarnings warnings=log.warnings}}
{{/if}}
---

*{{pkg.name}} v{{pkg.version}}*`

const compiledVmTemplate = Handlebars.compile(vmTemplate)

// TODO : do a partial to mutualize templates
// TODO : Dynamic Partials for vmSuccessPartial, vmInterruptedPArtial, etc...
// TODO : do as titleByStatus for this template
// TODO : getIcon could be a
// TODO : remove pluralizeStatus

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

    if (job.type === 'backup' || job.type === 'mirrorBackup') {
      return this._vmHandler(log, job, schedule, force)
    } else if (job.type === 'metadataBackup') {
      return this._metadataHandler(log, job, schedule, force)
    }

    throw new Error(`Unknown backup job type: ${job.type}`)
  }

  async _metadataHandler(log, { name: jobName }, schedule, force) {
    const xo = this._xo

    const formatDate = createDateFormatter(schedule?.timezone)

    const tasksByStatus = groupBy(log.tasks, 'status')

    if (!force && log.data.reportWhen === 'failure') {
      delete tasksByStatus.success
    }

    for (const taskBatch of Object.values(tasksByStatus)) {
      for (const task of taskBatch) {
        task.additionnalData = await getTaskAdditionnalData(task, { xo })
        for (const subTask of task.tasks) {
          subTask.additionnalData = await getTaskAdditionnalData(subTask, { xo })
        }
      }
    }

    const markdown = compiledMetadataTemplate({
      jobName,
      log,
      pkg,
      tasksByStatus,
      formatDate,
    })

    return this._sendReport({
      subject: `[Xen Orchestra] ${log.status} − Metadata backup report for ${log.jobName} ${STATUS_ICON[log.status]}`,
      markdown,
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

    for (const taskLog of log.tasks) {
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

      const failedSubTasks = [] // not used ATM
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

    const markdown = compiledVmTemplate({
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
    })

    return this._sendReport({
      mailReceivers,
      markdown,
      subject: `[Xen Orchestra] ${log.status} − Backup report for ${jobName} ${STATUS_ICON[log.status]}`,
      success: log.status === 'success',
    })
  }

  async _sendReport({ mailReceivers, markdown, subject, success }) {
    // console.log("==========================")
    // console.log(markdown)
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
              markdown,
            })),
      this._xmppReceivers !== undefined &&
        (xo.sendEmail === undefined
          ? Promise.reject(new Error('transport-xmpp plugin not enabled'))
          : xo.sendToXmppClient({
              to: this._xmppReceivers,
              message: markdown,
            })),
      xo.sendSlackMessage !== undefined &&
        xo.sendSlackMessage({
          message: markdown,
        }),
      xo.sendIcinga2Status !== undefined &&
        xo.sendIcinga2Status({
          status: success ? 'OK' : 'CRITICAL',
          message: markdown,
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
