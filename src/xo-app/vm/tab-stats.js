import _, { messages } from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { fetchVmStats } from 'xo'
import { Toggle } from 'form'
import { injectIntl } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  CpuLineChart,
  MemoryLineChart,
  VifLineChart,
  XvdLineChart
} from 'xo-line-chart'

export default injectIntl(
  class VmStats extends Component {
    constructor (props) {
      super(props)
      this.state.useCombinedValues = false
    }

    loop (vm = this.props.vm) {
      if (this.cancel) {
        this.cancel()
      }

      if (vm.power_state !== 'Running') {
        return
      }

      let cancelled = false
      this.cancel = () => {
        cancelled = true
      }

      fetchVmStats(vm, this.state.granularity).then(stats => {
        if (cancelled) {
          return
        }
        this.cancel = null

        clearTimeout(this.timeout)
        this.setState(
          {
            stats,
            selectStatsLoading: false
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
      const vmCur = this.props.vm
      const vmNext = props.vm

      if (vmCur.power_state !== 'Running' && vmNext.power_state === 'Running') {
        this.loop(vmNext)
      } else if (
        vmCur.power_state === 'Running' &&
        vmNext.power_state !== 'Running'
      ) {
        this.setState({
          stats: undefined
        })
      }
    }

    handleSelectStats (event) {
      const granularity = event.target.value
      clearTimeout(this.timeout)

      this.setState(
        {
          granularity,
          selectStatsLoading: true
        },
        this.loop
      )
    }
    handleSelectStats = ::this.handleSelectStats

    render () {
      const { intl } = this.props
      const {
        granularity,
        selectStatsLoading,
        stats,
        useCombinedValues
      } = this.state

      return !stats ? (
        <p>No stats.</p>
      ) : process.env.XOA_PLAN > 2 ? (
        <Container>
          <Row>
            <Col mediumSize={6}>
              <div className='form-group'>
                <Tooltip content={_('useStackedValuesOnStats')}>
                  <Toggle
                    value={useCombinedValues}
                    onChange={this.linkState('useCombinedValues')}
                  />
                </Tooltip>
              </div>
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
                  <option value='seconds'>
                    {intl.formatMessage(messages.statLastTenMinutes)}
                  </option>
                  <option value='minutes'>
                    {intl.formatMessage(messages.statLastTwoHours)}
                  </option>
                  <option value='hours'>
                    {intl.formatMessage(messages.statLastWeek)}
                  </option>
                  <option value='days'>
                    {intl.formatMessage(messages.statLastYear)}
                  </option>
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
      ) : (
        <Container>
          <Upgrade place='vmStats' available={3} />
        </Container>
      )
    }
  }
)
