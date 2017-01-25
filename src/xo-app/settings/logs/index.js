import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Copiable from 'copiable'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import SortedTable from 'sorted-table'
import styles from './index.css'
import TabButton from 'tab-button'
import { addSubscriptions } from 'utils'
import { alert, confirm } from 'modal'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { createSelector } from 'selectors'
import { FormattedDate } from 'react-intl'
import { subscribeApiLogs, subscribeUsers, deleteApiLog } from 'xo'

const CAN_REPORT_BUG = process.env.XOA_PLAN > 1

const reportBug = log => {
  const title = encodeURIComponent(`Error on ${log.data.method}`)
  const message = encodeURIComponent(`\`\`\`\n${log.data.method}\n${JSON.stringify(log.data.params, null, 2)}\n${JSON.stringify(log.data.error, null, 2).replace(/\\n/g, '\n')}\n\`\`\``)

  window.open(process.env.XOA_PLAN < 5
    ? `https://xen-orchestra.com/#!/member/support?title=${title}&message=${message}`
    : `https://github.com/vatesfr/xo-web/issues/new?title=${title}&body=${message}`
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
    sortCriteria: log => log.data.userId
  },
  {
    name: _('logMessage'),
    itemRenderer: log => <pre className={styles.widthLimit}>{log.data.error && log.data.error.message}</pre>,
    sortCriteria: log => log.data.error && log.data.error.message
  },
  {
    default: true,
    name: _('logTime'),
    itemRenderer: log => <span>
      {log.time && <FormattedDate value={new Date(log.time)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />}
    </span>,
    sortCriteria: log => log.time,
    sortOrder: 'desc'
  },
  {
    name: '',
    itemRenderer: (log, { showError }) => <div className='text-xs-right'>
      <ButtonGroup>
        <ActionRowButton
          btnStyle='secondary'
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
        {CAN_REPORT_BUG && <ActionRowButton
          btnStyle='secondary'
          handler={() => reportBug(log)}
          icon='bug'
          tooltip={_('reportBug')}
        />}
      </ButtonGroup>
    </div>
  }
]

@addSubscriptions({
  logs: subscribeApiLogs,
  users: subscribeUsers
})
export default class Logs extends BaseComponent {
  _deleteAllLogs = () =>
    confirm({
      title: _('logDeleteAllTitle'),
      body: _('logDeleteAllMessage')
    }).then(() =>
      Promise.all(map(this.props.logs, (log, id) => deleteApiLog(id)))
    )

  _getLogs = createSelector(
    () => this.props.logs,
    logs => map(logs, (log, id) => ({ ...log, id }))
  )

  _showError = log => alert(
    _('logError'),
    <Copiable tagName='pre'>
      {`${log.data.method}\n${JSON.stringify(log.data.params, null, 2)}\n${JSON.stringify(log.data.error, null, 2).replace(/\\n/g, '\n')}`}
    </Copiable>
  )

  _getData = createSelector(
    () => this.props.users,
    () => this._showError,
    (users, showError) => ({ users, showError })
  )

  render () {
    const logs = this._getLogs()

    return <div>
      {isEmpty(logs)
        ? <p>{_('noLogs')}</p>
        : <div>
          <span className='pull-right'>
            <TabButton
              btnStyle='danger'
              handler={this._deleteAllLogs}
              icon='delete'
              labelId='logDeleteAll'
            />
          </span>
          {' '}
          <SortedTable
            collection={logs}
            columns={COLUMNS}
            userData={this._getData()}
          />
        </div>
      }
    </div>
  }
}
