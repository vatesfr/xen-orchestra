import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
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
  },
  {
    name: _('logAction'),
    itemRenderer: log => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteMessage}
        handlerParam={log}
        icon='delete'
      />
    )
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
  _deleteAllLogs = () => map(this.props.logs, deleteMessage)

  render () {
    const { logs } = this.props

    if (isEmpty(logs)) {
      return <Row>
        <Col className='text-xs-center'>
          <br />
          <h4>{_('noLogs')}</h4>
        </Col>
      </Row>
    }

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='danger'
            handler={this._deleteAllLogs}
            icon='delete'
            labelId='logRemoveAll'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <SortedTable collection={logs} columns={LOG_COLUMNS} />
        </Col>
      </Row>
    </Container>
  }
}
