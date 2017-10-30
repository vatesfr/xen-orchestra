import _ from 'intl'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { connectStore } from 'utils'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  createGetObjectMessages
} from 'selectors'

const LOG_COLUMNS = [
  {
    name: _('logDate'),
    itemRenderer: log => <span><FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)</span>,
    sortCriteria: log => log.time,
    sortOrder: 'desc'
  },
  {
    name: _('logName'),
    itemRenderer: log => log.name,
    sortCriteria: log => log.name
  },
  {
    name: _('logContent'),
    itemRenderer: log => log.body,
    sortCriteria: log => log.body
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

    return <SortedTable
	    collection={this.props.logs}
            columns={LOG_COLUMNS}
            individualActions={INDIVIDUAL_ACTIONS}
            groupedActions={GROUPED_ACTIONS}
          />
  }
}
