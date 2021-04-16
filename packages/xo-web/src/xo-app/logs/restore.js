import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore, formatSize, formatSpeed } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { filter, keyBy } from 'lodash'
import { get } from '@xen-orchestra/defined'
import { subscribeBackupNgLogs, subscribeBackupNgJobs } from 'xo'
import { Vm, Sr } from 'render-xo-item'

import { STATUS_LABELS, LOG_FILTERS, LogDate } from './utils'

const showRestoreError = ({ currentTarget: { dataset } }) =>
  alert(
    _('logsFailedRestoreTitle'),
    <Copiable data={dataset.error} className='text-danger' tagName='div'>
      <Icon icon='alarm' /> {dataset.message}
    </Copiable>
  )

const COLUMNS = [
  {
    name: _('logsJobId'),
    itemRenderer: ({ data: { jobId } }) => jobId.slice(4, 8),
    sortCriteria: 'data.jobId',
  },
  {
    name: _('logsJobName'),
    itemRenderer: ({ data: { jobId } }, { jobs }) => get(() => jobs[jobId].name),
    sortCriteria: ({ data: { jobId } }, { jobs }) => get(() => jobs[jobId].name),
  },
  {
    name: _('logsBackupTime'),
    itemRenderer: ({ data: { time } }) => <LogDate time={time} />,
    sortCriteria: 'data.time',
  },
  {
    name: _('labelVm'),
    itemRenderer: ({ id, vm, status }) => (
      <div>
        {vm !== undefined && <Vm id={vm.id} link newTab />}
        {vm === undefined && status === 'success' && <span className='text-warning'>{_('logsVmNotFound')}</span>}{' '}
        <span style={{ fontSize: '0.5em' }} className='text-muted'>
          {id}
        </span>
      </div>
    ),
    sortCriteria: ({ vm }) => vm !== undefined && vm.name_label,
  },
  {
    default: true,
    name: _('logsRestoreTime'),
    itemRenderer: log => <LogDate time={log.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    name: _('jobDuration'),
    itemRenderer: log => log.end !== undefined && <FormattedDuration duration={log.end - log.start} />,
    sortCriteria: log => log.end - log.start,
  },
  {
    name: _('labelSr'),
    itemRenderer: ({ data: { srId } }) => <Sr id={srId} link newTab />,
    sortCriteria: ({ data: { srId } }, { srs }) => get(() => srs[srId].name_label),
  },
  {
    name: _('jobStatus'),
    itemRenderer: task => {
      const { className, label } = STATUS_LABELS[task.status]
      return (
        <div>
          <span className={`tag tag-${className}`}>{_(label)}</span>{' '}
          {task.status === 'failure' &&
            // 2021-03-19 - JFT: can be undefined due to bug, see a95b10239
            task.result !== undefined && (
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
    itemRenderer: ({ dataSize }) => dataSize !== undefined && formatSize(dataSize),
    sortCriteria: 'dataSize',
  },
  {
    name: _('labelSpeed'),
    itemRenderer: task => {
      const duration = task.end - task.start
      return task.dataSize !== undefined && duration > 0 && formatSpeed(task.dataSize, duration)
    },
    sortCriteria: task => {
      const duration = task.end - task.start
      return task.dataSize !== undefined && duration > 0 && task.dataSize / duration
    },
  },
]

const ROW_TRANSFORM = (task, { vms }) => {
  let vm, dataSize
  if (task.status === 'success') {
    const result = task.tasks.find(({ message }) => message === 'transfer').result
    dataSize = result.size
    vm = vms && vms[result.id]
  }

  return {
    ...task,
    dataSize,
    vm,
  }
}

export default decorate([
  connectStore({
    srs: createGetObjectsOfType('SR'),
    vms: createGetObjectsOfType('VM'),
  }),
  addSubscriptions({
    logs: cb => subscribeBackupNgLogs(logs => cb(logs && filter(logs, log => log.message === 'restore'))),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  }),
  ({ logs, jobs, srs, vms }) => (
    <Card>
      <CardHeader>
        <Icon icon='logs' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <NoObjects
          collection={logs}
          columns={COLUMNS}
          component={SortedTable}
          data-jobs={jobs}
          data-srs={srs}
          data-vms={vms}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          rowTransform={ROW_TRANSFORM}
          stateUrlParam='s_logs'
        />
      </CardBlock>
    </Card>
  ),
])
