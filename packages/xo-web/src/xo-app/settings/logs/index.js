import React from 'react'
import { FormattedDate } from 'react-intl'
import { find, map } from 'lodash'

import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import ButtonGroup from 'button-group'
import Copiable from 'copiable'
import NoObjects from 'no-objects'
import ReportBugButton, { CAN_REPORT_BUG } from 'report-bug-button'
import SortedTable from 'sorted-table'
import styles from './index.css'
import TabButton from 'tab-button'
import { addSubscriptions } from 'utils'
import { alert, confirm } from 'modal'
import { createSelector } from 'selectors'
import { subscribeApiLogs, subscribeUsers, deleteApiLog } from 'xo'

const formatMessage = data =>
  `\`\`\`\n${data.method}\n${JSON.stringify(
    data.params,
    null,
    2
  )}\n${JSON.stringify(data.error, null, 2).replace(/\\n/g, '\n')}\n\`\`\``

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
  {
    name: '',
    itemRenderer: (log, { showError }) => (
      <div className='text-xs-right'>
        <ButtonGroup>
          <ActionRowButton
            handler={showError}
            handlerParam={log}
            icon='preview'
            tooltip={_('logDisplayDetails')}
          />
          <ActionRowButton
            btnStyle='danger'
            handler={deleteApiLog}
            handlerParam={log.id}
            icon='delete'
            tooltip={_('logDelete')}
          />
          {CAN_REPORT_BUG && (
            <ReportBugButton
              message={log.data}
              formatMessage={formatMessage}
              rowButton
              title={`Error on ${log.data.method}`}
            />
          )}
        </ButtonGroup>
      </div>
    ),
  },
]

@addSubscriptions({
  logs: subscribeApiLogs,
  users: subscribeUsers,
})
export default class Logs extends BaseComponent {
  _deleteAllLogs = () =>
    confirm({
      title: _('logDeleteAllTitle'),
      body: _('logDeleteAllMessage'),
    }).then(() =>
      Promise.all(map(this.props.logs, (log, id) => deleteApiLog(id)))
    )

  _getLogs = createSelector(
    () => this.props.logs,
    logs => logs && map(logs, (log, id) => ({ ...log, id }))
  )

  _showError = log =>
    alert(
      _('logError'),
      <Copiable tagName='pre'>
        {`${log.data.method}\n${JSON.stringify(
          log.data.params,
          null,
          2
        )}\n${JSON.stringify(log.data.error, null, 2).replace(/\\n/g, '\n')}`}
      </Copiable>
    )

  _getData = createSelector(
    () => this.props.users,
    () => this._showError,
    (users, showError) => ({ users, showError })
  )

  _getPredicate = logs => logs != null

  render () {
    const logs = this._getLogs()

    return (
      <NoObjects
        collection={logs}
        message={_('noLogs')}
        predicate={this._getPredicate}
      >
        {() => (
          <div>
            <span className='pull-right'>
              <TabButton
                btnStyle='danger'
                handler={this._deleteAllLogs}
                icon='delete'
                labelId='logDeleteAll'
              />
            </span>{' '}
            <SortedTable
              collection={logs}
              columns={COLUMNS}
              userData={this._getData()}
            />
          </div>
        )}
      </NoObjects>
    )
  }
}
