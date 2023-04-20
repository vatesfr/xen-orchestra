import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Copiable from 'copiable'
import copy from 'copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore, downloadLog } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import filter from 'lodash/filter.js'
import { Pool } from 'render-xo-item'
import { subscribeBackupNgLogs } from 'xo'

import { STATUS_LABELS, LOG_FILTERS, LogDate } from './utils'

const showError = error => alert(_('logError'), <pre>{JSON.stringify(error, null, 2).replace(/\\n/g, '\n')}</pre>)

const COLUMNS = [
  {
    name: _('job'),
    itemRenderer: ({ data }) => (
      <Copiable data={data.jobId} tagName='div'>
        {data.jobName || data.jobId.slice(4, 8)}
      </Copiable>
    ),
    sortCriteria: 'data.jobId',
  },
  {
    name: _('item'),
    itemRenderer: ({ data }, { pools }) =>
      data.pool === undefined ? (
        'Xen Orchestra'
      ) : pools[data.pool.uuid] !== undefined ? (
        <Pool id={data.pool.uuid} link newTab />
      ) : (
        <Copiable data={data.pool.uuid} tagName='div'>
          {data.pool.name_label || data.poolMaster.name_label}
        </Copiable>
      ),
    sortCriteria: ({ data }) => (data.pool !== undefined ? data.pool.uuid : data.jobId),
  },
  {
    name: _('logsBackupTime'),
    itemRenderer: ({ data: { timestamp } }) => <LogDate time={timestamp} />,
    sortCriteria: 'data.timestamp',
  },
  {
    default: true,
    name: _('logsRestoreTime'),
    itemRenderer: task => <LogDate time={task.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    name: _('jobDuration'),
    itemRenderer: task => task.end !== undefined && <FormattedDuration duration={task.end - task.start} />,
    sortCriteria: task => task.end - task.start,
  },
  {
    name: _('jobStatus'),
    itemRenderer: task => {
      const { className, label } = STATUS_LABELS[task.status]

      // failed task
      if (task.status !== 'success' && task.status !== 'pending') {
        return (
          <ActionButton
            btnStyle={className}
            handler={showError}
            handlerParam={task.result}
            icon='preview'
            size='small'
            tooltip={_('clickToShowError')}
          >
            {_(label)}
          </ActionButton>
        )
      }

      return <span className={`tag tag-${className}`}>{_(label)}</span>
    },
    sortCriteria: 'status',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    icon: 'download',
    label: _('logDownload'),
    handler: task =>
      downloadLog({
        log: task,
        date: task.start,
        type: 'Metadata restore',
      }),
  },
  {
    icon: 'clipboard',
    label: _('copyLogToClipboard'),
    handler: task => copy(JSON.stringify(task, null, 2)),
  },
]

export default decorate([
  connectStore({
    pools: createGetObjectsOfType('pool'),
  }),
  addSubscriptions({
    logs: cb => subscribeBackupNgLogs(logs => cb(logs && filter(logs, log => log.message === 'metadataRestore'))),
  }),
  ({ logs, pools }) => (
    <Card>
      <CardHeader>
        <Icon icon='logs' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <NoObjects
          collection={logs}
          columns={COLUMNS}
          component={SortedTable}
          data-pools={pools}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          individualActions={INDIVIDUAL_ACTIONS}
          stateUrlParam='s_logs'
        />
      </CardBlock>
    </Card>
  ),
])
