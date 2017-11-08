import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import {
  map
} from 'lodash'

const LOG_COLUMNS = [
  {
    default: true,
    itemRenderer: log => <div>
      <FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)
    </div>,
    name: _('logDate'),
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
    handler: deleteMessage,
    icon: 'delete',
    label: _('logDelete')
  }
]

const GROUPED_ACTIONS = [
  {
    handler: logs => Promise.all(map(logs, deleteMessage)),
    icon: 'delete',
    label: _('deleteSelectedLogs')
  }
]

export default class TabLogs extends Component {
  render () {
    return <SortedTable
      collection={this.props.log}
      columns={LOG_COLUMNS}
      groupedActions={GROUPED_ACTIONS}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s'
    />
  }
}
