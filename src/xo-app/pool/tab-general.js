import Icon from 'icon'
import React from 'react'
import Tags from 'tags'
import { addTag, removeTag } from 'xo'
import { Row, Col } from 'grid'

export default ({
  pool,
  srs,
  hosts,
  vms
}) => <div>
  <Row className='text-xs-center'>
    <Col mediumSize={4}>
      <h2>{hosts.length}x <Icon icon='host' size='lg' /></h2>
    </Col>
    <Col mediumSize={4}>
      <h2>{srs.length}x <Icon icon='sr' size='lg' /></h2>
    </Col>
    <Col mediumSize={4}>
      <h2>{vms.length}x <Icon icon='vm' size='lg' /></h2>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col smallSize={12}>
      <h2 className='text-xs-center'>
        <Tags labels={pool.tags} onDelete={tag => removeTag(pool.id, tag)} onAdd={tag => addTag(pool.id, tag)} />
      </h2>
    </Col>
  </Row>
</div>
