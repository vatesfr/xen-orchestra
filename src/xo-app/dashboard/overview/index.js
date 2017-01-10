import _ from 'intl'
import ChartistGraph from 'react-chartist'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import propTypes from 'prop-types'
import Link, { BlockLink } from 'link'
import map from 'lodash/map'
import HostsPatchesTable from 'hosts-patches-table'
import React from 'react'
import size from 'lodash/size'
import Upgrade from 'xoa-upgrade'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import {
  createCollectionWrapper,
  createCounter,
  createGetObjectsOfType,
  createGetHostMetrics,
  createSelector,
  createTop
} from 'selectors'
import {
  connectStore,
  formatSize
} from 'utils'
import {
  isSrWritable,
  subscribeUsers
} from 'xo'

import styles from './index.css'

// ===================================================================

@propTypes({
  hosts: propTypes.object.isRequired
})
class PatchesCard extends Component {
  _getContainer = () => this.refs.container

  render () {
    return (
      <Card>
        <CardHeader>
          <Icon icon='host-patch-update' /> {_('update')}
          <div ref='container' className='pull-right' />
        </CardHeader>
        <CardBlock>
          <HostsPatchesTable
            buttonsGroupContainer={this._getContainer}
            container={ButtonGroup}
            displayPools
            hosts={this.props.hosts}
          />
        </CardBlock>
      </Card>
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
  const getVms = createGetObjectsOfType('VM')

  const getHostMetrics = createGetHostMetrics(getHosts)

  const userSrs = createTop(
    createGetObjectsOfType('SR').filter(
      [ isSrWritable ]
    ),
    [ sr => sr.physical_usage / sr.size ],
    5
  )

  const getSrMetrics = createCollectionWrapper(
    createSelector(
      userSrs,
      userSrs => {
        const metrics = {
          srTotal: 0,
          srUsage: 0
        }
        forEach(userSrs, sr => {
          metrics.srUsage += sr.physical_usage
          metrics.srTotal += sr.size
        })
        return metrics
      }
    )
  )
  const getVmMetrics = createCollectionWrapper(
    createSelector(
      getVms,
      vms => {
        const metrics = {
          vcpus: 0,
          running: 0,
          halted: 0,
          other: 0
        }
        forEach(vms, vm => {
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
  const getNumberOfAlarmMessages = createCounter(
    createGetObjectsOfType('message'),
    [ message => message.name === 'ALARM' ]
  )
  const getNumberOfHosts = createCounter(
    getHosts
  )
  const getNumberOfPools = createCounter(
    createGetObjectsOfType('pool')
  )
  const getNumberOfTasks = createCounter(
    createGetObjectsOfType('task').filter(
      [ task => task.status === 'pending' ]
    )
  )
  const getNumberOfVms = createCounter(
    getVms
  )

  return {
    hostMetrics: getHostMetrics,
    hosts: getHosts,
    nAlarmMessages: getNumberOfAlarmMessages,
    nHosts: getNumberOfHosts,
    nPools: getNumberOfPools,
    nTasks: getNumberOfTasks,
    nVms: getNumberOfVms,
    srMetrics: getSrMetrics,
    userSrs: userSrs,
    vmMetrics: getVmMetrics
  }
})
export default class Overview extends Component {
  componentWillMount () {
    this.componentWillUnmount = subscribeUsers(users => {
      this.setState({ users })
    })
  }
  render () {
    const { props, state } = this
    const users = state && state.users
    const nUsers = size(users)

    return process.env.XOA_PLAN > 2
        ? <Container>
          <Row>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='pool' /> {_('poolPanel', { pools: props.nPools })}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/home?t=pool'>{props.nPools}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='host' /> {_('hostPanel', { hosts: props.nHosts })}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/home?t=host'>{props.nHosts}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='vm' /> {_('vmPanel', { vms: props.nVms })}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/home?s=&t=VM'>{props.nVms}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='memory' /> {_('memoryStatePanel')}
                </CardHeader>
                <CardBlock className='dashboardItem'>
                  <ChartistGraph
                    data={{
                      labels: ['Used Memory', 'Total Memory'],
                      series: [props.hostMetrics.memoryUsage, props.hostMetrics.memoryTotal - props.hostMetrics.memoryUsage]
                    }}
                    options={{ donut: true, donutWidth: 40, showLabel: false }}
                    type='Pie'
                  />
                  <p className='text-xs-center'>
                    {_('ofUsage', {
                      total: formatSize(props.hostMetrics.memoryTotal),
                      usage: formatSize(props.hostMetrics.memoryUsage)
                    })}
                  </p>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='cpu' /> {_('cpuStatePanel')}
                </CardHeader>
                <CardBlock>
                  <div className='ct-chart dashboardItem'>
                    <ChartistGraph
                      data={{
                        labels: ['vCPUs', 'CPUs'],
                        series: [props.vmMetrics.vcpus, props.hostMetrics.cpus]
                      }}
                      options={{ showLabel: false, showGrid: false, distributeSeries: true }}
                      type='Bar'
                    />
                    <p className='text-xs-center'>
                      {_('ofUsage', {
                        total: `${props.vmMetrics.vcpus} vCPUs`,
                        usage: `${props.hostMetrics.cpus} CPUs`
                      })}
                    </p>
                  </div>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='disk' /> {_('srUsageStatePanel')}
                </CardHeader>
                <CardBlock>
                  <div className='ct-chart dashboardItem'>
                    <BlockLink to='/dashboard/health'>
                      <ChartistGraph
                        data={{
                          labels: ['Used Space', 'Total Space'],
                          series: [props.srMetrics.srUsage, props.srMetrics.srTotal - props.srMetrics.srUsage]
                        }}
                        options={{ donut: true, donutWidth: 40, showLabel: false }}
                        type='Pie'
                      />
                      <p className='text-xs-center'>
                        {_('ofUsage', {
                          total: formatSize(props.srMetrics.srTotal),
                          usage: formatSize(props.srMetrics.srUsage)
                        })}
                      </p>
                    </BlockLink>
                  </div>
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='alarm' /> {_('alarmMessage')}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/dashboard/health' className={props.nAlarmMessages > 0 ? 'text-warning' : ''}>{props.nAlarmMessages}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='task' /> {_('taskStatePanel')}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/tasks'>{props.nTasks}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='user' /> {_('usersStatePanel')}
                </CardHeader>
                <CardBlock>
                  <p className={styles.bigCardContent}>
                    <Link to='/settings/users'>{nUsers}</Link>
                  </p>
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={4}>
              <Card>
                <CardHeader>
                  <Icon icon='vm-force-shutdown' /> {_('vmStatePanel')}
                </CardHeader>
                <CardBlock className='dashboardItem'>
                  <BlockLink to='/home?t=VM'>
                    <ChartistGraph
                      data={{
                        labels: ['Running', 'Halted', 'Other'],
                        series: [props.vmMetrics.running, props.vmMetrics.halted, props.vmMetrics.other]
                      }}
                      options={{ showLabel: false }}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('vmsStates', { running: props.vmMetrics.running, halted: props.vmMetrics.halted })}
                    </p>
                  </BlockLink>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={8}>
              <Card>
                <CardHeader>
                  <Icon icon='disk' /> {_('srTopUsageStatePanel')}
                </CardHeader>
                <CardBlock className='dashboardItem'>
                  <BlockLink to='/dashboard/health'>
                    <ChartistGraph
                      style={{strokeWidth: '30px'}}
                      data={{
                        labels: map(props.userSrs, 'name_label'),
                        series: map(props.userSrs, sr => (sr.physical_usage / sr.size) * 100)
                      }}
                      options={{ showLabel: false, showGrid: false, distributeSeries: true, high: 100 }}
                      type='Bar'
                    />
                  </BlockLink>
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col>
              <PatchesCard hosts={props.hosts} />
            </Col>
          </Row>
        </Container>
        : <Container><Upgrade place='dashboard' available={3} /></Container>
  }
}
