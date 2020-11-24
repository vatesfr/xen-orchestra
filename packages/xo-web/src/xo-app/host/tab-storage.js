import _ from 'intl'
import Link from 'link'
import map from 'lodash/map'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { connectPbd, disconnectPbd, deletePbd, deletePbds, editSr, isSrShared } from 'xo'
import { connectStore, formatSize, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { isEmpty, some } from 'lodash'
import { TabButtonLink } from 'tab-button'
import { Text } from 'editable'

const forgetSr = ({ pbdId }) =>
  confirm({
    title: _('forgetSrFromHostModalTitle'),
    body: _('forgetSrFromHostModalMessage'),
  }).then(() => deletePbd(pbdId), noop)

const forgetSrs = pbds =>
  confirm({
    title: _('forgetSrsFromHostModalTitle', { nPbds: pbds.length }),
    body: _('forgetSrsFromHostModalMessage', { nPbds: pbds.length }),
  }).then(() => deletePbds(pbds), noop)

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: storage => (
      <Link to={`/srs/${storage.id}`}>
        <Text onChange={nameLabel => editSr(storage.id, { nameLabel })} useLongClick value={storage.nameLabel} />
      </Link>
    ),
    sortCriteria: 'nameLabel',
  },
  {
    name: _('srFormat'),
    itemRenderer: storage => storage.format,
    sortCriteria: 'format',
  },
  {
    name: _('srSize'),
    itemRenderer: storage => formatSize(storage.size),
    sortCriteria: 'size',
  },
  {
    default: true,
    name: _('srUsage'),
    itemRenderer: storage =>
      storage.size !== 0 && (
        <Tooltip
          content={_('spaceLeftTooltip', {
            used: storage.usagePercentage,
            free: formatSize(storage.free),
          })}
        >
          <meter value={storage.usagePercentage} min='0' max='100' optimum='40' low='80' high='90' />
        </Tooltip>
      ),
    sortCriteria: storage => storage.usagePercentage,
    sortOrder: 'desc',
  },
  {
    name: _('srType'),
    itemRenderer: storage => (storage.shared ? _('srShared') : _('srNotShared')),
    sortCriteria: 'shared',
  },
  {
    name: _('pbdDetails'),
    itemRenderer: ({ pbdDeviceConfig }) => {
      const keys = Object.keys(pbdDeviceConfig)
      return (
        <ul className='list-unstyled'>
          {keys.map(key => (
            <li key={key}>{_.keyValue(key, pbdDeviceConfig[key])}</li>
          ))}
        </ul>
      )
    },
  },
  {
    name: _('pbdStatus'),
    itemRenderer: storage => (
      <StateButton
        disabledLabel={_('pbdStatusDisconnected')}
        disabledHandler={connectPbd}
        disabledTooltip={_('pbdConnect')}
        enabledLabel={_('pbdStatusConnected')}
        enabledHandler={disconnectPbd}
        enabledTooltip={_('pbdDisconnect')}
        handlerParam={storage.pbdId}
        state={storage.attached}
      />
    ),
  },
]

const SR_ACTIONS = [
  {
    disabled: selectedItems => some(selectedItems, 'attached'),
    handler: selectedItems => forgetSrs(map(selectedItems, 'pbdId')),
    icon: 'sr-forget',
    individualDisabled: storage => storage.attached,
    individualHandler: forgetSr,
    label: _('pbdForget'),
    level: 'danger',
  },
]

export default connectStore(() => {
  const pbds = createGetObjectsOfType('PBD').pick((_, props) => props.host.$PBDs)
  const srs = createGetObjectsOfType('SR').pick(createSelector(pbds, pbds => map(pbds, pbd => pbd.SR)))

  const storages = createSelector(pbds, srs, (pbds, srs) =>
    map(pbds, pbd => {
      const sr = srs[pbd.SR]
      const { physical_usage: usage, size } = sr

      return {
        attached: pbd.attached,
        pbdDeviceConfig: pbd.device_config,
        format: sr.SR_type,
        free: size > 0 ? size - usage : 0,
        id: sr.id,
        nameLabel: sr.name_label,
        pbdId: pbd.id,
        shared: isSrShared(sr),
        size: size > 0 ? size : 0,
        usagePercentage: size > 0 && Math.round((100 * usage) / size),
      }
    })
  )

  return { storages }
})(({ host, storages }) => (
  <Container>
    <Row>
      <Col className='text-xs-right'>
        <TabButtonLink icon='add' labelId='addSrDeviceButton' to={`/new/sr?host=${host.id}`} />
      </Col>
    </Row>
    <Row>
      <Col>
        {isEmpty(storages) ? (
          <h4 className='text-xs-center'>{_('pbdNoSr')}</h4>
        ) : (
          <SortedTable actions={SR_ACTIONS} columns={SR_COLUMNS} collection={storages} stateUrlParam='s' />
        )}
      </Col>
    </Row>
  </Container>
))
