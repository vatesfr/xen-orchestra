import * as CM from 'complex-matcher'
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
import { formatSize, formatSizeShort, hasLicenseRestrictions } from 'utils'
import Usage, { UsageElement } from 'usage'
import { getObject } from 'selectors'
import { CpuSparkLines, MemorySparkLines, NetworkSparkLines, LoadSparkLines } from 'xo-sparklines'

import LicenseWarning from './license-warning'

export default ({ statsOverview, host, nVms, vmController, vms }) => {
  const pool = getObject(store.getState(), host.$pool)
  const vmsFilter = encodeURIComponent(new CM.Property('$container', new CM.String(host.id)).toString())

  return (
    <Container>
      <br />
      <Row className='text-xs-center'>
        <Col mediumSize={3}>
          <h2>
            {host.CPUs.cpu_count}x <Icon icon='cpu' size='lg' />
          </h2>
          <BlockLink to={`/hosts/${host.id}/stats`}>
            {statsOverview && <CpuSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <h2>
            {formatSize(host.memory.size)} <Icon icon='memory' size='lg' />
          </h2>
          <BlockLink to={`/hosts/${host.id}/stats`}>
            {statsOverview && <MemorySparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/hosts/${host.id}/network`}>
            <h2>
              {host.$PIFs.length}x <Icon icon='network' size='lg' />
            </h2>
          </BlockLink>
          <BlockLink to={`/hosts/${host.id}/stats`}>
            {statsOverview && <NetworkSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/hosts/${host.id}/storage`}>
            <h2>
              {host.$PBDs.length}x <Icon icon='disk' size='lg' />
            </h2>
          </BlockLink>
          <BlockLink to={`/hosts/${host.id}/stats`}>
            {statsOverview && <LoadSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
      </Row>
      <br />
      <Row className='text-xs-center'>
        <Col mediumSize={3}>
          <p className='text-xs-center'>
            {_('started', {
              ago: <FormattedRelative value={host.startTime * 1000} />,
            })}
          </p>
        </Col>
        <Col mediumSize={3}>
          <p>
            {host.productBrand} {host.version} (
            {host.productBrand !== 'XCP-ng' ? host.license_params.sku_type : 'GPLv2'}){' '}
            {hasLicenseRestrictions(host) && <LicenseWarning iconSize='lg' />}
          </p>
        </Col>
        <Col mediumSize={3}>
          <Copiable tagName='p'>{host.address}</Copiable>
        </Col>
        <Col mediumSize={3}>
          <p>
            {host.bios_strings['system-manufacturer']} {host.bios_strings['system-product-name']}
          </p>
        </Col>
      </Row>
      <br />
      <Row>
        <Col className='text-xs-center'>
          <BlockLink to={`/home?t=VM&s=${vmsFilter}`}>
            <h2>
              {nVms}x <Icon icon='vm' size='lg' />
            </h2>
          </BlockLink>
        </Col>
      </Row>
      <br />
      <Row>
        <Col className='text-xs-center'>
          <h5>{_('hostTitleRamUsage')}</h5>
        </Col>
      </Row>
      <Row>
        <Col smallOffset={1} mediumSize={10}>
          <Usage total={host.memory.size}>
            <UsageElement
              highlight
              tooltip={`${host.productBrand} (${formatSize(vmController.memory.size)})`}
              value={vmController.memory.size}
            />
            {map(vms, vm => (
              <UsageElement
                tooltip={`${vm.name_label} (${formatSize(vm.memory.size)})`}
                key={vm.id}
                value={vm.memory.size}
                href={`#/vms/${vm.id}`}
              />
            ))}
          </Usage>
        </Col>
      </Row>
      <Row>
        <Col className='text-xs-center'>
          <h5>
            {_('memoryHostState', {
              memoryUsed: formatSizeShort(host.memory.usage),
              memoryTotal: formatSizeShort(host.memory.size),
              memoryFree: formatSizeShort(host.memory.size - host.memory.usage),
            })}
          </h5>
        </Col>
      </Row>
      <Row>
        {pool && host.id === pool.master && (
          <Row className='text-xs-center'>
            <Col>
              <h3>
                <span className='tag tag-pill tag-info'>{_('pillMaster')}</span>
              </h3>
            </Col>
          </Row>
        )}
      </Row>
      <Row>
        <Col>
          <h2 className='text-xs-center'>
            <HomeTags
              type='host'
              labels={host.tags}
              onDelete={tag => removeTag(host.id, tag)}
              onAdd={tag => addTag(host.id, tag)}
            />
          </h2>
        </Col>
      </Row>
    </Container>
  )
}
