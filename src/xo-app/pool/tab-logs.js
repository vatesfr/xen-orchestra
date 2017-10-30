import _ from 'intl'
import ActionRow from 'action-row-button'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { deleteMessage } from 'xo'
import { createPager, createSelector } from 'selectors'
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
    default: true,
    sortCriteria: 'name_label'
  },
  {
    itemRenderer: log => { return log.name },
    name: _('logName'),
    sortCriteria: 'name'
  },
  {
    itemRenderer: log => { return log.body },
    name: _('logDate'),
    default: true,
    sortCriteria: 'body'
  },
  {
    itemRenderer: log =>
      <td>
        <ActionRow
          btnStyle='danger'
          handler={deleteMessage}
          handlerParam={log}
          icon='delete'
        />
      </td>,
    name: _('logAction'),
    sortCriteria: 'name_description'
  }
]
const INDIVIDUAL_ACTIONS = [
  {
    icon: 'delete',
    handler: deleteMessage
  }
]

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
  _nextPage = () => this.setState({ page: Math.min(this.state.page + 1, this.getNPages()) })
  _previousPage = () => this.setState({ page: Math.max(this.state.page - 1, 1) })

  render () {
    const logs = this.getLogs()
    const { page } = this.state

    return <Container>
      {isEmpty(logs)
        ? <Row>
          <Col mediumSize={6} className='text-xs-center'>
            <br />
            <h4>{_('noLogs')}</h4>
          </Col>
        </Row>
        : <Row>
          <SortedTable
            collection={logs}
            columns={COLUMNS}
            individualActions={INDIVIDUAL_ACTIONS}
            groupedActions={GROUPED_ACTIONS}
              />
        </Row>
      }
    </Container>
  }
}
