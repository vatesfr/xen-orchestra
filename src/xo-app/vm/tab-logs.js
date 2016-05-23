import _ from 'messages'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { connectStore } from 'utils'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'
import {
  createGetObjectsOfType
} from 'selectors'

@connectStore(() => {
  const logs = createGetObjectsOfType(
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
        <Col smallSize={12} className='text-xs-center'>
          <br />
          <h4>{_('noLogs')}</h4>
        </Col>
      </Row>
    }

    return <div>
      <Row>
        <Col smallSize={12} className='text-xs-right'>
          <TabButton
            btnStyle='danger'
            handler={this._deleteAllLogs}
            icon='delete'
            labelId='logRemoveAll'
          />
        </Col>
      </Row>
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
                    <ActionRowButton
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
}
