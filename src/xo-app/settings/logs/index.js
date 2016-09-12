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
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { subscribeApiLogs, subscribeUsers, deleteApiLog } from 'xo'
import { FormattedDate } from 'react-intl'
import { alert, confirm } from 'modal'
import styles from './index.css'

@addSubscriptions({
  logs: subscribeApiLogs,
  users: subscribeUsers
})
export default class Logs extends BaseComponent {
  _showStack = log => alert(_('logStack'), <Copiable tagName='pre'>{`${log.data.method}
${JSON.stringify(log.data.params, null, 2)}
${log.data.error.stack}`}</Copiable>)
  _showParams = log => alert(_('logParams'), <Copiable tagName='pre'>{JSON.stringify(log.data.params, null, 2)}</Copiable>)
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
        name: '',
        itemRenderer: log => <Tooltip content={_('logDisplayDetails')}><ActionRowButton icon='preview' handler={this._showStack} handlerParam={log} /></Tooltip>
      },
      {
        name: _('logUser'),
        itemRenderer: log => {
          if (log.data.userId == null) {
            return _('noUser')
          }
          if (!this.props.users) {
            return '...'
          }
          const user = find(this.props.users, user => user.id === log.data.userId)
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
        name: _('logTime'),
        itemRenderer: log => <span>
          {log.time && <FormattedDate value={new Date(log.time)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />}
        </span>,
        sortCriteria: log => log.time,
        sortOrder: 'desc'
      },
      {
        itemRenderer: log => <ActionRowButton btnStyle='default' handler={deleteApiLog} handlerParam={log.id} icon='delete' />
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
