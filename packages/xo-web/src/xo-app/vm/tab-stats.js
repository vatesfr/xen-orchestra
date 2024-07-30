import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { DEFAULT_GRANULARITY, fetchStats, INTERVAL_BY_GRANULARITY, SelectGranularity } from 'stats'
import { Toggle } from 'form'
import { CpuLineChart, MemoryLineChart, VifLineChart, XvdLineChart } from 'xo-line-chart'

export default class VmStats extends Component {
  state = {
    granularity: DEFAULT_GRANULARITY,
    useCombinedValues: false,
    statsIsPending: false,
  }

  fetchVmStats = () => {
    if (this.state.statsIsPending) {
      return
    }

    const vm = this.props.vm

    if (vm.power_state !== 'Running') {
      return
    }

    if (this.props.statsOverview?.interval === INTERVAL_BY_GRANULARITY[this.state.granularity.granularity]) {
      this.setState({
        stats: this.props.statsOverview,
        selectStatsLoading: false,
      })
      return
    }

    this.setState({
      statsIsPending: true,
    })
    fetchStats(vm, 'vm', this.state.granularity).then(stats => {
      this.setState({
        stats,
        selectStatsLoading: false,
        statsIsPending: false,
      })
    })
  }

  initFetchVmStats() {
    this.fetchVmStats()
    this.interval = setInterval(this.fetchVmStats, INTERVAL_BY_GRANULARITY[this.state.granularity.granularity] * 1000)
  }
  initFetchVmStats = ::this.initFetchVmStats

  componentWillMount() {
    this.initFetchVmStats()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentWillReceiveProps(props) {
    const vmCur = this.props.vm
    const vmNext = props.vm

    if (vmCur.power_state !== 'Running' && vmNext.power_state === 'Running') {
      this.initFetchVmStats(vmNext)
    } else if (vmCur.power_state === 'Running' && vmNext.power_state !== 'Running') {
      this.setState({
        stats: undefined,
      })
    }
  }

  handleSelectStats(granularity) {
    clearInterval(this.interval)

    this.setState(
      {
        granularity,
        selectStatsLoading: true,
      },
      this.initFetchVmStats
    )
  }
  handleSelectStats = ::this.handleSelectStats

  render() {
    const { granularity, selectStatsLoading, stats, useCombinedValues } = this.state

    return !stats ? (
      <p>No stats.</p>
    ) : (
      <Container>
        <Row>
          <Col mediumSize={6}>
            <div className='form-group'>
              <Tooltip content={_('useStackedValuesOnStats')}>
                <Toggle value={useCombinedValues} onChange={this.linkState('useCombinedValues')} />
              </Tooltip>
            </div>
            {selectStatsLoading && (
              <div className='text-xs-right'>
                <Icon icon='loading' size={2} />
              </div>
            )}
          </Col>
          <Col mediumSize={6}>
            <SelectGranularity onChange={this.handleSelectStats} required value={granularity} />
          </Col>
        </Row>
        <Row>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='cpu' size={1} /> {_('statsCpu')}
            </h5>
            <CpuLineChart addSumSeries={useCombinedValues} data={stats} />
          </Col>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='memory' size={1} /> {_('statsMemory')}
            </h5>
            {this.props.vm.managementAgentDetected ? (
              <MemoryLineChart data={stats} />
            ) : (
              <div className='text-xs-center text-warning' style={{ marginTop: '3rem' }}>
                <Icon icon='alarm' /> {_('guestToolsNecessary')}
              </div>
            )}
          </Col>
        </Row>
        <br />
        <hr />
        <Row>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='network' size={1} /> {_('statsNetwork')}
            </h5>
            <VifLineChart addSumSeries={useCombinedValues} data={stats} />
          </Col>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='disk' size={1} /> {_('statDisk')}
            </h5>
            <XvdLineChart addSumSeries={useCombinedValues} data={stats} />
          </Col>
        </Row>
      </Container>
    )
  }
}
