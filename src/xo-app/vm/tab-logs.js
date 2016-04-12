import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'

export default ({
  logs,
  snapshots,
  vm
}) => <div>
  {isEmpty(logs)
    ? <Row>
      <Col smallSize={6} className='text-xs-center'>
        <br/>
        <h4>{_('noLogs')}</h4>
      </Col>
    </Row>
    : [<Row>
      <Col smallSize={12}>
        <button className='btn btn-lg btn-danger btn-tab'>
          <Icon icon='delete' size={1} /> {_('logRemoveAll')}
        </button>
        <br/>
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              <th>{_('logDate')}</th>
              <th>{_('logName')}</th>
              <th>{_('logAction')}</th>
            </tr>
          </thead>
          <tbody>
            {map(logs, (log) =>
              <tr key={log.id}>
                <td><FormattedTime value={log.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric'/> (<FormattedRelative value={log.time * 1000}/>)</td>
                <td>{log.name}</td>
                <td><i className='xo-icon-delete xo-icon-action-row'></i></td>
              </tr>
            )}
          </tbody>
        </table>
      </Col>
    </Row>]
  }
</div>
