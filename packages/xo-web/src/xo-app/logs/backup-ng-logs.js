import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { FormattedDate } from 'react-intl'
import { forEach, get, keyBy } from 'lodash'
import {
  deleteJobsLogs,
  subscribeBackupNgJobs,
  subscribeBackupNgLogs,
} from 'xo'

import LogAlertBody from './log-alert-body'
import { isSkippedError } from './utils'

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
  started: {
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
    name: _('jobMode'),
    itemRenderer: log => log.data.mode,
    sortCriteria: log => log.data.mode,
  },
  {
    name: _('jobName'),
    itemRenderer: (log, { jobs }) => get(jobs, `${log.jobId}.name`),
    sortCriteria: (log, { jobs }) => get(jobs, `${log.jobId}.name`),
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
      log.duration !== undefined && (
        <FormattedDuration duration={log.duration} />
      ),
    sortCriteria: log => log.duration,
  },
  {
    name: _('jobStatus'),
    itemRenderer: log => {
      const { className, label } = STATUS_LABELS[log.status]
      return <span className={`tag tag-${className}`}>{_(label)}</span>
    },
  },
]

const showCalls = (log, { logs, jobs }) =>
  alert(
    _('jobModalTitle', { job: log.jobId.slice(4, 8) }),
    <LogAlertBody log={log} job={get(jobs, log.jobId)} logs={logs} />
  )

const LOG_INDIVIDUAL_ACTIONS = [
  {
    handler: showCalls,
    icon: 'preview',
    label: _('logDisplayDetails'),
  },
]

const LOG_ACTIONS = [
  {
    handler: deleteJobsLogs,
    icon: 'delete',
    label: _('remove'),
  },
]

const LOG_FILTERS = {
  jobFailed: 'status: failure',
  jobInterrupted: 'status: interrupted',
  jobSkipped: 'status: skipped',
  jobStarted: 'status: started',
  jobSuccess: 'status: success',
}

const rowTransform = (log, { logs, jobs }) => {
  let status
  if (log.end !== undefined) {
    let hasError = false
    let hasTaskSkipped = false
    forEach(logs[log.id], ({ status, result }) => {
      if (status !== 'failure') {
        return
      }
      if (result === undefined || !isSkippedError(result)) {
        hasError = true
        return false
      }
      hasTaskSkipped = true
    })
    status = hasError ? 'failure' : hasTaskSkipped ? 'skipped' : 'success'
  } else {
    status =
      log.id === get(() => jobs[log.jobId].runId) ? 'started' : 'interrupted'
  }

  return {
    ...log,
    status,
  }
}

export default [
  addSubscriptions({
    logs: subscribeBackupNgLogs,
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  }),
  ({ logs, jobs }) => (
    <Card>
      <CardHeader>
        <Icon icon='log' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <NoObjects
          actions={LOG_ACTIONS}
          collection={get(logs, 'roots')}
          columns={LOG_COLUMNS}
          component={SortedTable}
          data-jobs={jobs}
          data-logs={logs}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          individualActions={LOG_INDIVIDUAL_ACTIONS}
          rowTransform={rowTransform}
        />
      </CardBlock>
    </Card>
  ),
].reduceRight((value, decorator) => decorator(value))
