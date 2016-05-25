import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { addTag, removeTag } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'

export default ({
  sr,
  vdis
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
  <Row>
    <Col mediumSize={12} className='text-xs-center'>
      <h5>Disk usage:</h5>
    </Col>
  </Row>
  <Row>
    <Col smallOffset={1} mediumSize={10}>
      <span className='progress'>
        {map(vdis, vdi => (
          <Tooltip key={vdi.id} content={vdi.name_label}>
            <span
              key={vdi.id}
              className='progress-object'
              style={{ width: (vdi.usage / sr.size) * 100 + '%' }}>
            </span>
          </Tooltip>
          )
        )}
      </span>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col mediumSize={12}>
      <h2 className='text-xs-center'>
        <Tags labels={sr.tags} onDelete={tag => removeTag(sr.id, tag)} onAdd={tag => addTag(sr.id, tag)} />
      </h2>
    </Col>
  </Row>
</div>
