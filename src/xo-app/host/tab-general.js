import _ from 'intl'
import Copiable from 'copiable'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import store from 'store'
import HomeTags from 'home-tags'
import { addTag, removeTag } from 'xo'
import { BlockLink } from 'link'
import { Container, Row, Col } from 'grid'
import { FormattedRelative } from 'react-intl'
import { formatSize } from 'utils'
import Usage, { UsageElement } from 'usage'
import { getObject } from 'selectors'
import { createString, createProperty, toString } from 'complex-matcher'
import {
  CpuSparkLines,
  MemorySparkLines,
  PifSparkLines,
  LoadSparkLines
} from 'xo-sparklines'

export default ({
  statsOverview,
  host,
  memoryUsed,
  nVms,
  vmController,
  vms
}) => {
  const pool = getObject(store.getState(), host.$pool)
  const vmsFilter = encodeURIComponent(createProperty('$container', createString(host.id))::toString())

  return <Container>
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
        <BlockLink to={`/hosts/${host.id}/storage`}><h2>{host.$PBDs.length}x <Icon icon='disk' size='lg' /></h2></BlockLink>
        <BlockLink to={`/hosts/${host.id}/stats`}>{statsOverview && <LoadSparkLines data={statsOverview} />}</BlockLink>
      </Col>
    </Row>
    <br />
    <Row className='text-xs-center'>
      <Col mediumSize={3}>
        <p className='text-xs-center'>{_('started', { ago: <FormattedRelative value={host.startTime * 1000} /> })}</p>
      </Col>
      <Col mediumSize={3}>
        <p>{host.license_params.sku_marketing_name} {host.version} ({host.license_params.sku_type})</p>
      </Col>
      <Col mediumSize={3}>
        <Copiable tagName='p'>
          {host.address}
        </Copiable>
      </Col>
      <Col mediumSize={3}>
        <p>{host.bios_strings['system-manufacturer']} {host.bios_strings['system-product-name']}</p>
      </Col>
    </Row>
    <br />
    <Row>
      <Col className='text-xs-center'>
        <BlockLink to={`/home?t=VM&s=${vmsFilter}`}><h2>{nVms}x <Icon icon='vm' size='lg' /></h2></BlockLink>
      </Col>
    </Row>
    <br />
    <Row>
      <Col className='text-xs-center'>
        <h5>{_('memoryHostState', { memoryUsed: formatSize(memoryUsed) })}</h5>
      </Col>
    </Row>
    <Row>
      <Col smallOffset={1} mediumSize={10}>
        <Usage total={host.memory.size}>
          <UsageElement
            highlight
            tooltip='XenServer'
            value={vmController.memory.size}
          />
          {map(vms, vm => <UsageElement
            tooltip={vm.name_label}
            key={vm.id}
            value={vm.memory.size}
            href={`#/vms/${vm.id}`}
          />)}
        </Usage>
      </Col>
    </Row>
    {pool && host.id === pool.master && <Row className='text-xs-center'>
      <Col>
        <h3><span className='tag tag-pill tag-info'>{_('pillMaster')}</span></h3>
      </Col>
    </Row>}
    <Row>
      <Col>
        <h2 className='text-xs-center'>
          <HomeTags type='host' labels={host.tags} onDelete={tag => removeTag(host.id, tag)} onAdd={tag => addTag(host.id, tag)} />
        </h2>
      </Col>
    </Row>
  </Container>
}
