import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { DEFAULT_GRANULARITY, fetchStats, SelectGranularity } from 'stats'
import get from 'lodash/get.js'
import { Toggle } from 'form'
import { IopsLineChart, IoThroughputChart, IowaitChart, LatencyChart } from 'xo-line-chart'

export default class SrStats extends Component {
  state = {
    granularity: DEFAULT_GRANULARITY,
  }

  _loop(sr = get(this.props, 'sr')) {
    if (sr === undefined) {
      this._loop()
    }

    if (this.cancel !== undefined) {
      this.cancel()
    }

    let cancelled = false
    this.cancel = () => {
      cancelled = true
    }

    fetchStats(sr, 'sr', this.state.granularity).then(data => {
      if (cancelled) {
        return
      }
      this.cancel = undefined

      clearTimeout(this.timeout)
      this.setState(
        {
          data,
          selectStatsLoading: false,
        },
        () => {
          this.timeout = setTimeout(this._loop, data.interval * 1e3)
        }
      )
    })
  }

  _loop = ::this._loop

  componentWillMount() {
    this._loop()
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  _onGranularityChange = granularity => {
    clearTimeout(this.timeout)
    this.setState(
      {
        granularity,
        selectStatsLoading: true,
      },
      this._loop
    )
  }

  render() {
    const { data, granularity, selectStatsLoading, useCombinedValues } = this.state

    return data === undefined ? (
      <span>{_('srNoStats')}</span>
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
            <SelectGranularity onChange={this._onGranularityChange} required value={granularity} />
          </Col>
        </Row>
        <Row>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='iops' size={1} /> {_('statsIops')}
            </h5>
            <IopsLineChart addSumSeries={useCombinedValues} data={data} />
          </Col>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='disk' size={1} /> {_('statsIoThroughput')}
            </h5>
            <IoThroughputChart addSumSeries={useCombinedValues} data={data} />
          </Col>
        </Row>
        <br />
        <hr />
        <Row>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='latency' size={1} /> {_('statsLatency')}
            </h5>
            <LatencyChart addSumSeries={useCombinedValues} data={data} />
          </Col>
          <Col mediumSize={6}>
            <h5 className='text-xs-center'>
              <Icon icon='iowait' size={1} /> {_('statsIowait')}
            </h5>
            <IowaitChart addSumSeries={useCombinedValues} data={data} />
          </Col>
        </Row>
      </Container>
    )
  }
}
