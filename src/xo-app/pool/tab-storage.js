import _ from 'intl'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { Container, Row, Col } from 'grid'
import { editSr } from 'xo'
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
    itemRenderer: sr => sr.size > 1 && <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90'></meter>,
    sortCriteria: sr => sr.physical_usage / sr.size
  },
  {
    name: _('srType'),
    itemRenderer: sr => sr.$PBDs.length > 1 ? _('srShared') : _('srNotShared'),
    sortCriteria: sr => sr.$PBDs.length > 1
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
