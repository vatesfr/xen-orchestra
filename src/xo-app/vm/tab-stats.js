import Icon from 'icon'
import React from 'react'
import { Row, Col } from 'grid'
import {
  CpuLineChart,
  MemoryLineChart,
  VifLineChart,
  XvdLineChart
} from 'xo-line-chart'

export default ({
  handleSelectStats,
  selectStatsLoading,
  stats,
  statsGranularity
}) => !stats ? <p>No stats.</p> : <div>
  <Row>
    <Col smallSize={6} className='text-xs-right'>
      {selectStatsLoading && <Icon icon='loading' size={2}/>}
    </Col>
    <Col smallSize={6}>
      <div className='pull-xs-right'>
        <select className='form-control' onChange={handleSelectStats} defaultValue={statsGranularity} >
          <option value='seconds'>Last 10 minutes</option>
          <option value='minutes'>Last 2 hours</option>
          <option value='hours'>Last week</option>
          <option value='days'>Last year</option>
        </select>
      </div>
    </Col>
  </Row>
  <Row>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='cpu' size={1} /> CPU</h5>
      <CpuLineChart data={stats} />
    </Col>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='memory' size={1} /> RAM</h5>
      <MemoryLineChart data={stats} />
    </Col>
  </Row>
  <br/>
  <Row>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='disk' size={1} /> XVDs</h5>
      <XvdLineChart data={stats} />
    </Col>
    <Col smallSize={6}>
      <h5 className='text-xs-center'><Icon icon='network' size={1} /> VIFs</h5>
      <VifLineChart data={stats} />
    </Col>
  </Row>
</div>
