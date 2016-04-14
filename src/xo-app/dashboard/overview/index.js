import _ from 'messages'
import ChartistGraph from 'react-chartist'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  create as createSelector,
  createCollectionWrapper,
  createFilter,
  createGetObjects,
  createTop,
  hosts,
  messages,
  pools,
  tasks,
  userSrs as _userSrs,
  vms
} from 'selectors'
import {
  connectStore,
  formatSize,
  routes
} from 'utils'
import {
  subscribe
} from 'xo'

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

  const userSrs = createTop(_userSrs, 'size', 10)

  const getSrMetrics = createCollectionWrapper(
    createSelector(
      userSrs,
      (userSrs) => {
        const metrics = {
          srTotal: 0,
          srUsage: 0
        }
        forEach(userSrs, (sr) => {
          metrics.srUsage += sr.physical_usage
          metrics.srTotal += sr.size
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
  const getContainers = createGetObjects(
    createSelector(
      userSrs,
      (userSrs) => map(userSrs, '$container')
    )
  )
  const getAlarmMessages = createFilter(messages, (message) => message.name === 'ALARM')

  return (state, props) => {
    return {
      hostMetrics: getHostMetrics(state, props),
      hosts: hosts(state, props),
      nAlarmMessages: getAlarmMessages(state, props).length,
      nHosts: hosts(state, props).length,
      nPools: pools(state, props).length,
      nTasks: tasks(state, props).length,
      nVms: vms(state, props).length,
      srContainers: getContainers(state, props),
      srMetrics: getSrMetrics(state, props),
      userSrs: userSrs(state, props),
      vmMetrics: getVmMetrics(state, props),
      vms: vms(state, props)
    }
  }
})
export default class Overview extends Component {
  componentWillMount () {
    this.componentWillUnmount = subscribe('users', (users) => {
      this.setState({ users })
    })
  }
  render () {
    const { state } = this
    const users = state && state.users
    const nUsers = users && Object.keys(users).length

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
            <div className='card-block'>
              <ChartistGraph
                data={
                  {
                    labels: ['Used Memory', 'Total Memory'],
                    series: [this.props.hostMetrics.memoryUsage, this.props.hostMetrics.memoryTotal - this.props.hostMetrics.memoryUsage]
                  }
                }
                options={{ donut: true, donutWidth: 40, showLabel: false }}
                type='Pie' />
              <p className='text-xs-center'>{formatSize(this.props.hostMetrics.memoryUsage)} ({_('ofUsage')} {formatSize(this.props.hostMetrics.memoryTotal)})</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='cpu' /> {_('cpuStatePanel')}
            </div>
            <div className='card-block'>
              <div className='ct-chart'>
                <ChartistGraph
                  data={
                    {
                      labels: ['vCPUs', 'CPUs'],
                      series: [this.props.vmMetrics.vcpus, this.props.hostMetrics.cpus]
                    }
                  }
                  options={{ showLabel: false, showGrid: false, distributeSeries: true }}
                  type='Bar' />
                <p className='text-xs-center'>{this.props.vmMetrics.vcpus} vCPUS ({_('ofUsage')} {this.props.hostMetrics.cpus} CPUs)</p>
              </div>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='info' /> {_('srUsageStatePanel')}
            </div>
            <div className='card-block'>
              <div className='ct-chart'>
                <ChartistGraph
                  data={
                    {
                      labels: ['Used Space', 'Total Space'],
                      series: [this.props.srMetrics.srUsage, this.props.srMetrics.srTotal - this.props.srMetrics.srUsage]
                    }
                  }
                  options={{ donut: true, donutWidth: 40, showLabel: false }}
                  type='Pie' />
                <p className='text-xs-center'>{formatSize(this.props.srMetrics.srUsage)} ({_('ofUsage')} {formatSize(this.props.srMetrics.srTotal)})</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='alarm' /> {_('alarmMessage')}
            </div>
            <div className='card-block-dashboard'>
              <p className={this.props.nAlarmMessages > 0 ? 'text-warning' : ''}>{this.props.nAlarmMessages}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='task' /> {_('taskStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{this.props.nTasks}</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='user' /> {_('usersStatePanel')}
            </div>
            <div className='card-block-dashboard'>
              <p>{nUsers}</p>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={4}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='info' /> {_('vmStatePanel')}
            </div>
            <div className='card-block'>
              <ChartistGraph
                data={
                  {
                    labels: ['Running', 'Halted', 'Other'],
                    series: [this.props.vmMetrics.running, this.props.vmMetrics.halted, this.props.vmMetrics.other]
                  }
                }
                options={{ showLabel: false }}
                type='Pie' />
              <p className='text-xs-center'>{this.props.vmMetrics.running} running ({this.props.vmMetrics.halted} halted)</p>
            </div>
          </div>
        </Col>
        <Col mediumSize={8}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='info' /> {_('srUsageStatePanel')} (%)
            </div>
            <div className='card-block'>
              <ChartistGraph
                data={
                  {
                    labels: map(this.props.userSrs, 'name_label'),
                    series: map(this.props.userSrs, (sr) => (sr.physical_usage / sr.size) * 100)
                  }
                }
                options={{ showLabel: false, showGrid: false, distributeSeries: true, horizontalBars: true, high: 100 }}
                type='Bar' />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  }
}
