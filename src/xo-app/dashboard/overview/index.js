import _ from 'messages'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  create as createSelector,
  createCollectionWrapper,
  hosts,
  pools,
  vms
} from 'selectors'
import {
  connectStore,
  Debug,
  formatSize,
  routes
} from 'utils'

@routes()
@connectStore(() => {
  const getHostMetrics = createCollectionWrapper(
    createSelector(
      hosts,
      (hosts) => {
        const metrics = {
          cpus: 0,
          memoryTotal: 0,
          memoryUsage: 0
        }
        forEach(hosts, (host) => {
          metrics.cpus += host.cpus.cores
          metrics.memoryTotal += host.memory.size
          metrics.memoryUsage += host.memory.usage
        })
        return metrics
      }
    )
  )
  const getVmMetrics = createCollectionWrapper(
    createSelector(
      vms,
      (vms) => {
        const metrics = {
          vcpus: 0,
          running: 0,
          halted: 0,
          other: 0
        }
        forEach(vms, (vm) => {
          if (vm.power_state === 'Running') {
            metrics.running++
            metrics.vcpus += vm.CPUs.number
          } else if (vm.power_state === 'Halted') {
            metrics.halted++
          } else metrics.other++
        })
        return metrics
      }
    )
  )
  return (state, props) => {
    return {
      hostMetrics: getHostMetrics(state, props),
      hosts: hosts(state, props),
      nHosts: hosts(state, props).length,
      nPools: pools(state, props).length,
      nVms: vms(state, props).length,
      vmMetrics: getVmMetrics(state, props),
      vms: vms(state, props)
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
              <p>{formatSize(this.props.hostMetrics.memoryUsage)} / {formatSize(this.props.hostMetrics.memoryTotal)}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='cpu' /> {_('cpuStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.vmMetrics.vcpus} / {this.props.hostMetrics.cpus}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='info' /> {_('vmStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.vmMetrics.running} / {this.props.vmMetrics.halted} / {this.props.vmMetrics.other}</p>
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
      <Debug value={this.props.vmMetrics} />
    </div>
  }
}
