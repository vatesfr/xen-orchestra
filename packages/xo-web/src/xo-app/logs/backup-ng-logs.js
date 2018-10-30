import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { formatSize } from 'utils'
import { FormattedDate } from 'react-intl'
import { isEmpty, groupBy, keyBy } from 'lodash'
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

const LOG_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: log => log.jobId.slice(4, 8),
    sortCriteria: log => log.jobId,
  },
  {
    name: _('jobName'),
    itemRenderer: (log, { jobs }) => get(() => jobs[log.jobId].name),
    sortCriteria: (log, { jobs }) => get(() => jobs[log.jobId].name),
  },
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
        <NoObjects
          collection={defined(() => logs.backup, [])}
          columns={LOG_COLUMNS}
          component={SortedTable}
          data-jobs={jobs}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          individualActions={LOG_INDIVIDUAL_ACTIONS}
        />
      </CardBlock>
    </Card>
  ),
].reduceRight((value, decorator) => decorator(value))
