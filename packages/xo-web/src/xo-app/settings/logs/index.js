import React from 'react'
import { FormattedDate } from 'react-intl'
import { find, map } from 'lodash'

import _ from 'intl'
import BaseComponent from 'base-component'
import Copiable from 'copiable'
import NoObjects from 'no-objects'
import SortedTable from 'sorted-table'
import styles from './index.css'
import { addSubscriptions } from 'utils'
import { alert } from 'modal'
import { createSelector } from 'selectors'
import { CAN_REPORT_BUG, reportBug } from 'report-bug-button'
import {
  deleteApiLog,
  deleteApiLogs,
  subscribeApiLogs,
  subscribeUsers,
} from 'xo'

const formatMessage = data =>
  `\`\`\`\n${data.method}\n${JSON.stringify(
    data.params,
    null,
    2
  )}\n${JSON.stringify(data.error, null, 2).replace(/\\n/g, '\n')}\n\`\`\``

const formatLog = log =>
  `${log.data.method}\n${JSON.stringify(
    log.data.params,
    null,
    2
  )}\n${JSON.stringify(log.data.error, null, 2).replace(/\\n/g, '\n')}`

const downloadLog = log => {
  const file = new window.Blob([formatLog(log)], {
    type: 'text/plain',
  })
  const anchor = document.createElement('a')
  anchor.href = window.URL.createObjectURL(file)
  anchor.download = `${new Date(log.time).toISOString()} - XO.log`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
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
    itemRenderer: log => (
      <pre className={styles.widthLimit}>
        {log.data.error && log.data.error.message}
      </pre>
    ),
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
    handler: log =>
      alert(_('logError'), <Copiable tagName='pre'>{formatLog(log)}</Copiable>),
    icon: 'preview',
    label: _('logDisplayDetails'),
  },
  {
    handler: log => downloadLog(log),
    icon: 'reply',
    label: _('logDownload'),
  },
  {
    disabled: !CAN_REPORT_BUG,
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
      <NoObjects
        collection={logs}
        message={_('noLogs')}
        predicate={this._getPredicate}
      >
        {() => (
          <SortedTable
            actions={ACTIONS}
            collection={logs}
            columns={COLUMNS}
            data-users={this.props.users}
            individualActions={INDIVIDUAL_ACTIONS}
          />
        )}
      </NoObjects>
    )
  }
}
