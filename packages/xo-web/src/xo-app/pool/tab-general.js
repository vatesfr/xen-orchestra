import _ from 'intl'
import find from 'lodash/find'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import sumBy from 'lodash/sumBy'
import HomeTags from 'home-tags'
import { addTag, removeTag } from 'xo'
import Link, { BlockLink } from 'link'
import { Container, Row, Col } from 'grid'
import Usage, { UsageElement } from 'usage'
import { formatSizeShort } from 'utils'
import Tooltip from 'tooltip'

export default ({ hosts, nVms, pool, srs }) => (
  <Container>
    <br />
    <Row className='text-xs-center'>
      <Col mediumSize={4}>
        <Tooltip content={_('displayAllHosts')}>
          <BlockLink to={`/home?s=$pool:${pool.id}&t=host`}>
            <h2>
              {hosts.length}x <Icon icon='host' size='lg' />
            </h2>
          </BlockLink>
        </Tooltip>
      </Col>
      <Col mediumSize={4}>
        <Tooltip content={_('displayAllStorages')}>
          <BlockLink to={`/home?s=$pool:${pool.id}&t=SR`}>
            <h2>
              {srs.length}x <Icon icon='sr' size='lg' />
            </h2>
          </BlockLink>
        </Tooltip>
      </Col>
      <Col mediumSize={4}>
        <Tooltip content={_('displayAllVMs')}>
          <BlockLink to={`/home?s=$pool:${pool.id}`}>
            <h2>
              {nVms}x <Icon icon='vm' size='lg' />
            </h2>
          </BlockLink>
        </Tooltip>
      </Col>
    </Row>
    <br />
    <Row>
      <Col className='text-xs-center'>
        <h5>{_('poolTitleRamUsage')}</h5>
      </Col>
    </Row>
    <Row>
      <Col smallOffset={1} mediumSize={10}>
        <Usage total={sumBy(hosts, 'memory.size')}>
          {map(hosts, host => (
            <UsageElement
              tooltip={`${host.name_label} (${formatSizeShort(host.memory.usage)})`}
              key={host.id}
              value={host.memory.usage}
              href={`#/hosts/${host.id}`}
            />
          ))}
        </Usage>
      </Col>
    </Row>
    <Row>
      <Col className='text-xs-center'>
        <h5>
          {_('poolRamUsage', {
            used: formatSizeShort(sumBy(hosts, 'memory.usage')),
            total: formatSizeShort(sumBy(hosts, 'memory.size')),
            free: formatSizeShort(sumBy(hosts, host => host.memory.size - host.memory.usage)),
          })}
        </h5>
      </Col>
    </Row>
    <Row className='text-xs-center'>
      <Col>
        {_('poolMaster')}{' '}
        <Link to={`/hosts/${pool.master}`}>{find(hosts, host => host.id === pool.master).name_label}</Link>
      </Col>
    </Row>
    <Row className='text-xs-center'>
      <Col>
        <h2>
          <HomeTags
            type='pool'
            labels={pool.tags}
            onDelete={tag => removeTag(pool.id, tag)}
            onAdd={tag => addTag(pool.id, tag)}
          />
        </h2>
      </Col>
    </Row>
  </Container>
)
