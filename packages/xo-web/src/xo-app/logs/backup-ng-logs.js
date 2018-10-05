import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { formatSize, formatSpeed } from 'utils'
import { FormattedDate } from 'react-intl'
import { get } from '@xen-orchestra/defined'
import { isEmpty, keyBy, groupBy } from 'lodash'
import { SrItem, VmItem } from 'render-xo-item'
import { subscribeBackupNgJobs, subscribeBackupNgLogs } from 'xo'

import LogAlertBody from './log-alert-body'
import LogAlertHeader from './log-alert-header'

const UL_STYLE = { listStyleType: 'none' }

const LI_STYLE = {
  whiteSpace: 'nowrap',
}

const STATUS_LABELS = {
  failure: {
    className: 'danger',
    label: 'jobFailed',
  },
  skipped: {
    className: 'info',
    label: 'jobSkipped',
  },
  success: {
    className: 'success',
    label: 'jobSuccess',
  },
  pending: {
    className: 'warning',
    label: 'jobStarted',
  },
  interrupted: {
    className: 'danger',
    label: 'jobInterrupted',
  },
}

const LOG_COMMON_COLUMNS = [
  {
    name: _('jobStart'),
    itemRenderer: log => (
      <FormattedDate
        value={new Date(log.start)}
        month='short'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: log => log.start,
    sortOrder: 'desc',
  },
  {
    default: true,
    name: _('jobEnd'),
    itemRenderer: log =>
      log.end !== undefined && (
        <FormattedDate
          value={new Date(log.end)}
          month='short'
          day='numeric'
          year='numeric'
          hour='2-digit'
          minute='2-digit'
          second='2-digit'
        />
      ),
    sortCriteria: log => log.end || log.start,
    sortOrder: 'desc',
  },
  {
    name: _('jobDuration'),
    itemRenderer: log =>
      log.end !== undefined && (
        <FormattedDuration duration={log.end - log.start} />
      ),
    sortCriteria: log => log.end - log.start,
  },
  {
    name: _('jobStatus'),
    itemRenderer: log => {
      const { className, label } = STATUS_LABELS[log.status]
      return <span className={`tag tag-${className}`}>{_(label)}</span>
    },
    sortCriteria: 'status',
  },
]

const LOG_BACKUP_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: log => get(() => log.jobId.slice(4, 8)),
    sortCriteria: log => log.jobId,
  },
  {
    name: _('jobName'),
    itemRenderer: (log, { jobs }) => get(() => jobs[log.jobId].name),
    sortCriteria: (log, { jobs }) => get(() => jobs[log.jobId].name),
  },
  ...LOG_COMMON_COLUMNS,
  {
    name: _('labelSize'),
    itemRenderer: ({ tasks: vmTasks }) => {
      if (isEmpty(vmTasks)) {
        return null
      }

      let transferSize = 0
      let mergeSize = 0
      vmTasks.forEach(({ tasks: targetSnapshotTasks = [] }) => {
        let vmTransferSize
        let vmMergeSize
        targetSnapshotTasks.forEach(({ message, tasks: operationTasks }) => {
          if (message !== 'export' || isEmpty(operationTasks)) {
            return
          }
          operationTasks.forEach(operationTask => {
            if (operationTask.status !== 'success') {
              return
            }
            if (
              operationTask.message === 'transfer' &&
              vmTransferSize === undefined
            ) {
              vmTransferSize = operationTask.result.size
            }
            if (
              operationTask.message === 'merge' &&
              vmMergeSize === undefined
            ) {
              vmMergeSize = operationTask.result.size
            }

            if (vmTransferSize !== undefined && vmMergeSize !== undefined) {
              return false
            }
          })
        })
        vmTransferSize !== undefined && (transferSize += vmTransferSize)
        vmMergeSize !== undefined && (mergeSize += vmMergeSize)
      })
      return (
        <ul style={UL_STYLE}>
          {transferSize > 0 && (
            <li style={LI_STYLE}>
              {_.keyValue(_('labelTransfer'), formatSize(transferSize))}
            </li>
          )}
          {mergeSize > 0 && (
            <li style={LI_STYLE}>
              {_.keyValue(_('labelMerge'), formatSize(mergeSize))}
            </li>
          )}
        </ul>
      )
    },
  },
]

const LOG_RESTORE_COLUMNS = [
  {
    name: _('labelVm'),
    itemRenderer: ({ data }) => (
      <ul style={UL_STYLE}>
        <li style={LI_STYLE}>{_.keyValue(_('labelName'), data.vmName)}</li>
        <li style={LI_STYLE}>{_.keyValue('UUID', data.vmUuid)}</li>
      </ul>
    ),
    sortCriteria: 'data.vmUuid',
  },
  {
    name: _('labelSr'),
    itemRenderer: ({ data }) => <SrItem id={data.srId} link newTab />,
    sortCriteria: 'data.srId',
  },
  {
    name: _('labelDetails'),
    itemRenderer: task => {
      if (task.status === 'success' && task.tasks !== undefined) {
        const result = task.tasks.find(({ message }) => message === 'transfer')
          .result
        return (
          <ul style={UL_STYLE}>
            <li style={LI_STYLE}>
              {_.keyValue(
                _('restoredVm'),
                <VmItem id={result.id} link newTab />
              )}
            </li>
            <li style={LI_STYLE}>
              {_.keyValue(_('labelSize'), formatSize(result.size))}
            </li>
            <li style={LI_STYLE}>
              {_.keyValue(
                _('labelSpeed'),
                formatSpeed(result.size, task.end - task.start)
              )}
            </li>
            <li style={LI_STYLE}>{_.keyValue(_('restoreRunId'), task.id)}</li>
          </ul>
        )
      }
      return null
    },
  },
  ...LOG_COMMON_COLUMNS,
]

const showTasks = ({ id }, { jobs }) =>
  alert(<LogAlertHeader id={id} jobs={jobs} />, <LogAlertBody id={id} />)

const LOG_INDIVIDUAL_ACTIONS = [
  {
    handler: showTasks,
    icon: 'preview',
    label: _('logDisplayDetails'),
  },
]

const LOG_FILTERS = {
  jobFailed: 'status: failure',
  jobInterrupted: 'status: interrupted',
  jobSkipped: 'status: skipped',
  jobStarted: 'status: started',
  jobSuccess: 'status: success',
}

export default [
  addSubscriptions({
    logs: cb =>
      subscribeBackupNgLogs(logs =>
        cb(
          groupBy(
            logs,
            log => (log.message === 'restore' ? 'restore' : 'backup')
          )
        )
      ),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  }),
  ({ logs, jobs }) => (
    <Card>
      <CardHeader>
        <Icon icon='log' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <div>
          <h2>{_('labelBackup')}</h2>
          <NoObjects
            collection={get(() => logs.backup) || {}}
            columns={LOG_BACKUP_COLUMNS}
            component={SortedTable}
            data-jobs={jobs}
            emptyMessage={_('noLogs')}
            filters={LOG_FILTERS}
            individualActions={LOG_INDIVIDUAL_ACTIONS}
          />
        </div>
        <div>
          <h2>{_('labelRestore')}</h2>
          <NoObjects
            collection={get(() => logs.restore) || {}}
            columns={LOG_RESTORE_COLUMNS}
            component={SortedTable}
            emptyMessage={_('noLogs')}
            filters={LOG_FILTERS}
          />
        </div>
      </CardBlock>
    </Card>
  ),
].reduceRight((value, decorator) => decorator(value))
