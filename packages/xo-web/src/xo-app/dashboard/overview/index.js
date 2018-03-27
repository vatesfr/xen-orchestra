import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ButtonGroup from 'button-group'
import ChartistGraph from 'react-chartist'
import Component from 'base-component'
import HostsPatchesTable from 'hosts-patches-table'
import Icon from 'icon'
import Link, { BlockLink } from 'link'
import PropTypes from 'prop-types'
import React from 'react'
import ResourceSetQuotas from 'resource-set-quotas'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { forEach, isEmpty, map, size } from 'lodash'
import { injectIntl } from 'react-intl'
import {
  createCollectionWrapper,
  createCounter,
  createGetObjectsOfType,
  createGetHostMetrics,
  createSelector,
  createTop,
  isAdmin,
} from 'selectors'
import { addSubscriptions, connectStore, formatSize } from 'utils'
import {
  isSrWritable,
  sendUsageReport,
  subscribePermissions,
  subscribePlugins,
  subscribeResourceSets,
  subscribeUsers,
} from 'xo'

import styles from './index.css'

// ===================================================================

const PIE_GRAPH_OPTIONS = { donut: true, donutWidth: 40, showLabel: false }

// ===================================================================

class PatchesCard extends Component {
  static propTypes = {
    hosts: PropTypes.object.isRequired,
  }

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

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
  const getVms = createGetObjectsOfType('VM')

  const getHostMetrics = createGetHostMetrics(getHosts)

  const writableSrs = createGetObjectsOfType('SR').filter([isSrWritable])

  const getSrMetrics = createCollectionWrapper(
    createSelector(writableSrs, writableSrs => {
      const metrics = {
        srTotal: 0,
        srUsage: 0,
      }
      forEach(writableSrs, sr => {
        metrics.srUsage += sr.physical_usage
        metrics.srTotal += sr.size
      })
      return metrics
    })
  )
  const getVmMetrics = createCollectionWrapper(
    createSelector(getVms, vms => {
      const metrics = {
        vcpus: 0,
        running: 0,
        halted: 0,
        other: 0,
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
    })
  )
  const getNumberOfAlarmMessages = createCounter(
    createGetObjectsOfType('message'),
    [message => message.name === 'ALARM']
  )
  const getNumberOfHosts = createCounter(getHosts)
  const getNumberOfPools = createCounter(createGetObjectsOfType('pool'))
  const getNumberOfTasks = createCounter(
    createGetObjectsOfType('task').filter([task => task.status === 'pending'])
  )
  const getNumberOfVms = createCounter(getVms)

  return {
    hostMetrics: getHostMetrics,
    hosts: getHosts,
    nAlarmMessages: getNumberOfAlarmMessages,
    nHosts: getNumberOfHosts,
    nPools: getNumberOfPools,
    nTasks: getNumberOfTasks,
    nVms: getNumberOfVms,
    srMetrics: getSrMetrics,
    topWritableSrs: createTop(
      writableSrs,
      [sr => sr.physical_usage / sr.size],
      5
    ),
    vmMetrics: getVmMetrics,
  }
})
@addSubscriptions({
  plugins: subscribePlugins,
})
@injectIntl
class DefaultCard extends Component {
  componentWillMount () {
    this.componentWillUnmount = subscribeUsers(users => {
      this.setState({ users })
    })
  }

  _canSendTheReport = createSelector(
    () => this.props.plugins,
    (plugins = []) => {
      let count = 0
      for (const { id, loaded } of plugins) {
        if (
          (id === 'usage-report' || id === 'transport-email') &&
          loaded &&
          ++count === 2
        ) {
          return true
        }
      }
    }
  )

