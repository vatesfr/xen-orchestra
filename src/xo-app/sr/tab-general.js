import _ from 'intl'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Tags from 'tags'
import { addTag, removeTag } from 'xo'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { renderXoItemFromId } from 'render-xo-item'
import Usage, { UsageElement } from 'usage'

export default ({
  sr,
  vdis,
  vdisToVmIds
}) => <Container>
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
  <Row>
    <Col className='text-xs-center'>
      <h5>{formatSize(sr.physical_usage)} {_('srUsed')} ({formatSize(sr.size - sr.physical_usage)} {_('srFree')})</h5>
    </Col>
  </Row>
  <Row>
    <Col smallOffset={1} mediumSize={10}>
      <Usage total={sr.size}>
        {map(vdis, vdi => <UsageElement
          key={vdi.id}
          tooltip={<span>
            {vdi.name_label}
            <br />
            {vdisToVmIds[vdi.id] && renderXoItemFromId(vdisToVmIds[vdi.id])}
          </span>}
          value={vdi.usage}
        />)}
      </Usage>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col>
      <h2 className='text-xs-center'>
        <Tags labels={sr.tags} onDelete={tag => removeTag(sr.id, tag)} onAdd={tag => addTag(sr.id, tag)} />
      </h2>
    </Col>
  </Row>
</Container>
