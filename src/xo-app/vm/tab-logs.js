import _ from 'intl'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { connectStore } from 'utils'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import {
  createGetObjectMessages
} from 'selectors'

const LOG_COLUMNS = [
  {
    name: _('logDate'),
    itemRenderer: log => <span><FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)</span>,
    sortCriteria: 'time',
    sortOrder: 'desc'
  },
  {
    name: _('logName'),
    itemRenderer: log => log.name,
    sortCriteria: 'name'
  },
  {
    name: _('logContent'),
    itemRenderer: log => log.body,
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
    handler: logs => Promise.all(map(logs, deleteMessage))
  }
]

@connectStore(() => {
  const logs = createGetObjectMessages(
    (_, props) => props.vm
  )

  return (state, props) => ({
    logs: logs(state, props)
  })
})
export default class TabLogs extends Component {
  render () {
    return <SortedTable
      collection={this.props.logs}
      columns={LOG_COLUMNS}
      groupedActions={GROUPED_ACTIONS}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s'
    />
  }
}
