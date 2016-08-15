import _ from 'intl'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Copiable from 'copiable'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import React from 'react'
import size from 'lodash/size'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { addSubscriptions } from 'utils'
import { subscribeApiLogs, subscribeUsers, deleteApiLog } from 'xo'
import { FormattedDate } from 'react-intl'
import { Button } from 'react-bootstrap-4/lib'
import { alert, confirm } from 'modal'

import styles from './index.css'

@addSubscriptions({
  logs: subscribeApiLogs,
  users: subscribeUsers
})
export default class Logs extends BaseComponent {
  _showStack = log => alert(_('logStack'), <Copiable tagName='pre'>{log.data.error.stack}</Copiable>)
  _deleteAllLogs = () =>
    confirm({
      title: _('logDeleteAllTitle'),
      body: _('logDeleteAllMessage')
    }).then(() =>
      forEach(this.props.logs, (log, id) => deleteApiLog(id))
    )
  render () {
    const columns = [
      {
        name: _('logUser'),
        itemRenderer: log => {
          if (log.data.userId == null) {
            return _('unknownUser')
          }
          return this.props.users ? find(this.props.users, user => user.id === log.data.userId).email : '...'
        },
        sortCriteria: log => log.data.userId
      },
      {
        name: _('logMethod'),
        itemRenderer: log => log.data.method,
        sortCriteria: log => log.data.method
      },
      {
        name: _('logMessage'),
        itemRenderer: log => <div className={styles.message}>{log.data.error && log.data.error.message}</div>,
        sortCriteria: log => log.data.error && log.data.error.message
      },
      {
        name: _('logStack'),
        itemRenderer: log => log.data.error && log.data.error.stack ? <Button onClick={() => this._showStack(log)} bsStyle='secondary'>Show stack</Button> : _('logNoStackTrace')
      },
      {
        name: _('logTime'),
        itemRenderer: log => <span>
          {log.time && <FormattedDate value={new Date(log.time)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />}
          {' '}
          <span className='pull-right'>
            <ActionRowButton btnStyle='default' handler={deleteApiLog} handlerParam={log.id} icon='delete' />
          </span>
        </span>,
        sortCriteria: log => log.time,
        sortOrder: 'desc'
      }
    ]
    const { logs } = this.props
    if (!logs) {
      return <h3>{_('loadingLogs')}</h3>
    }
    return <div>
      {size(logs)
        ? <div>
          <span className='pull-xs-right'>
            <TabButton
              btnStyle='danger'
              handler={this._deleteAllLogs}
              icon='delete'
              labelId='logDeleteAll'
            />
          </span>
          {' '}
          <SortedTable collection={map(logs, (log, id) => ({ ...log, id }))} columns={columns} defaultColumn={4} />
        </div>
        : <p>{_('noLogs')}</p>}
    </div>
  }
}