  render () {
    const { props, state } = this
    const users = state && state.users
    const nUsers = size(users)
    const canSendTheReport = this._canSendTheReport()

    const { formatMessage } = props.intl

    return (
      <Container>
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
                    labels: [
                      formatMessage(messages.usedMemory),
                      formatMessage(messages.totalMemory),
                    ],
                    series: [
                      props.hostMetrics.memoryUsage,
                      props.hostMetrics.memoryTotal -
                        props.hostMetrics.memoryUsage,
                    ],
                  }}
                  options={PIE_GRAPH_OPTIONS}
                  type='Pie'
                />
                <p className='text-xs-center'>
                  {_('ofUsage', {
                    total: formatSize(props.hostMetrics.memoryTotal),
                    usage: formatSize(props.hostMetrics.memoryUsage),
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
                      labels: [
                        formatMessage(messages.usedVCpus),
                        formatMessage(messages.totalCpus),
                      ],
                      series: [props.vmMetrics.vcpus, props.hostMetrics.cpus],
                    }}
                    options={{
                      showLabel: false,
                      showGrid: false,
                      distributeSeries: true,
                    }}
                    type='Bar'
                  />
                  <p className='text-xs-center'>
                    {_('ofCpusUsage', {
                      nCpus: props.hostMetrics.cpus,
                      nVcpus: props.vmMetrics.vcpus,
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
                        labels: [
                          formatMessage(messages.usedSpace),
                          formatMessage(messages.totalSpace),
                        ],
                        series: [
                          props.srMetrics.srUsage,
                          props.srMetrics.srTotal - props.srMetrics.srUsage,
                        ],
                      }}
                      options={PIE_GRAPH_OPTIONS}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('ofUsage', {
                        total: formatSize(props.srMetrics.srTotal),
                        usage: formatSize(props.srMetrics.srUsage),
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
                  <Link
                    to='/dashboard/health'
                    className={props.nAlarmMessages > 0 ? 'text-warning' : ''}
                  >
                    {props.nAlarmMessages}
                  </Link>
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
                  {props.isAdmin ? (
                    <Link to='/settings/users'>{nUsers}</Link>
                  ) : (
                    <p>{nUsers}</p>
                  )}
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
                      labels: [
                        formatMessage(messages.vmStateRunning),
                        formatMessage(messages.vmStateHalted),
                        formatMessage(messages.vmStateOther),
                      ],
                      series: [
                        props.vmMetrics.running,
                        props.vmMetrics.halted,
                        props.vmMetrics.other,
                      ],
                    }}
                    options={{ showLabel: false }}
                    type='Pie'
                  />
                  <p className='text-xs-center'>
                    {_('vmsStates', {
                      running: props.vmMetrics.running,
                      halted: props.vmMetrics.halted,
                    })}
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
                    style={{ strokeWidth: '30px' }}
                    data={{
                      labels: map(props.topWritableSrs, 'name_label'),
                      series: map(
                        props.topWritableSrs,
                        sr => sr.physical_usage / sr.size * 100
                      ),
                    }}
                    options={{
                      showLabel: false,
                      showGrid: false,
                      distributeSeries: true,
                      high: 100,
                    }}
                    type='Bar'
                  />
                </BlockLink>
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='menu-dashboard-stats' /> {_('dashboardReport')}
              </CardHeader>
              <CardBlock className='text-xs-center'>
                <ActionButton
                  btnStyle='primary'
                  disabled={!canSendTheReport}
                  handler={sendUsageReport}
                  icon=''
                >
                  {_('dashboardSendReport')}
                </ActionButton>
                <br />
                {!canSendTheReport && (
                  <span>
                    <Link to='/settings/plugins' className='text-info'>
                      <Icon icon='info' /> {_('dashboardSendReportInfo')}
                    </Link>
                    <br />
                  </span>
                )}
                {_('dashboardSendReportMessage')}
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
    )
  }
}

// ===================================================================

@addSubscriptions({
  resourceSets: subscribeResourceSets,
  permissions: subscribePermissions,
})
@connectStore({
  isAdmin,
})
export default class Overview extends Component {
  render () {
    const { props } = this
    const showResourceSets = !isEmpty(props.resourceSets) && !props.isAdmin
    const authorized = !isEmpty(props.permissions) || props.isAdmin

    if (!authorized && !showResourceSets) {
      return <em>{_('notEnoughPermissionsError')}</em>
    }

    return (
      <Upgrade place='dashboard' required={3}>
        <Container>
          {showResourceSets ? (
            map(props.resourceSets, resourceSet => (
              <Row key={resourceSet.id}>
                <Card>
                  <CardHeader>
                    <Icon icon='menu-self-service' /> {resourceSet.name}
                  </CardHeader>
                  <CardBlock>
                    <ResourceSetQuotas limits={resourceSet.limits} />
                  </CardBlock>
                </Card>
              </Row>
            ))
          ) : (
            <DefaultCard isAdmin={props.isAdmin} />
          )}
        </Container>
      </Upgrade>
    )
  }
}
