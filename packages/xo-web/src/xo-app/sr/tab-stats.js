import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { fetchSrStats } from 'xo'
import { get } from 'lodash'
import { Toggle } from 'form'
import {
  IopsLineChart,
  IoThroughputChart,
  IowaitChart,
  LatencyChart,
} from 'xo-line-chart'

export default class SrStats extends Component {
  state = {
    granularity: 'seconds',
  }

  _loop (sr = get(this.props, 'sr')) {
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

    fetchSrStats(sr, this.state.granularity).then(data => {
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

  componentWillMount () {
    this._loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  _onGranularityChange = ({ target: { value: granularity } }) => {
    clearTimeout(this.timeout)
    this.setState(
      {
        granularity,
        selectStatsLoading: true,
      },
      this._loop
    )
  }

  render () {
    const {
      data,
      granularity,
      selectStatsLoading,
      useCombinedValues,
    } = this.state

    return data === undefined ? (
      <span>{_('srNoStats')}</span>
    ) : (
      <Upgrade place='srStats' available={3}>
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
                  onChange={this._onGranularityChange}
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
      </Upgrade>
    )
  }
}
