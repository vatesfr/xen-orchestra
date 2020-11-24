import _ from 'intl'
import decorate from 'apply-decorators'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { editHost, connectPbd, disconnectPbd, deletePbd, deletePbds } from 'xo'
import { get } from '@xen-orchestra/defined'
import { getIscsiPaths, noop } from 'utils'
import { isEmpty, some } from 'lodash'
import { provideState, injectState } from 'reaclette'
import { Text } from 'editable'

const forgetHost = pbd =>
  confirm({
    title: _('forgetHostFromSrModalTitle'),
    body: _('forgetHostFromSrModalMessage'),
  }).then(() => deletePbd(pbd), noop)

const forgetHosts = pbds =>
  confirm({
    title: _('forgetHostsFromSrModalTitle', { nPbds: pbds.length }),
    body: _('forgetHostsFromSrModalMessage', { nPbds: pbds.length }),
  }).then(() => deletePbds(pbds), noop)

const HOST_COLUMNS = [
  {
    name: _('hostNameLabel'),
    itemRenderer: (pbd, hosts) => {
      const host = hosts[pbd.host]
      return (
        <Link to={`/hosts/${host.id}`}>
          <Text value={host.name_label} onChange={value => editHost(host, { name_label: value })} useLongClick />
        </Link>
      )
    },
    sortCriteria: (pbd, hosts) => hosts[pbd.host].name_label,
  },
  {
    name: _('hostDescription'),
    itemRenderer: (pbd, hosts) => {
      const host = hosts[pbd.host]
      return <Text value={host.name_description} onChange={value => editHost(host, { name_description: value })} />
    },
    sortCriteria: (pbd, hosts) => hosts[pbd.host].name_description,
  },
  {
    name: _('pbdDetails'),
    itemRenderer: ({ device_config: deviceConfig }) => {
      const keys = Object.keys(deviceConfig)
      return (
        <ul className='list-unstyled'>
          {keys.map(key => (
            <li key={key}>{_.keyValue(key, deviceConfig[key])}</li>
          ))}
        </ul>
      )
    },
  },
  {
    name: _('pbdStatus'),
    itemRenderer: pbd => (
      <StateButton
        disabledLabel={_('pbdStatusDisconnected')}
        disabledHandler={connectPbd}
        disabledTooltip={_('pbdConnect')}
        enabledLabel={_('pbdStatusConnected')}
        enabledHandler={disconnectPbd}
        enabledTooltip={_('pbdDisconnect')}
        handlerParam={pbd}
        state={pbd.attached}
      />
    ),
    sortCriteria: 'attached',
  },
]

const HOST_ACTIONS = [
  {
    disabled: pbds => some(pbds, 'attached'),
    handler: forgetHosts,
    icon: 'sr-forget',
    individualDisabled: pbd => pbd.attached,
    individualHandler: forgetHost,
    label: _('pbdForget'),
  },
]

const HOST_WITH_PATHS_COLUMNS = [
  ...HOST_COLUMNS,
  {
    name: _('paths'),
    itemRenderer: (pbd, hosts) => {
      if (!pbd.attached) {
        return _('pbdDisconnected')
      }

      if (!get(() => hosts[pbd.host].multipathing)) {
        return _('multipathingDisabled')
      }

      const [nActives, nPaths] = getIscsiPaths(pbd)
      const nSessions = pbd.otherConfig.iscsi_sessions
      return (
        <span>
          {nActives !== undefined &&
            nPaths !== undefined &&
            _('hostMultipathingPaths', {
              nActives,
              nPaths,
            })}{' '}
          {nSessions !== undefined && _('iscsiSessions', { nSessions })}
        </span>
      )
    },
    sortCriteria: (pbd, hosts) => get(() => hosts[pbd.host].multipathing),
  },
]

export default decorate([
  provideState({
    computed: {
      columns: (_, { sr }) => (sr.sm_config.multipathable ? HOST_WITH_PATHS_COLUMNS : HOST_COLUMNS),
    },
  }),
  injectState,
  ({ state, hosts, pbds }) => (
    <Container>
      <Row>
        <Col>
          {!isEmpty(hosts) ? (
            <SortedTable
              actions={HOST_ACTIONS}
              collection={pbds}
              columns={state.columns}
              stateUrlParam='s'
              userData={hosts}
            />
          ) : (
            <h4 className='text-xs-center'>{_('noHost')}</h4>
          )}
        </Col>
      </Row>
    </Container>
  ),
])
