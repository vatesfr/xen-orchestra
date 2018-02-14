import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { Toggle } from 'form'
import { fetchHostStats } from 'xo'
import {
  CpuLineChart,
  GpuMemoryLineChart,
  LoadLineChart,
  MemoryLineChart,
  PifLineChart,
} from 'xo-line-chart'

export default class HostStats extends Component {
  constructor (props) {
    super(props)
    this.state.useCombinedValues = false
  }

  loop (host = this.props.host) {
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

    fetchHostStats(host, this.state.granularity).then(stats => {
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

  componentWillMount () {
    this.loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps (props) {
    const hostCur = this.props.host
    const hostNext = props.host

    if (
      hostCur.power_state !== 'Running' &&
      hostNext.power_state === 'Running'
    ) {
      this.loop(hostNext)
    } else if (
      hostCur.power_state === 'Running' &&
      hostNext.power_state !== 'Running'
    ) {
      this.setState({
        stats: undefined,
      })
    }
  }

  handleSelectStats (event) {
    const granularity = event.target.value
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

  render () {
    const {
      granularity,
      selectStatsLoading,
      stats,
      useCombinedValues,
    } = this.state

    return !stats ? (
      <p>No stats.</p>
    ) : process.env.XOA_PLAN > 2 ? (
      <Container>
        <Row>
          <Col mediumSize={5}>
            <div className='form-group'>
              <Tooltip content={_('useStackedValuesOnStats')}>
                <Toggle
                  value={useCombinedValues}
                  onChange={this.linkState('useCombinedValues')}
                />
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
            <div className='btn-tab'>
              <select
                className='form-control'
                onChange={this.handleSelectStats}
                defaultValue={granularity}
              >
                {_('statLastTenMinutes', message => (
                  <option value='seconds'>{message}</option>
                ))}
                {_('statLastTwoHours', message => (
                  <option value='minutes'>{message}</option>
                ))}
                {_('statLastWeek', message => (
                  <option value='hours'>{message}</option>
                ))}
                {_('statLastYear', message => (
                  <option value='days'>{message}</option>
                ))}
              </select>
            </div>
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
        {stats.stats.gpuMemoryUsed.length !== 0 && (
          <div>
            <br />
            <hr />
            <Row>
              <Col mediumSize={12}>
                <h5 className='text-xs-center'>
                  <Icon icon='memory' size={1} /> {_('statsGpuMemory')}
                </h5>
                <GpuMemoryLineChart data={stats} />
              </Col>
            </Row>
          </div>
        )}
      </Container>
    ) : (
      <Container>
        <Upgrade place='hostStats' available={3} />
      </Container>
    )
  }
}
