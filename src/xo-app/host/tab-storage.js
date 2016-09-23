import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import map from 'lodash/map'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { connectPbd, disconnectPbd, deletePbd, editSr, isSrShared } from 'xo'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { TabButtonLink } from 'tab-button'
import { Text } from 'editable'

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: storage =>
      <Link to={`/srs/${storage.id}`}>
        <Text
          onChange={nameLabel => editSr(storage.id, { nameLabel })}
          useLongClick
          value={storage.nameLabel}
        />
      </Link>,
    sortCriteria: 'nameLabel'
  },
  {
    name: _('srFormat'),
    itemRenderer: storage => storage.format,
    sortCriteria: 'format'
  },
  {
    name: _('srSize'),
    itemRenderer: storage => formatSize(storage.size),
    sortCriteria: 'size'
  },
  {
    default: true,
    name: _('srUsage'),
    itemRenderer: storage => storage.size !== 0 &&
      <Tooltip content={_('spaceLeftTooltip', {used: storage.usagePercentage, free: formatSize(storage.free)})}>
        <meter value={storage.usagePercentage} min='0' max='100' optimum='40' low='80' high='90' />
      </Tooltip>,
    sortCriteria: storage => storage.usagePercentage,
    sortOrder: 'desc'
  },
  {
    name: _('srType'),
    itemRenderer: storage => storage.shared ? _('srShared') : _('srNotShared'),
    sortCriteria: 'shared'
  },
  {
    name: _('pbdStatus'),
    itemRenderer: storage => storage.attached
      ? <span>
        <span className='tag tag-success'>
            {_('pbdStatusConnected')}
        </span>
        <ButtonGroup className='pull-xs-right'>
          <ActionRowButton
            btnStyle='default'
            handler={disconnectPbd}
            handlerParam={storage.pbdId}
            icon='disconnect'
            tooltip={_('pbdDisconnect')}
          />
        </ButtonGroup>
      </span>
      : <span>
        <span className='tag tag-default'>
          {_('pbdStatusDisconnected')}
        </span>
        <ButtonGroup className='pull-xs-right'>
          <ActionRowButton
            btnStyle='default'
            handler={connectPbd}
            handlerParam={storage.pbdId}
            icon='connect'
            tooltip={_('pbdConnect')}
          />
          <ActionRowButton
            btnStyle='default'
            handler={deletePbd}
            handlerParam={storage.pbdId}
            icon='sr-forget'
            tooltip={_('pbdForget')}
          />
        </ButtonGroup>
      </span>
  }
]

export default connectStore(() => {
  const pbds = createGetObjectsOfType('PBD').pick(
    (_, props) => props.host.$PBDs
  )
  const srs = createGetObjectsOfType('SR').pick(
    createSelector(
      pbds,
      pbds => map(pbds, pbd => pbd.SR)
    )
  )

  const storages = createSelector(
    pbds,
    srs,
    (pbds, srs) => map(pbds, pbd => {
      const sr = srs[pbd.SR]
      const { physical_usage: usage, size } = sr

      return {
        attached: pbd.attached,
        format: sr.SR_type,
        free: size > 0 ? size - usage : 0,
        id: sr.id,
        nameLabel: sr.name_label,
        pbdId: pbd.id,
        shared: isSrShared(sr),
        size: size > 0 ? size : 0,
        usagePercentage: size > 0 && Math.round(100 * usage / size)
      }
    })
  )

  return { storages }
})(({ host, storages }) =>
  <Container>
    <Row>
      <Col className='text-xs-right'>
        <TabButtonLink
          icon='add'
          labelId='addSrDeviceButton'
          to={`/new/sr?host=${host.id}`}
        />
      </Col>
    </Row>
    <Row>
      <Col>
        {isEmpty(storages)
          ? <h4 className='text-xs-center'>{_('pbdNoSr')}</h4>
          : <SortedTable columns={SR_COLUMNS} collection={storages} />
        }
      </Col>
    </Row>
  </Container>
)
