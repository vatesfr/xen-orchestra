import _ from 'messages'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  pools,
  hosts,
  vms
} from 'selectors'
import {
  connectStore,
  routes
} from 'utils'

@routes()
@connectStore(() => {
  return (state, props) => {
    return {
      nPools: pools(state, props).length,
      nHosts: hosts(state, props).length,
      nVms: vms(state, props).length
    }
  }
})
export default class Overview extends Component {
  render () {
    return <div className='container-fluid'>
      {/* <h2>{_('overviewDashboardPage')}</h2> */}
      <Row>
        <Col mediumSize={4}>
          <div className='card'>
            <div className='card-header'>
              {_('poolPanel', { pools: this.props.nPools })}
            </div>
            <div className='card-block'>
              <p>{this.props.nPools}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card'>
            <div className='card-header'>
              {_('hostPanel', { hosts: this.props.nHosts })}
            </div>
            <div className='card-block'>
              <p>{this.props.nHosts}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card'>
            <div className='card-header'>
              {_('vmPanel', { vms: this.props.nVms })}
            </div>
            <div className='card-block'>
              <p>{this.props.nVms}</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  }
}
