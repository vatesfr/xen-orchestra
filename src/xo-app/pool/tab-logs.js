import _ from 'intl'
import ActionRow from 'action-row-button'
import React, { Component } from 'react'
import TabButton from 'tab-button'
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
        : <div>
          <Row>
            <Col className='text-xs-right'>
              <TabButton
                btnStyle='secondary'
                disabled={page === 1}
                handler={this._previousPage}
                icon='previous'
              />
              <TabButton
                btnStyle='secondary'
                disabled={page === this.getNPages()}
                handler={this._nextPage}
                icon='next'
              />
              <TabButton
                btnStyle='danger'
                handler={this._removeAllLogs} // FIXME: define this method
                icon='delete'
                labelId='logRemoveAll'
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <table className='table'>
                <thead className='thead-default'>
                  <tr>
                    <th>{_('logDate')}</th>
                    <th>{_('logName')}</th>
                    <th>{_('logContent')}</th>
                    <th>{_('logAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {map(logs, log =>
                    <tr key={log.id}>
                      <td><FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={log.time * 1000} />)</td>
                      <td>{log.name}</td>
                      <td>{log.body}</td>
                      <td>
                        <ActionRow
                          btnStyle='danger'
                          handler={deleteMessage}
                          handlerParam={log}
                          icon='delete'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Col>
          </Row>
        </div>
      }
    </Container>
  }
}
