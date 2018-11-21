import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore, formatSize, formatSpeed } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { isEmpty, groupBy, keyBy } from 'lodash'
import { subscribeBackupNgJobs, subscribeBackupNgLogs } from 'xo'
import { toggleState } from 'reaclette-utils'
import { VmItem, SrItem } from 'render-xo-item'

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

const LogDate = ({ time }) => (
  <FormattedDate
    value={new Date(time)}
    month='short'
    day='numeric'
    year='numeric'
    hour='2-digit'
    minute='2-digit'
    second='2-digit'
  />
)

const DURATION_COLUMN = {
  name: _('jobDuration'),
  itemRenderer: log =>
    log.end !== undefined && (
      <FormattedDuration duration={log.end - log.start} />
    ),
  sortCriteria: log => log.end - log.start,
}

const LOG_BACKUP_COLUMNS = [
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
    itemRenderer: log => <LogDate time={log.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    default: true,
    name: _('jobEnd'),
    itemRenderer: log => log.end !== undefined && <LogDate time={log.end} />,
    sortCriteria: log => log.end || log.start,
    sortOrder: 'desc',
  },
  DURATION_COLUMN,
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

const showRestoreError = ({ currentTarget: { dataset } }) =>
  alert(
    _('logsFailedRestoreTitle'),
    <Copiable data={dataset.error} className='text-danger' tagName='div'>
      <Icon icon='alarm' /> {dataset.message}
    </Copiable>
  )

const LOG_RESTORE_COLUMNS = [
  {
    name: _('logsJobId'),
    itemRenderer: ({ data: { jobId } }) => jobId.slice(4, 8),
    sortCriteria: 'data.jobId',
  },
  {
    name: _('logsJobName'),
    itemRenderer: ({ data: { jobId } }, { jobs }) =>
      get(() => jobs[jobId].name),
    sortCriteria: ({ data: { jobId } }, { jobs }) =>
      get(() => jobs[jobId].name),
  },
  {
    name: _('logsJobTime'),
    itemRenderer: ({ data: { time } }) => <LogDate time={time} />,
    sortCriteria: 'data.time',
  },
  {
    name: _('labelVm'),
    itemRenderer: ({ id, vm, status }) => (
      <div>
        {vm !== undefined && <VmItem id={vm.id} link newTab />}
        {vm === undefined && status === 'success' && (
          <span className='text-warning'>{_('logsVmNotFound')}</span>
        )}{' '}
        <span style={{ fontSize: '0.5em' }} className='text-muted'>
          {id}
        </span>
      </div>
    ),
    sortCriteria: ({ vm }) => vm !== undefined && vm.name_label,
  },
  {
    default: true,
    name: _('jobStart'),
    itemRenderer: log => <LogDate time={log.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  DURATION_COLUMN,
  {
    name: _('labelSr'),
    itemRenderer: ({ data: { srId } }) => <SrItem id={srId} link newTab />,
    sortCriteria: ({ data: { srId } }, { srs }) =>
      get(() => srs[srId].name_label),
  },
  {
    name: _('jobStatus'),
    itemRenderer: task => {
      const { className, label } = STATUS_LABELS[task.status]
      return (
        <div>
          <span className={`tag tag-${className}`}>{_(label)}</span>{' '}
          {task.status === 'failure' && (
            <Tooltip content={_('logsFailedRestoreError')}>
              <a
                className='text-danger'
                onClick={showRestoreError}
                data-message={task.result.message}
                data-error={JSON.stringify(task.result)}
                style={{ cursor: 'pointer' }}
              >
                <Icon icon='alarm' />
              </a>
            </Tooltip>
          )}
        </div>
      )
    },
    sortCriteria: 'status',
  },
  {
    name: _('labelSize'),
    itemRenderer: ({ dataSize }) =>
      dataSize !== undefined && formatSize(dataSize),
    sortCriteria: 'dataSize',
  },
  {
    name: _('labelSpeed'),
    itemRenderer: task => {
      const duration = task.end - task.start
      return (
        task.dataSize !== undefined &&
        duration > 0 &&
        formatSpeed(task.dataSize, duration)
      )
    },
    sortCriteria: task => {
      const duration = task.end - task.start
      return (
        task.dataSize !== undefined && duration > 0 && task.dataSize / duration
      )
    },
  },
]

const ROW_TRANSFORM = (task, { vms }) => {
  let vm, dataSize
  if (task.status === 'success') {
    const result = task.tasks.find(({ message }) => message === 'transfer')
      .result
    dataSize = result.size
    vm = vms && vms[result.id]
  }

  return {
    ...task,
    dataSize,
    vm,
  }
}

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
  jobStarted: 'status: pending',
  jobSuccess: 'status: success',
}

const TenPerPage = ({ name, handler, value }) => (
  <Button className='pull-right' name={name} onClick={handler} size='small'>
    {_(value ? 'logsThreePerPage' : 'logsTenPerPage')}
  </Button>
)

export default decorate([
  connectStore({
    srs: createGetObjectsOfType('SR'),
    vms: createGetObjectsOfType('VM'),
  }),
  addSubscriptions({
    logs: cb =>
      subscribeBackupNgLogs(logs =>
        cb(
          logs &&
            groupBy(logs, log =>
              log.message === 'restore' ? 'restore' : 'backup'
            )
        )
      ),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  }),
  provideState({
    initialState: () => ({
      tenPerPageBackup: false,
      tenPerPageRestore: false,
    }),
    effects: {
      toggleState,
    },
  }),
  injectState,
  ({ state, effects, logs, jobs, srs, vms }) => (
    <Card>
      <CardHeader>
        <Icon icon='log' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <h2>
          {_('labelBackup')}
          <TenPerPage
            name='tenPerPageBackup'
            handler={effects.toggleState}
            value={state.tenPerPageBackup}
          />
        </h2>
        <NoObjects
          collection={logs && defined(logs.backup, [])}
          columns={LOG_BACKUP_COLUMNS}
          component={SortedTable}
          data-jobs={jobs}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          individualActions={LOG_INDIVIDUAL_ACTIONS}
          itemsPerPage={state.tenPerPageBackup ? 10 : 3}
        />
        <h2>
          {_('labelRestore')}
          <TenPerPage
            name='tenPerPageRestore'
            handler={effects.toggleState}
            value={state.tenPerPageRestore}
          />
        </h2>
        <NoObjects
          collection={logs && defined(logs.restore, [])}
          columns={LOG_RESTORE_COLUMNS}
          component={SortedTable}
          data-jobs={jobs}
          data-srs={srs}
          data-vms={vms}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          itemsPerPage={state.tenPerPageRestore ? 10 : 3}
          rowTransform={ROW_TRANSFORM}
        />
      </CardBlock>
    </Card>
  ),
])
