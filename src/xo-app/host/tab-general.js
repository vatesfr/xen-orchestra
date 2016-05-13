import _ from 'messages'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { addTag, removeTag } from 'xo'
import { FormattedRelative } from 'react-intl'
import { Row, Col } from 'grid'
import {
  BlockLink,
  formatSize
} from 'utils'
import {
  CpuSparkLines,
  MemorySparkLines,
  PifSparkLines,
  LoadSparkLines
} from 'xo-sparklines'

export default ({
  statsOverview,
  host,
  vmController,
  vms
}) => <div>
  <br />
  <Row className='text-xs-center'>
    <Col mediumSize={3}>
      <h2>{host.CPUs.cpu_count}x <Icon icon='cpu' size='lg' /></h2>
      <BlockLink to={`/hosts/${host.id}/stats`}>{statsOverview && <CpuSparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <h2>{formatSize(host.memory.size)} <Icon icon='memory' size='lg' /></h2>
      <BlockLink to={`/hosts/${host.id}/stats`}>{statsOverview && <MemorySparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/hosts/${host.id}/network`}><h2>{host.$PIFs.length}x <Icon icon='network' size='lg' /></h2></BlockLink>
      <BlockLink to={`/hosts/${host.id}/stats`}>{statsOverview && <PifSparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/hosts/${host.id}/disks`}><h2>{host.$PBDs.length}x <Icon icon='disk' size='lg' /></h2></BlockLink>
      <BlockLink to={`/hosts/${host.id}/stats`}>{statsOverview && <LoadSparkLines data={statsOverview} />}</BlockLink>
    </Col>
  </Row>
  <br />
  <Row className='text-xs-center'>
    <Col smallSize={3}>
      <p className='text-xs-center'>{_('started', { ago: <FormattedRelative value={host.startTime * 1000} /> })}</p>
    </Col>
    <Col smallSize={3}>
      <p>{host.license_params.sku_marketing_name} {host.license_params.version} ({host.license_params.sku_type})</p>
    </Col>
    <Col smallSize={3}>
      <p>{host.address}</p>
    </Col>
    <Col smallSize={3}>
      <p>{host.bios_strings['system-manufacturer']} {host.bios_strings['system-product-name']}</p>
    </Col>
  </Row>
  <Row>
    <Col smallOffset={1} smallSize={10}>
      <span className='progress'>
        <Tooltip content='XenServer'>
          <span className='progress-dom0' style={{ width: (vmController.memory.size / host.memory.size) * 100 + '%' }}>
          </span>
        </Tooltip>
        {map(vms, vm => (
          <Tooltip content={vm.name_label}>
            <a href={`#/vms/${vm.id}`} key={vm.id} className='progress-object' style={{ width: (vm.memory.size / host.memory.size) * 100 + '%' }}>
            </a>
          </Tooltip>
          )
        )}
      </span>
    </Col>
  </Row>
  <Row>
    <Col smallSize={12}>
      <h2 className='text-xs-center'>
        <Tags labels={host.tags} onDelete={tag => removeTag(host.id, tag)} onAdd={tag => addTag(host.id, tag)} />
      </h2>
    </Col>
  </Row>
</div>
