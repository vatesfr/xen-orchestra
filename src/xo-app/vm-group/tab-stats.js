import _ from 'intl'
import Component from 'base-component'
import filter from 'lodash/filter'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { Toggle } from 'form'
import { fetchVmStats } from 'xo'
import {
  VmGroupCpuLineChart,
  VmGroupMemoryLineChart,
  VmGroupVifLineChart,
  VmGroupXvdLineChart
} from 'xo-line-chart'

export default class TabStats extends Component {
  constructor (props) {
    super(props)
    this.state.useCombinedValues = false
  }

  loop (vmGroup = this.props.vmGroup) {
    if (this.cancel) {
      this.cancel()
    }

    let cancelled = false
    this.cancel = () => { cancelled = true }

    Promise.all(map(filter(this.props.vms, vm => vm.power_state === 'Running'), vm =>
      fetchVmStats(vm, this.state.granularity).then(
        stats => ({
          vm: vm.name_label,
          ...stats
        })
      )
    )).then(stats => {
      if (cancelled || !stats[0]) {
        return
      }
      this.cancel = null

      clearTimeout(this.timeout)
      this.setState({
        stats,
        selectStatsLoading: false
      }, () => {
        this.timeout = setTimeout(this.loop, stats[0].interval * 1000)
      })
    })
  }
  loop = ::this.loop

  handleSelectStats (event) {
    const granularity = event.target.value
    clearTimeout(this.timeout)

    this.setState({
      granularity,
      selectStatsLoading: true
    }, this.loop)
  }
  handleSelectStats = ::this.handleSelectStats

  componentWillMount () {
    this.loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  render () {
    const {
      granularity,
      selectStatsLoading,
      stats,
      useCombinedValues
    } = this.state
    return !stats
      ? <p>No stats.</p>
      : process.env.XOA_PLAN > 2
        ? <Container>
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
              <div className='btn-tab'>
                <select className='form-control' onChange={this.handleSelectStats} defaultValue={granularity} >
                  {_('statLastTenMinutes', message => <option value='seconds'>{message}</option>)}
                  {_('statLastTwoHours', message => <option value='minutes'>{message}</option>)}
                  {_('statLastWeek', message => <option value='hours'>{message}</option>)}
                  {_('statLastYear', message => <option value='days'>{message}</option>)}
                </select>
              </div>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={6}>
              <h5 className='text-xs-center'><Icon icon='cpu' size={1} /> {_('statsCpu')}</h5>
              <VmGroupCpuLineChart addSumSeries={useCombinedValues} data={stats} />
            </Col>
            <Col mediumSize={6}>
              <h5 className='text-xs-center'><Icon icon='memory' size={1} /> {_('statsMemory')}</h5>
              <VmGroupMemoryLineChart addSumSeries={useCombinedValues} data={stats} />
            </Col>
          </Row>
          <br />
          <hr />
          <Row>
            <Col mediumSize={6}>
              <h5 className='text-xs-center'><Icon icon='network' size={1} /> {_('statsNetwork')}</h5>
              <VmGroupVifLineChart key={useCombinedValues ? 'stacked' : 'unstacked'} addSumSeries={useCombinedValues} data={stats} />
            </Col>
            <Col mediumSize={6}>
              <h5 className='text-xs-center'><Icon icon='disk' size={1} /> {_('statDisk')}</h5>
              <VmGroupXvdLineChart addSumSeries={useCombinedValues} data={stats} />
            </Col>
          </Row>
        </Container>
        : <Container><Upgrade place='hostStats' available={3} /></Container>
  }
}
