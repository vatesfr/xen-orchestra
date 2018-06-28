import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import ButtonGroup from 'button-group'
import CopyToClipboard from 'react-copy-to-clipboard'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import ReportBugButton, { CAN_REPORT_BUG } from 'report-bug-button'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { keyBy } from 'lodash'
import { FormattedDate } from 'react-intl'
import { get } from 'xo-defined'
import {
  deleteJobsLogs,
  subscribeBackupNgJobs,
  subscribeBackupNgLogs,
} from 'xo'

import LogAlertBody from './log-alert-body'

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
  },
]

const showTasks = (log, { jobs }) => {
  const formattedLog = JSON.stringify(log, null, 2)
  alert(
    <span>
      {get(() => jobs[log.jobId].name) || 'Job'} ({log.jobId.slice(4, 8)}){' '}
      <span style={{ fontSize: '0.5em' }} className='text-muted'>
        {log.id}
      </span>{' '}
      {log.status !== 'success' &&
        log.status !== 'pending' && (
          <ButtonGroup>
            <Tooltip content={_('copyToClipboard')}>
              <CopyToClipboard text={formattedLog}>
                <Button size='small'>
                  <Icon icon='clipboard' />
                </Button>
              </CopyToClipboard>
            </Tooltip>
            {CAN_REPORT_BUG && (
              <ReportBugButton
                message={`\`\`\`json\n${formattedLog}\n\`\`\``}
                size='small'
                title='Backup job failed'
              />
            )}
          </ButtonGroup>
        )}
    </span>,
    <LogAlertBody id={log.id} />
  )
}

const LOG_INDIVIDUAL_ACTIONS = [
  {
    handler: showTasks,
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
          collection={logs}
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
