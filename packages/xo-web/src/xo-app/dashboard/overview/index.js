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
import { addSubscriptions, connectStore, formatSize } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { compact, filter, forEach, includes, isEmpty, map, size } from 'lodash'
import { injectIntl } from 'react-intl'
import { SelectHost, SelectPool } from 'select-objects'
import {
  createCollectionWrapper,
  createCounter,
  createFilter,
  createGetHostMetrics,
  createGetObjectsOfType,
  createSelector,
  createTop,
  isAdmin,
} from 'selectors'
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

  render() {
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

@connectStore({
  hosts: createGetObjectsOfType('host'),
  isAdmin,
  pools: createGetObjectsOfType('pool'),
  srs: createGetObjectsOfType('SR').filter([sr => isSrWritable(sr) && sr.SR_type !== 'udev']),
  vms: createGetObjectsOfType('VM'),
  alarmMessages: createGetObjectsOfType('message').filter([message => message.name === 'ALARM']),
  tasks: createGetObjectsOfType('task').filter([task => task.status === 'pending']),
})
@addSubscriptions(
  ({ isAdmin }) =>
    isAdmin && {
      plugins: subscribePlugins,
      users: subscribeUsers,
    }
)
@injectIntl
class DefaultCard extends Component {
  _getPoolWisePredicate = createSelector(
    createCollectionWrapper(() => map(this.state.pools, 'id')),
    poolsIds => item => isEmpty(poolsIds) || includes(poolsIds, item.$pool)
  )

  _getPredicate = createSelector(
    this._getPoolWisePredicate,
    createCollectionWrapper(() => map(this.state.hosts, 'id')),
    (poolWisePredicate, hostsIds) => item =>
      isEmpty(hostsIds) ? poolWisePredicate(item) : includes(hostsIds, item.$container || item.$host)
  )

  _onPoolsChange = pools => {
    const { hosts } = this.state
    const poolIds = map(pools, 'id')
    this.setState({
      pools,
      hosts: isEmpty(pools) ? hosts : filter(hosts, host => includes(poolIds, host.$pool)),
    })
  }

  _getHosts = createSelector(
    createFilter(() => this.props.hosts, this._getPoolWisePredicate),
    () => this.state.hosts,
    (hosts, selectedHosts) => (isEmpty(selectedHosts) ? hosts : selectedHosts)
  )

  _getVms = createFilter(() => this.props.vms, this._getPredicate)

  _getSrs = createFilter(() => this.props.srs, this._getPredicate)

  _getPoolsNumber = createCounter(
    createSelector(
      () => this.props.pools,
      () => this.state.pools,
      (pools, selectedPools) => (isEmpty(selectedPools) ? pools : selectedPools)
    )
  )

  _getHostsNumber = createCounter(this._getHosts)

  _getVmsNumber = createCounter(this._getVms)

  _getAlarmMessagesNumber = createCounter(createFilter(() => this.props.alarmMessages, this._getPoolWisePredicate))

  _getTasksNumber = createCounter(createFilter(() => this.props.tasks, this._getPredicate))

  _getHostMetrics = createGetHostMetrics(this._getHosts)

  _getVmMetrics = createCollectionWrapper(
    createSelector(this._getVms, vms => {
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

  _getSrMetrics = createCollectionWrapper(
    createSelector(this._getSrs, srs => {
      const metrics = {
        srTotal: 0,
        srUsage: 0,
      }
      forEach(srs, sr => {
        metrics.srUsage += sr.physical_usage
        metrics.srTotal += sr.size
      })
      return metrics
    })
  )

  _getTopSrs = createTop(this._getSrs, [sr => sr.physical_usage / sr.size], 5)

  _onHostsChange = hosts => {
    this.setState({
      hosts: compact(hosts),
    })
  }

  _canSendTheReport = createSelector(
    () => this.props.plugins,
    (plugins = []) => {
      let count = 0
      for (const { id, loaded } of plugins) {
        if ((id === 'usage-report' || id === 'transport-email') && loaded && ++count === 2) {
          return true
        }
      }
    }
  )

  render() {
    const { props, state } = this
    const users = props.users
    const nUsers = size(users)
    const canSendTheReport = this._canSendTheReport()
    const nPools = this._getPoolsNumber()
    const nHosts = this._getHostsNumber()
    const nVms = this._getVmsNumber()
    const nAlarmMessages = this._getAlarmMessagesNumber()
    const hostMetrics = this._getHostMetrics()
    const vmMetrics = this._getVmMetrics()
    const srMetrics = this._getSrMetrics()
    const topSrs = this._getTopSrs()

    const { formatMessage } = props.intl

    return (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <SelectPool multi onChange={this._onPoolsChange} value={state.pools} />
          </Col>
          <Col mediumSize={6}>
            <SelectHost
              multi
              onChange={this._onHostsChange}
              predicate={this._getPoolWisePredicate()}
              value={state.hosts}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='pool' /> {_('poolPanel', { pools: nPools })}
              </CardHeader>
              <CardBlock>
                <p className={styles.bigCardContent}>
                  <Link to='/home?t=pool'>{nPools}</Link>
                </p>
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='host' /> {_('hostPanel', { hosts: nHosts })}
              </CardHeader>
              <CardBlock>
                <p className={styles.bigCardContent}>
                  <Link to='/home?t=host'>{nHosts}</Link>
                </p>
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('vmPanel', { vms: nVms })}
              </CardHeader>
              <CardBlock>
                <p className={styles.bigCardContent}>
                  <Link to='/home?s=&t=VM'>{nVms}</Link>
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
                    labels: [formatMessage(messages.usedMemory), formatMessage(messages.totalMemory)],
                    series: [hostMetrics.memoryUsage, hostMetrics.memoryTotal - hostMetrics.memoryUsage],
                  }}
                  options={PIE_GRAPH_OPTIONS}
                  type='Pie'
                />
                <p className='text-xs-center'>
                  {_('ofUsage', {
                    total: formatSize(hostMetrics.memoryTotal),
                    usage: formatSize(hostMetrics.memoryUsage),
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
                      labels: [formatMessage(messages.usedVCpus), formatMessage(messages.totalCpus)],
                      series: [vmMetrics.vcpus, hostMetrics.cpus],
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
                      nCpus: hostMetrics.cpus,
                      nVcpus: vmMetrics.vcpus,
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
                        labels: [formatMessage(messages.usedSpace), formatMessage(messages.totalSpace)],
                        series: [srMetrics.srUsage, srMetrics.srTotal - srMetrics.srUsage],
                      }}
                      options={PIE_GRAPH_OPTIONS}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('ofUsage', {
                        total: formatSize(srMetrics.srTotal),
                        usage: formatSize(srMetrics.srUsage),
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
                  <Link to='/dashboard/health' className={nAlarmMessages > 0 ? 'text-warning' : ''}>
                    {nAlarmMessages}
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
                  <Link to='/tasks'>{this._getTasksNumber()}</Link>
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
                  {props.isAdmin ? <Link to='/settings/users'>{nUsers}</Link> : <p>{nUsers}</p>}
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
                      series: [vmMetrics.running, vmMetrics.halted, vmMetrics.other],
                    }}
                    options={{ showLabel: false }}
                    type='Pie'
                  />
                  <p className='text-xs-center'>
                    {_('vmsStates', {
                      running: vmMetrics.running,
                      halted: vmMetrics.halted,
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
                      labels: map(topSrs, 'name_label'),
                      series: map(topSrs, sr => (sr.physical_usage / sr.size) * 100),
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
        {props.isAdmin && (
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <Icon icon='menu-dashboard-stats' /> {_('dashboardReport')}
                </CardHeader>
                <CardBlock className='text-xs-center'>
                  <ActionButton btnStyle='primary' disabled={!canSendTheReport} handler={sendUsageReport} icon=''>
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
        )}
        <Row>
          <Col>
            <PatchesCard hosts={this._getHosts()} />
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
  render() {
    const { props } = this
    const showResourceSets = !isEmpty(props.resourceSets) && !props.isAdmin
    const authorized = !isEmpty(props.permissions) || props.isAdmin

    if (!authorized && !showResourceSets) {
      return <em>{_('notEnoughPermissionsError')}</em>
    }

    return (
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
    )
  }
}
