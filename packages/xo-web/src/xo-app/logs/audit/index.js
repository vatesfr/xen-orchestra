import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { get } from '@xen-orchestra/defined'
import { keyBy } from 'lodash'
import { subscribeAuditLogs, subscribeUsers } from 'xo'

import { STATUS_LABELS, LOG_FILTERS, LogDate } from '../utils'

const AlertBody = decorate([
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeAuditLogs(logs => {
        cb(logs && logs[id])
      }),
  })),
  ({ log }) =>
    log !== undefined ? (
      <pre>
        {`${log.method}\n${JSON.stringify(log.params, null, 2)}\n${
          log.result
            ? JSON.stringify(log.result, null, 2).replace(/\\n/g, '\n')
            : ''
        }`}
      </pre>
    ) : null,
])

const showDetails = id => alert(_('logDetails'), <AlertBody id={id} />)

const COLUMNS = [
  {
    name: _('userLabel'),
    valuePath: 'email',
  },
  {
    name: _('logMethod'),
    valuePath: 'method',
  },
  {
    default: true,
    name: _('logTime'),
    itemRenderer: log => <LogDate time={log.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    name: _('logDuration'),
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
      return (
        <ActionButton
          btnStyle={className}
          handler={showDetails}
          handlerParam={log.callId}
          icon='preview'
          size='small'
          tooltip={_('logDisplayDetails')}
        >
          {_(label)}
        </ActionButton>
      )
    },
    sortCriteria: 'status',
  },
]

const ROW_TRANSFORM = (log, { users }) => ({
  ...log,
  email: get(() => users[log.userId].email),
})

export default decorate([
  addSubscriptions({
    logs: subscribeAuditLogs,
    users: cb => subscribeUsers(users => cb(keyBy(users, 'id'))),
  }),
  ({ logs, users }) => (
    <SortedTable
      collection={logs}
      columns={COLUMNS}
      data-users={users}
      emptyMessage={_('noLogs')}
      filters={LOG_FILTERS}
      rowTransform={ROW_TRANSFORM}
    />
  ),
])
