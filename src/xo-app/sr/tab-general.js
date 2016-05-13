import Icon from 'icon'
import React from 'react'
import Tags from 'tags'
import { addTag, removeTag } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'

export default ({
  sr
}) => <div>
  <Row className='text-xs-center'>
    <Col mediumSize={4}>
      <h2>{sr.VDIs.length}x <Icon icon='disk' size='lg' /></h2>
    </Col>
    <Col mediumSize={4}>
      <h2>{formatSize(sr.size)} <Icon icon='sr' size='lg' /></h2>
      <p>Type: {sr.SR_type}</p>
    </Col>
    <Col mediumSize={4}>
      <h2>{sr.$PBDs.length}x <Icon icon='host' size='lg' /></h2>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col smallSize={12}>
      <h2 className='text-xs-center'>
        <Tags labels={sr.tags} onDelete={tag => removeTag(sr.id, tag)} onAdd={tag => addTag(sr.id, tag)} />
      </h2>
    </Col>
  </Row>
</div>
