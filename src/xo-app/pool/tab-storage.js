import _ from 'intl'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { editSr, isSrShared } from 'xo'
import { formatSize } from 'utils'
import { Text } from 'editable'

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: sr => (
      <Link to={`/srs/${sr.id}`}>
        <Text value={sr.name_label} onChange={value => editSr(sr, { name_label: value })} useLongClick />
      </Link>
    ),
    sortCriteria: 'name_label'
  },
  {
    name: _('srFormat'),
    itemRenderer: sr => sr.SR_type,
    sortCriteria: 'SR_type'
  },
  {
    name: _('srSize'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: 'size'
  },
  {
    name: _('srUsage'),
    itemRenderer: sr => sr.size > 1 &&
      <Tooltip content={_('spaceLeftTooltip', {used: Math.round((sr.physical_usage / sr.size) * 100), free: formatSize(sr.size - sr.physical_usage)})}>
        <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90'></meter>
      </Tooltip>,
    sortCriteria: sr => sr.physical_usage / sr.size,
    sortOrder: 'desc'
  },
  {
    name: _('srType'),
    itemRenderer: sr => isSrShared(sr) ? _('srShared') : _('srNotShared'),
    sortCriteria: isSrShared
  }
]

export default ({
  hosts,
  srs
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(srs)
       ? <SortedTable collection={srs} columns={SR_COLUMNS} defaultColumn={3} />
       : <h4 className='text-xs-center'>{_('srNoSr')}</h4>
      }
    </Col>
  </Row>
</Container>
