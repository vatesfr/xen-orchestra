import _ from 'messages'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  pools,
  hosts,
  vms,
  create as createSelector
} from 'selectors'
import {
  connectStore,
  routes
} from 'utils'

@routes()
@connectStore(() => {
  const gethostTotalRamAvailable = createSelector(
    (hosts) => {
      let hostTotalRamAvailable = 0
      forEach(hosts, (host) => {
        hostTotalRamAvailable += host.memory.size
      })
      return hostTotalRamAvailable
    }
  )
  const gethostTotalRamUsed = createSelector(
    (hosts) => {
      let hostTotalRamUsed = 0
      forEach(hosts, (host) => {
        hostTotalRamUsed += host.memory.usage
      })
      return hostTotalRamUsed
    }
  )
  const gethostTotalCpus = createSelector(
    (hosts) => {
      let hostTotalCpus = 0
      forEach(hosts, (host) => {
        hostTotalCpus += host.CPUs.cpu_count
      })
      return hostTotalCpus
    }
  )
  return (state, props) => {
    return {
      nPools: pools(state, props).length,
      nHosts: hosts(state, props).length,
      hosts: hosts(state, props),
      nVms: vms(state, props).length,
      hostTotalRamAvailable: gethostTotalRamAvailable(state, props),
      hostTotalRamUsed: gethostTotalRamUsed(state, props),
      hostTotalCpus: gethostTotalCpus(state, props)
    }
  }
})
export default class Overview extends Component {
  render () {
    return <div className='container-fluid'>
      {/* <h2>{_('overviewDashboardPage')}</h2> */}
      <Row>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='pool' /> {_('poolPanel', { pools: this.props.nPools })}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.nPools}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='host' /> {_('hostPanel', { hosts: this.props.nHosts })}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.nHosts}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='vm' /> {_('vmPanel', { vms: this.props.nVms })}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.nVms}</p>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='memory' /> {_('memoryStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.hostTotalRamUsed} / {this.props.hostTotalRamAvailable}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='cpu' /> {_('cpuStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.hostTotalCpus}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='info' /> {_('vmStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>TODO</p>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={12}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='disk' /> {_('srStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>TODO</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  }
}
