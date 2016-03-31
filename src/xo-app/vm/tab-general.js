import _ from 'messages'
import Icon from 'icon'
import React from 'react'
import Tags from 'tags'
import { FormattedRelative } from 'react-intl'
import { Row, Col } from 'grid'
import {
  formatSize,
  osFamily
} from 'utils'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

export default ({
  addTag,
  removeTag,
  statsOverview,
  vm,
  vmTotalDiskSpace
}) => <div>
  { /* TODO: use CSS style */ }
  <br/>
  <Row className='text-xs-center'>
    <Col mediumSize={3}>
      <h2>{vm.CPUs.number}x <i className='xo-icon-cpu fa-lg'></i></h2>
      {statsOverview && <CpuSparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <h2>{formatSize(vm.memory.size)} <i className='xo-icon-memory fa-lg'></i></h2>
      {statsOverview && <MemorySparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <h2>{formatSize(vmTotalDiskSpace)} <i className='xo-icon-disk fa-lg'></i></h2>
      {statsOverview && <XvdSparkLines data={statsOverview} />}
    </Col>
    <Col mediumSize={3}>
      <h2>{vm.VIFs.length}x <i className='xo-icon-network fa-lg'></i></h2>
      {statsOverview && <VifSparkLines data={statsOverview} />}
    </Col>
  </Row>
  { /* TODO: use CSS style */ }
  <br/>
  {vm.xenTools
    ? <Row className='text-xs-center'>
      <Col smallSize={3}>
        {vm.power_state === 'Running'
          ? <div>
            <p className='text-xs-center'>{_('started', { ago: <FormattedRelative value={vm.startTime * 1000}/> })}</p>
          </div>
          : null
        }
      </Col>
      <Col smallSize={3}>
        <p>
          {vm.virtualizationMode === 'pv'
            ? _('paraVirtualizedMode')
            : _('hardwareVirtualizedMode')
          }
        </p>
      </Col>
      <Col smallSize={3}>
        { /* TODO: tooltip and better icon usage */ }
        <h1><i className={'icon-' + osFamily(vm.os_version.distro)} /></h1>
      </Col>
      <Col smallSize={3}>
        <p className='copy-to-clipboard'>
          {vm.addresses['0/ip']
            ? vm.addresses['0/ip']
            : _('noIpv4Record')
          }
        </p>
      </Col>
    </Row>
    : <Row className='text-xs-center'>
      <Col smallSize={12}><em>{_('noToolsDetected')}.</em></Col>
    </Row>
  }
  { /* TODO: use CSS style */ }
  <br/>
  <Row>
    <Col smallSize={12}>
      <h2 className='text-xs-center'>
        <Icon icon='tags' size='lg'/>
        <Tags labels={vm.tags} onDelete={(tag) => removeTag(vm.id, tag)} onAdd={(tag) => addTag(vm.id, tag)}/>
      </h2>
    </Col>
  </Row>
</div>
