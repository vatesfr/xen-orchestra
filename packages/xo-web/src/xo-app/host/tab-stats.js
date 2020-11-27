import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { DEFAULT_GRANULARITY, fetchStats, SelectGranularity } from 'stats'
import { Toggle } from 'form'
import { CpuLineChart, MemoryLineChart, PifLineChart, LoadLineChart } from 'xo-line-chart'

export default class HostStats extends Component {
  state = {
    granularity: DEFAULT_GRANULARITY,
    useCombinedValues: false,
  }

  loop(host = this.props.host) {
    if (this.cancel) {
      this.cancel()
    }

    if (host.power_state !== 'Running') {
      return
    }

    let cancelled = false
    this.cancel = () => {
      cancelled = true
    }

    fetchStats(host, 'host', this.state.granularity).then(stats => {
      if (cancelled) {
        return
      }
      this.cancel = null

      clearTimeout(this.timeout)
      this.setState(
        {
          stats,
          selectStatsLoading: false,
        },
        () => {
          this.timeout = setTimeout(this.loop, stats.interval * 1000)
        }
      )
    })
  }
  loop = ::this.loop

  componentWillMount() {
    this.loop()
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps(props) {
    const hostCur = this.props.host
    const hostNext = props.host

    if (hostCur.power_state !== 'Running' && hostNext.power_state === 'Running') {
      this.loop(hostNext)
    } else if (hostCur.power_state === 'Running' && hostNext.power_state !== 'Running') {
      this.setState({
        stats: undefined,
      })
    }
  }

  handleSelectStats(granularity) {
    clearTimeout(this.timeout)

    this.setState(
      {
        granularity,
        selectStatsLoading: true,
      },
      this.loop
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
          <Col mediumSize={5}>
            <div className='form-group'>
              <Tooltip content={_('useStackedValuesOnStats')}>
                <Toggle value={useCombinedValues} onChange={this.linkState('useCombinedValues')} />
              </Tooltip>
            </div>
          </Col>
          <Col mediumSize={1}>
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
            <MemoryLineChart data={stats} />
          </Col>
        </Row>
        <br />
        <hr />
        <Row>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='network' size={1} /> {_('statsNetwork')}
            </h5>
            <PifLineChart addSumSeries={useCombinedValues} data={stats} />
          </Col>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='disk' size={1} /> {_('statLoad')}
            </h5>
            <LoadLineChart data={stats} />
          </Col>
        </Row>
      </Container>
    )
  }
}
