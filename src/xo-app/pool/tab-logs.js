import _ from 'messages'
import ActionRow from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import TabButton from 'tab-button'
import React, { Component } from 'react'
import { deleteMessage } from 'xo'
import { createPager } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'

export default class TabLogs extends Component {
  constructor () {
    super()

    this.getLogs = createPager(
      () => this.props.logs,
      () => this.state.page,
      10
    )

    this.state = {
      page: 1
    }
  }

  render () {
    const logs = this.getLogs()

    return <div>
      {isEmpty(logs)
        ? <Row>
          <Col smallSize={6} className='text-xs-center'>
            <br />
            <h4>{_('noLogs')}</h4>
          </Col>
        </Row>
        : [
          <Row>
            <Col smallSize={12} className='text-xs-right'>
              <button className='btn btn-lg btn-tab' onClick={() => {
                this.setState({ page: this.state.page - 1 })
              }}>
                &lt;
              </button>
              <button className='btn btn-lg btn-tab' onClick={() => {
                this.setState({ page: this.state.page + 1 })
              }}>
                &gt;
              </button>
              <TabButton
                btnStyle='danger'
                handler={() => forEach(logs, log => deleteMessage(log))}
                icon='delete'
                labelId='logRemoveAll'
              />
            </Col>
          </Row>,
          <Row>
            <Col smallSize={12}>
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
                          handler={() => deleteMessage(log)}
                          icon='delete'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Col>
          </Row>
        ]
      }
    </div>
  }
}
