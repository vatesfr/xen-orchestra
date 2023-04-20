import _ from 'intl'
import Component from 'base-component'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import SortedTable from 'sorted-table'
import { createPager } from 'selectors'
import { Row, Col } from 'grid'
import { deleteMessage, deleteMessages } from 'xo'
import { formatLogs } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import map from 'lodash/map.js'

const LOG_BODY_STYLE = {
  whiteSpace: 'pre-wrap',
}

const LOG_COLUMNS = [
  {
    name: _('logDate'),
    itemRenderer: log => (
      <span>
        <FormattedTime
          value={log.time * 1000}
          minute='numeric'
          hour='numeric'
          day='numeric'
          month='long'
          year='numeric'
        />{' '}
        (<FormattedRelative value={log.time * 1000} />)
      </span>
    ),
    sortCriteria: log => log.time,
    sortOrder: 'desc',
  },
  {
    name: _('logName'),
    itemRenderer: log => log.name,
    sortCriteria: log => log.name,
  },
  {
    name: _('logContent'),
    itemRenderer: ({ formatted, body }) =>
      formatted !== undefined ? (
        <div>
          <Row>
            <Col mediumSize={6}>
              <strong>{formatted.name}</strong>
            </Col>
            <Col mediumSize={6}>{formatted.value}</Col>
          </Row>
          <br />
          {map(formatted.alarmAttributes, (value, label) => (
            <Row key={label}>
              <Col mediumSize={6}>{label}</Col>
              <Col mediumSize={6}>{value}</Col>
            </Row>
          ))}
        </div>
      ) : (
        <pre style={LOG_BODY_STYLE}>{body}</pre>
      ),
    sortCriteria: log => log.body,
  },
]

const LOG_ACTIONS = [
  {
    handler: deleteMessages,
    individualHandler: deleteMessage,
    individualLabel: _('logDelete'),
    icon: 'delete',
    label: _('logsDelete'),
    level: 'danger',
  },
]

export default class TabLogs extends Component {
  constructor() {
    super()

    this.getLogs = createPager(
      () => this.state.logs,
      () => this.state.page,
      10
    )

    this.state = {
      page: 1,
    }
  }

  componentDidMount() {
    this._formatLogs(this.props.logs)
  }

  componentDidUpdate(props) {
    if (props.logs !== this.props.logs) {
      this._formatLogs(this.props.logs)
    }
  }

  _formatLogs = logs =>
    formatLogs(logs).then(formattedLogs => {
      this.setState({
        logs: map(formattedLogs, ({ id, ...formattedLogs }) => ({
          formatted: formattedLogs,
          ...logs[id],
        })),
      })
    })

  _nextPage = () => this.setState({ page: this.state.page + 1 })
  _previousPage = () => this.setState({ page: this.state.page - 1 })

  render() {
    const logs = this.getLogs()

    if (isEmpty(logs)) {
      return (
        <Row>
          <Col mediumSize={6} className='text-xs-center'>
            <br />
            <h4>{_('noLogs')}</h4>
          </Col>
        </Row>
      )
    }

    return <SortedTable actions={LOG_ACTIONS} collection={logs} columns={LOG_COLUMNS} stateUrlParam='s_logs' />
  }
}
