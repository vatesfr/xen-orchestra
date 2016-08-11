import _ from 'intl'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import sumBy from 'lodash/sumBy'
import Tags from 'tags'
import { addTag, removeTag } from 'xo'
import { BlockLink } from 'link'
import { Container, Row, Col } from 'grid'
import Usage, { UsageElement } from 'usage'
import { formatSize } from 'utils'

export default ({
  hosts,
  nVms,
  pool,
  srs
}) => <Container>
  <br />
  <Row className='text-xs-center'>
    <Col mediumSize={4}>
      <BlockLink to={`/pools/${pool.id}/hosts`}><h2>{hosts.length}x <Icon icon='host' size='lg' /></h2></BlockLink>
    </Col>
    <Col mediumSize={4}>
      <BlockLink to={`/pools/${pool.id}/storage`}><h2>{srs.length}x <Icon icon='sr' size='lg' /></h2></BlockLink>
    </Col>
    <Col mediumSize={4}>
      <BlockLink to={`/home?s=$pool:${pool.id}`}><h2>{nVms}x <Icon icon='vm' size='lg' /></h2></BlockLink>
    </Col>
  </Row>
  <br />
  <Row>
    <Col className='text-xs-center'>
      <h5>Pool RAM usage:</h5>
    </Col>
  </Row>
  <Row>
    <Col smallOffset={1} mediumSize={10}>
      <Usage total={sumBy(hosts, 'memory.size')}>
        {map(hosts, host => <UsageElement
          tooltip={host.name_label}
          key={host.id}
          value={host.memory.usage}
          href={`#/hosts/${host.id}`}
        />)}
      </Usage>
    </Col>
  </Row>
  <Row>
    <Col className='text-xs-center'>
      <h5>{_('poolRamUsage', {used: formatSize(sumBy(hosts, 'memory.usage')), total: formatSize(sumBy(hosts, 'memory.size'))})}</h5>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col>
      <h2 className='text-xs-center'>
        <Tags labels={pool.tags} onDelete={tag => removeTag(pool.id, tag)} onAdd={tag => addTag(pool.id, tag)} />
      </h2>
    </Col>
  </Row>
</Container>
