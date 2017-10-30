import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  ceil,
  isEmpty,
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
    sortCriteria: log => log.time,
    sortOrder: 'desc'
  },
  {
    itemRenderer: log => log.name,
    name: _('logName'),
    sortCriteria: 'name'
  },
  {
    itemRenderer: log => log.body,
    name: _('logContent'),
    default: true,
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

export default class TabLogs extends Component {

  _deleteAllLogs = () => map(this.props.logs, deleteMessage)

  render () {
    const logs = this.getLogs()

    const GROUPED_ACTIONS = [
      {
        label: 'deleteLogs',
        icon: 'delete',
        handler: logs => map(logs, deleteMessage)
      }
    ]

    return <SortedTable
            collection={logs}
            columns={COLUMNS}
            individualActions={INDIVIDUAL_ACTIONS}
            groupedActions={GROUPED_ACTIONS}
    />
  }
}
