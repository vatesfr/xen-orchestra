import _ from 'intl'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { editHost } from 'xo'
import { Text } from 'editable'
import { formatSize } from 'utils'

const HOST_COLUMNS = [
  {
    name: _('hostNameLabel'),
    itemRenderer: host => (
      <Link to={`/hosts/${host.id}`}>
        <Text value={host.name_label} onChange={value => editHost(host, { name_label: value })} useLongClick />
      </Link>
    ),
    sortCriteria: 'name_label'
  },
  {
    name: _('hostDescription'),
    itemRenderer: host => <Text value={host.name_description} onChange={value => editHost(host, { name_description: value })} />,
    sortCriteria: 'name_description'
  },
  {
    name: _('hostMemory'),
    itemRenderer: ({ memory }) =>
      <Tooltip content={_('memoryLeftTooltip', {used: Math.round((memory.usage / memory.size) * 100), free: formatSize(memory.size - memory.usage)})}>
        <meter value={memory.usage} min='0' max={memory.size}></meter>
      </Tooltip>,
    sortCriteria: ({ memory }) => memory.usage / memory.size,
    sortOrder: 'desc'
  }
]

export default ({
  hosts
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(hosts)
        ? <SortedTable collection={hosts} columns={HOST_COLUMNS} />
        : <h4 className='text-xs-center'>{_('noHost')}</h4>
      }
    </Col>
  </Row>
</Container>
