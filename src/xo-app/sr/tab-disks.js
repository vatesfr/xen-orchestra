import ActionRow from 'action-row-button'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import { Container, Row, Col } from 'grid'
import { Text } from 'editable'
import { deleteVdi, editVdi } from 'xo'
import { formatSize } from 'utils'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
        {' '}
        {vdi.type === 'VDI-snapshot' &&
          <span className='tag tag-info'>
            <Icon icon='vm-snapshot' />
          </span>
        }
      </span>
    ),
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
    )
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('vdiAction'),
    itemRenderer: vdi => (
      <ActionRow
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
      />
    )
  }
]

// ===================================================================

export default ({
  sr,
  vdis
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(vdis)
        ? <SortedTable collection={vdis} columns={COLUMNS} defaultColumn={0} />
        : <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
      }
    </Col>
  </Row>
</Container>
