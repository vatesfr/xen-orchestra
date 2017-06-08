import _ from 'intl'
import HomeTags from 'home-tags'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Usage, { UsageElement } from 'usage'
import { addTag, removeTag } from 'xo'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObject } from 'selectors'
import { renderXoItemFromId } from 'render-xo-item'

const UsageTooltip = connectStore(() => ({
  vbd: createGetObject((_, { vdi }) => vdi.$VBDs[0])
}))(({ vbd, vdi }) =>
  <span>
    {vdi.name_label} − {formatSize(vdi.usage)}
    {vbd != null && <br />}
    {vbd != null && renderXoItemFromId(vbd.VM)}
  </span>
)

export default ({
  sr,
  vdis,
  vdiSnapshots,
  unmanagedVdis
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
        {map(unmanagedVdis, vdi => <UsageElement
          highlight
          key={vdi.id}
          tooltip={<UsageTooltip vdi={vdi} />}
          value={vdi.usage}
        />)}
        {map(vdis, vdi => <UsageElement
          key={vdi.id}
          tooltip={<UsageTooltip vdi={vdi} />}
          value={vdi.usage}
        />)}
        {map(vdiSnapshots, vdi => <UsageElement
          highlight
          key={vdi.id}
          tooltip={<UsageTooltip vdi={vdi} />}
          value={vdi.usage}
        />)}
      </Usage>
    </Col>
  </Row>
  <Row className='text-xs-center'>
    <Col>
      <h2 className='text-xs-center'>
        <HomeTags type='SR' labels={sr.tags} onDelete={tag => removeTag(sr.id, tag)} onAdd={tag => addTag(sr.id, tag)} />
      </h2>
    </Col>
  </Row>
</Container>
