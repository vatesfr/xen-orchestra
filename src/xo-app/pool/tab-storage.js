import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { editSr, isSrShared, setDefaultSr } from 'xo'
import { formatSize } from 'utils'
import { Text } from 'editable'

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: (sr, pool) => (
      <div>
        <Link to={`/srs/${sr.id}`}>
          <Text value={sr.name_label} onChange={value => editSr(sr, { name_label: value })} useLongClick />
        </Link>
        {pool.default_SR === sr.id && <span className='tag tag-pill tag-info'>{_('defaultSr')}</span>}
      </div>
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
    default: true,
    name: _('srUsage'),
    itemRenderer: sr => sr.size > 1 &&
      <Tooltip content={_('spaceLeftTooltip', {used: Math.round((sr.physical_usage / sr.size) * 100), free: formatSize(sr.size - sr.physical_usage)})}>
        <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90' />
      </Tooltip>,
    sortCriteria: sr => sr.physical_usage / sr.size,
    sortOrder: 'desc'
  },
  {
    name: _('srType'),
    itemRenderer: (sr, pool) => <div>
      {isSrShared(sr) ? _('srShared') : _('srNotShared')}
      <ButtonGroup className='pull-xs-right'>
        {(pool.default_SR !== sr.id && sr.size > 1) && <Tooltip key={sr.id} content={_('setAsDefaultSr')}>
          <ActionRowButton
            handler={setDefaultSr}
            handlerParam={sr}
            icon='disk'
          />
        </Tooltip>}
      </ButtonGroup>
    </div>,
    sortCriteria: isSrShared
  }
]

export default ({
  pool,
  hosts,
  srs
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(srs)
       ? <SortedTable collection={srs} columns={SR_COLUMNS} userData={pool} />
       : <h4 className='text-xs-center'>{_('srNoSr')}</h4>
      }
    </Col>
  </Row>
</Container>
