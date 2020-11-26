import React from 'react'
import { FormattedDate } from 'react-intl'
import { find, map } from 'lodash'

import _ from 'intl'
import BaseComponent from 'base-component'
import Copiable from 'copiable'
import NoObjects from 'no-objects'
import SortedTable from 'sorted-table'
import styles from './index.css'
import { addSubscriptions, downloadLog } from 'utils'
import { alert } from 'modal'
import { createSelector } from 'selectors'
import { get } from '@xen-orchestra/defined'
import { reportBug } from 'report-bug-button'
import { deleteApiLog, deleteApiLogs, subscribeApiLogs, subscribeUsers } from 'xo'

const formatMessage = data =>
  `\`\`\`\n${data.method}\n${JSON.stringify(data.params, null, 2)}\n${JSON.stringify(data.error, null, 2).replace(
    /\\n/g,
    '\n'
  )}\n\`\`\``

const formatLog = log =>
  `${log.data.method}\n${JSON.stringify(log.data.params, null, 2)}\n${JSON.stringify(log.data.error, null, 2).replace(
    /\\n/g,
    '\n'
  )}`

const LogMessage = ({ item: log }) => {
  const { error } = log.data
  return (
    <span>
      <pre className={styles.widthLimit}>{get(() => error.message)}</pre>
      {get(() => error.code) === 'LICENCE_RESTRICTION' ? (
        <a href='https://xcp-ng.org/' rel='noopener noreferrer' target='_blank'>
          {_('logSuggestXcpNg')}
        </a>
      ) : get(() => error.name) === 'XapiError' ? (
        _('logXapiError')
      ) : null}
    </span>
  )
}

const COLUMNS = [
  {
    name: _('logUser'),
    itemRenderer: (log, { users }) => {
      if (log.data.userId == null) {
        return _('noUser')
      }
      if (!users) {
        return '...'
      }
      const user = find(users, user => user.id === log.data.userId)
      return user ? user.email : _('unknownUser')
    },
    sortCriteria: log => log.data.userId,
  },
  {
    name: _('logMessage'),
    component: LogMessage,
    sortCriteria: log => log.data.error && log.data.error.message,
  },
  {
    default: true,
    name: _('logTime'),
    itemRenderer: log => (
      <span>
        {log.time && (
          <FormattedDate
            value={new Date(log.time)}
            month='long'
            day='numeric'
            year='numeric'
            hour='2-digit'
            minute='2-digit'
            second='2-digit'
          />
        )}
      </span>
    ),
    sortCriteria: log => log.time,
    sortOrder: 'desc',
  },
]

const ACTIONS = [
  {
    handler: deleteApiLogs,
    individualHandler: deleteApiLog,
    individualLabel: _('logDelete'),
    icon: 'delete',
    label: _('logsDelete'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: log => alert(_('logError'), <Copiable tagName='pre'>{formatLog(log)}</Copiable>),
    icon: 'preview',
    label: _('logDisplayDetails'),
  },
  {
    handler: log => downloadLog({ log: formatLog(log), date: log.time, type: 'XO' }),
    icon: 'download',
    label: _('logDownload'),
  },
  {
    handler: log =>
      reportBug({
        formatMessage,
        message: log.data,
        title: `Error on ${log.data.method}`,
      }),
    icon: 'bug',
    label: _('reportBug'),
  },
]

@addSubscriptions({
  logs: subscribeApiLogs,
  users: subscribeUsers,
})
export default class Logs extends BaseComponent {
  _getLogs = createSelector(
    () => this.props.logs,
    logs => logs && map(logs, (log, id) => ({ ...log, id }))
  )

  _getPredicate = logs => logs != null

  render() {
    const logs = this._getLogs()

    return (
      <NoObjects collection={logs} message={_('noLogs')} predicate={this._getPredicate}>
        {() => (
          <SortedTable
            actions={ACTIONS}
            collection={logs}
            columns={COLUMNS}
            data-users={this.props.users}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        )}
      </NoObjects>
    )
  }
}
