import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage } from 'xo'
import { createPager, createSelector } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import {
  ceil,
  map
} from 'lodash'

const LOGS_PER_PAGE = 10

const COLUMNS = [
  {
    itemRenderer: log =>
      <div>
        <FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)
      </div>,
    name: _('logDate'),
    default: true,
    sortCriteria: 'time'
  },
  {
    itemRenderer: log => log.name,
    name: _('logName'),
    sortCriteria: 'name'
  },
  {
    itemRenderer: log => log.body,
    name: _('logContent'),
    sortCriteria: 'body'
  }
]
const INDIVIDUAL_ACTIONS = [
  {
    label: 'deleteLog',
    icon: 'delete',
    handler: deleteMessage
  }
]

const GROUPED_ACTIONS = [
  {
    label: 'deleteLogs',
    icon: 'delete',
    handler: logs => map(logs, deleteMessage)
  }
]

const logs = this.getLogs()

export default class TabLogs extends Component {
  constructor () {
    super()

    this.getLogs = createPager(
      () => this.props.logs,
      () => this.state.page,
      LOGS_PER_PAGE
    )

    this.getNPages = createSelector(
      () => this.props.logs ? this.props.logs.length : 0,
      nLogs => ceil(nLogs / LOGS_PER_PAGE)
    )

    this.state = {
      page: 1
    }
  }

  _deleteAllLogs = () => map(this.props.logs, deleteMessage)

  render () {
    return <SortedTable
      collection={logs}
      columns={COLUMNS}
      individualActions={INDIVIDUAL_ACTIONS}
      groupedActions={GROUPED_ACTIONS}
      stateUrlParam='pl'
    />
  }
}
