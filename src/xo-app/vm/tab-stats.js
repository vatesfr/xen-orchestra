import _ from 'messages'
import Icon from 'icon'
import React from 'react'
import { injectIntl } from 'react-intl'
import { Row, Col } from 'grid'
import {
  CpuLineChart,
  MemoryLineChart,
  VifLineChart,
  XvdLineChart
} from 'xo-line-chart'

export default injectIntl(({
  handleSelectStats,
  selectStatsLoading,
  stats,
  statsGranularity,
  intl
}) => !stats ? <p>No stats.</p> : <div>
  <Row>
    <Col smallSize={6} className='text-xs-right'>
      {selectStatsLoading && <Icon icon='loading' size={2}/>}
    </Col>
    <Col smallSize={6}>
      <div className='btn-tab'>
        <select className='form-control' onChange={handleSelectStats} defaultValue={statsGranularity} >
          <option value='seconds'>{intl.formatMessage({ id: 'statLastTenMinutes' })}</option>
          <option value='minutes'>{intl.formatMessage({ id: 'statLastTwoHours' })}</option>
          <option value='hours'>{intl.formatMessage({ id: 'statLastWeek' })}</option>
          <option value='days'>{intl.formatMessage({ id: 'statLastYear' })}</option>
        </select>
      </div>
    </Col>
  </Row>
  <Row>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='cpu' size={1} /> {_('statsCpu')}</h5>
      <CpuLineChart data={stats} />
    </Col>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='memory' size={1} /> {_('statsMemory')}</h5>
      <MemoryLineChart data={stats} />
    </Col>
  </Row>
  <br/>
  <hr/>
  <Row>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='network' size={1} /> {_('statsNetwork')}</h5>
      <VifLineChart data={stats} />
    </Col>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='disk' size={1} /> {_('statDisk')}</h5>
      <XvdLineChart data={stats} />
    </Col>
  </Row>
</div>
)
