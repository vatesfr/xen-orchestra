import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { deleteMessage, deleteMessages } from 'xo'

const LOG_COLUMNS = [
  {
    default: true,
    itemRenderer: log => (
      <div>
        <FormattedTime
          value={log.time * 1000}
          minute='numeric'
          hour='numeric'
          day='numeric'
          month='long'
          year='numeric'
        />{' '}
        (<FormattedRelative value={log.time * 1000} />)
      </div>
    ),
    name: _('logDate'),
    sortCriteria: 'time',
  },
  {
    itemRenderer: log => log.name,
    name: _('logName'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: log => log.body,
    name: _('logContent'),
    sortCriteria: 'body',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deleteMessage,
    icon: 'delete',
    label: _('logDelete'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS = [
  {
    handler: deleteMessages,
    icon: 'delete',
    label: _('logsDelete'),
    level: 'danger',
  },
]

export default class TabLogs extends Component {
  render() {
    return (
      <SortedTable
        collection={this.props.logs}
        columns={LOG_COLUMNS}
        groupedActions={GROUPED_ACTIONS}
        individualActions={INDIVIDUAL_ACTIONS}
        stateUrlParam='s'
      />
    )
  }
}
