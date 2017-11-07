import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import {
  map
} from 'lodash'

const COLUMNS = [
  {
    itemRenderer: log => <div>
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

export default class TabLogs extends Component {
  _deleteAllLogs = logs => Promise.all(map(logs, deleteMessage))

  render () {
    const GROUPED_ACTIONS = [
      {
        label: 'deleteLogs',
        icon: 'delete',
        handler: this._deleteAllLogs
      }
    ]

    return <SortedTable
      collection={this.props.logs}
      columns={COLUMNS}
      groupedActions={GROUPED_ACTIONS}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s'
    />
  }
}
