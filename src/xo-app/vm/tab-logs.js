import _ from 'messages'
import ActionRowButton from 'action-row-button'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TabButton from 'tab-button'
import { deleteMessage } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'

export default ({
  logs,
  snapshots,
  vm
}) => <div>
  {isEmpty(logs)
    ? <Row>
      <Col smallSize={12} className='text-xs-center'>
        <br />
        <h4>{_('noLogs')}</h4>
      </Col>
    </Row>
    : <Row>
      <Col smallSize={12} className='text-xs-right'>
        <TabButton
          btnStyle='danger'
          handler={() => forEach(logs, log => deleteMessage(log))}
          icon='delete'
          labelId='logRemoveAll'
        />
      </Col>
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
  }
</div>
