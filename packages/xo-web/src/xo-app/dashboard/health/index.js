import _ from 'intl'
import Component from 'base-component'
import decorate from 'apply-decorators'
import fromCallback from 'promise-toolbox/fromCallback'
import { get as getDefined } from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import xml2js from 'xml2js'
import { Network, Sr, Vm } from 'render-xo-item'
import { SelectPool } from 'select-objects'
import { Container, Row, Col } from 'grid'
import { Card, CardHeader, CardBlock } from 'card'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { flatten, forEach, get, includes, isEmpty, map, mapValues } from 'lodash'
import { connectStore, formatSize, noop, resolveIds } from 'utils'
import {
  deleteMessage,
  deleteMessages,
  deleteOrphanedVdis,
  deleteVbd,
  deleteVbds,
  deleteVdi,
  deleteVm,
  deleteVms,
  isSrWritable,
} from 'xo'
import {
  areObjectsFetched,
  createCollectionWrapper,
  createFilter,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
  createSort,
} from 'selectors'

const SrColContainer = connectStore(() => ({
  container: createGetObject(),
}))(
  ({ container }) =>
    container !== undefined && <Link to={`${container.type}s/${container.id}`}>{container.name_label}</Link>
)

const VmColContainer = connectStore(() => ({
  container: createGetObject(),
}))(({ container }) => <span>{container.name_label}</span>)

const AlarmColObject = connectStore(() => ({
  object: createGetObject(),
}))(({ object }) => {
  if (!object) {
    return null
  }

  switch (object.type) {
    case 'VM':
      return <Link to={`vms/${object.id}`}>{object.name_label}</Link>
    case 'VM-controller':
      return <Link to={`hosts/${object.$container}`}>{object.name_label}</Link>
    case 'host':
      return <Link to={`hosts/${object.id}`}>{object.name_label}</Link>
    default:
      return null
  }
})

const AlarmColPool = connectStore(() => ({
  pool: createGetObject(),
}))(({ pool }) => {
  if (!pool) {
    return null
  }
  return <Link to={`pools/${pool.id}`}>{pool.name_label}</Link>
})

const DUPLICATED_MAC_ADDRESSES_COLUMNS = [
  {
    name: _('vifMacLabel'),
    itemRenderer: macAddress => <pre>{macAddress}</pre>,
    sortCriteria: macAddress => macAddress,
  },
  {
    name: _('vifs'),
    itemRenderer: (macAddress, { vifsByMac }) => (
      <div>
        {vifsByMac[macAddress].map(vif => (
          <Row key={vif.id}>
            <Col>
              {_('vifOnVmWithNetwork', {
                network: <Network id={vif.$network} />,
                vifDevice: vif.device,
                vm: <Vm id={vif.$VM} link />,
              })}
            </Col>
          </Row>
        ))}
      </div>
    ),
  },
]

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: sr => sr.name_label,
    sortCriteria: sr => sr.name_label,
  },
  {
    name: _('srPool'),
    itemRenderer: sr => <SrColContainer id={sr.$container} />,
  },
  {
    name: _('srFormat'),
    itemRenderer: sr => sr.SR_type,
    sortCriteria: sr => sr.SR_type,
  },
  {
    name: _('srSize'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: sr => sr.size,
  },
  {
    default: true,
    name: _('srUsage'),
    itemRenderer: sr =>
      sr.size > 1 && (
        <Tooltip
          content={_('spaceLeftTooltip', {
            used: Math.round((sr.physical_usage / sr.size) * 100),
            free: formatSize(sr.size - sr.physical_usage),
          })}
        >
          <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90' />
        </Tooltip>
      ),
    sortCriteria: sr => sr.physical_usage / sr.size,
    sortOrder: 'desc',
  },
]

const ORPHANED_VDI_COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        {vdi.name_label}
        {vdi.type === 'VDI-snapshot' && (
          <span className='tag tag-info ml-1'>
            <Icon icon='vm-snapshot' />
          </span>
        )}
      </span>
    ),
    sortCriteria: vdi => vdi.name_label,
    default: true,
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => vdi.name_description,
    sortCriteria: vdi => vdi.name_description,
  },
  {
    name: _('snapshotDate'),
    itemRenderer: vdi => {
      if (vdi.type === 'VDI') {
        // Normal VDIs don't have a creation date
        return null
      }

      return (
        <span>
          <FormattedTime
            day='numeric'
            hour='numeric'
            minute='numeric'
            month='long'
            value={vdi.snapshot_time * 1000}
            year='numeric'
          />{' '}
          (<FormattedRelative value={vdi.snapshot_time * 1000} />)
        </span>
      )
    },
    sortCriteria: vdi => vdi.snapshot_time,
    sortOrder: 'desc',
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size,
  },
  {
    name: _('vdiSr'),
    itemRenderer: vdi => <Sr id={vdi.$SR} link spaceLeft={false} />,
  },
]

const ORPHAN_VDI_FILTERS = {
  filterOnlySnapshots: 'type:VDI-snapshot',
  filterOnlyRegular: 'type:/^VDI$/',
}

const ORPHANED_VDI_ACTIONS = [
  {
    handler: deleteOrphanedVdis,
    individualHandler: deleteVdi,
    individualLabel: _('deleteOrphanedVdi'),
    icon: 'delete',
    label: _('deleteSelectedOrphanedVdis'),
    level: 'danger',
  },
]

const CONTROL_DOMAIN_VDIS_ACTIONS = [
  {
    handler: deleteVbds,
    individualHandler: deleteVbd,
    icon: 'vdi-forget',
    label: _('vdiForget'),
    level: 'danger',
  },
]

const AttachedVdisTable = decorate([
  connectStore({
    pools: createGetObjectsOfType('pool'),
    srs: createGetObjectsOfType('SR'),
    vbds: createGetObjectsOfType('VBD').pick(
      createSelector(
        createFilter(createGetObjectsOfType('VM-controller'), (_, props) => props.poolPredicate),
        createCollectionWrapper(vmControllers => flatten(map(vmControllers, '$VBDs')))
      )
    ),
    vdis: createGetObjectsOfType('VDI'),
    vdiSnapshots: createGetObjectsOfType('VDI-snapshot'),
  }),
  ({ columns, rowTransform }) =>
    ({ pools, srs, vbds, vdis, vdiSnapshots }) =>
      (
        <NoObjects
          actions={CONTROL_DOMAIN_VDIS_ACTIONS}
          collection={vbds}
          columns={columns}
          component={SortedTable}
          data-pools={pools}
          data-srs={srs}
          data-vdis={vdis}
          data-vdiSnapshots={vdiSnapshots}
          emptyMessage={_('noControlDomainVdis')}
          rowTransform={rowTransform}
          stateUrlParam='s_controldomain'
        />
      ),
  {
    columns: [
      {
        name: _('vdiNameLabel'),
        itemRenderer: ({ vdi }) => (
          <span>
            {vdi.name_label}
            {vdi.type === 'VDI-snapshot' && [' ', <Icon icon='vm-snapshot' key='1' />]}
          </span>
        ),
        sortCriteria: ({ vdi }) => vdi.name_label,
      },
      {
        name: _('vdiNameDescription'),
        itemRenderer: ({ vdi }) => vdi.name_description,
        sortCriteria: ({ vdi }) => vdi.name_description,
      },
      {
        name: _('vdiPool'),
        itemRenderer: ({ pool }) =>
          pool === undefined ? null : <Link to={`pools/${pool.id}`}>{pool.name_label}</Link>,
        sortCriteria: ({ pool }) => pool != null && pool.name_label,
      },
      {
        name: _('vdiSize'),
        itemRenderer: ({ vdi }) => formatSize(vdi.size),
        sortCriteria: ({ vdi }) => vdi.size,
      },
      {
        name: _('vdiSr'),
        itemRenderer: ({ sr }) => (sr === undefined ? null : <Sr id={sr.id} link spaceLeft={false} />),
        sortCriteria: ({ sr }) => sr != null && sr.name_label,
      },
    ],
    rowTransform: (vbd, { pools, srs, vdis, vdiSnapshots }) => {
      const vdi = vdis[vbd.VDI] || vdiSnapshots[vbd.VDI]

      return {
        id: vbd.id,
        vbd,
        vdi,
        sr: srs[vdi.$SR],
        pool: pools[vbd.$poolId],
      }
    },
  },
])

const VM_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: vm => (
      <span>
        <FormattedTime
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          value={vm.snapshot_time * 1000}
          year='numeric'
        />{' '}
        (<FormattedRelative value={vm.snapshot_time * 1000} />)
      </span>
    ),
    sortCriteria: vm => vm.snapshot_time,
    sortOrder: 'desc',
  },
  {
    name: _('vmNameLabel'),
    itemRenderer: vm => vm.name_label,
    sortCriteria: vm => vm.name_label,
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description,
  },
  {
    name: _('vmContainer'),
    itemRenderer: vm => <VmColContainer id={vm.$container} />,
  },
]

const VM_ACTIONS = [
  {
    handler: deleteVms,
    individualHandler: deleteVm,
    individualLabel: _('deleteVmLabel'),
    icon: 'delete',
    label: _('deleteSelectedVmsLabel'),
    level: 'danger',
  },
]

const TOO_MANY_SNAPSHOT_COLUMNS = [
  {
    name: _('vmNameLabel'),
    itemRenderer: vm => <Link to={`vms/${vm.id}/snapshots`}>{vm.name_label}</Link>,
    sortCriteria: vm => vm.name_label,
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description,
  },
  {
    name: _('vmContainer'),
    itemRenderer: vm => <VmColContainer id={vm.$container} />,
  },
  {
    default: true,
    name: _('numberOfSnapshots'),
    itemRenderer: vm => vm.snapshots.length,
    sortOrder: 'desc',
  },
]

const GUEST_TOOLS_COLUMNS = [
  {
    name: _('vmNameLabel'),
    itemRenderer: vm => <Link to={`vms/${vm.id}`}>{vm.name_label}</Link>,
    sortCriteria: vm => vm.name_label,
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description,
  },
  {
    name: _('vmContainer'),
    itemRenderer: vm => <VmColContainer id={vm.$container} />,
  },
  {
    default: true,
    name: _('guestToolStatusColumn'),
    itemRenderer: vm => {
      if (!vm.pvDriversDetected) {
        return _('noToolsDetected')
      }
      if (!vm.managementAgentDetected) {
        return _('managementAgentNotDetected')
      }

      const version = getDefined(() => vm.pvDriversVersion.split('.')[0]) > 0 ? vm.pvDriversVersion : ''

      return _('managementAgentOutOfDate', {
        version,
      })
    },
    sortCriteria: vm => (!vm.pvDriversDetected ? 0 : !vm.managementAgentDetected ? 1 : 2),
  },
]

const ALARM_COLUMNS = [
  {
    name: _('alarmDate'),
    itemRenderer: message => (
      <span>
        <FormattedTime
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          value={message.time * 1000}
          year='numeric'
        />{' '}
        (<FormattedRelative value={message.time * 1000} />)
      </span>
    ),
    sortCriteria: message => message.time,
    sortOrder: 'desc',
  },
  {
    name: _('alarmContent'),
    itemRenderer: ({ formatted, body }) =>
      formatted ? (
        <div>
          <Row>
            <Col mediumSize={6}>
              <strong>{formatted.name}</strong>
            </Col>
            <Col mediumSize={6}>{formatted.value}</Col>
          </Row>
          <br />
          {map(formatted.alarmAttributes, (value, label) => (
            <Row>
              <Col mediumSize={6}>{label}</Col>
              <Col mediumSize={6}>{value}</Col>
            </Row>
          ))}
        </div>
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{body}</pre>
      ),
    sortCriteria: message => message.body,
  },
  {
    name: _('alarmObject'),
    itemRenderer: message => <AlarmColObject id={message.$object} />,
  },
  {
    name: _('alarmPool'),
    itemRenderer: message => <AlarmColPool id={message.$pool} />,
  },
]

const ALARM_ACTIONS = [
  {
    handler: deleteMessages,
    individualHandler: deleteMessage,
    individualLabel: _('logDelete'),
    icon: 'delete',
    label: _('logsDelete'),
    level: 'danger',
  },
]

const HANDLED_VDI_TYPES = new Set(['system', 'user', 'ephemeral'])

@connectStore(() => {
  const getSrs = createGetObjectsOfType('SR')
  const getOrphanVdis = createSort(
    createFilter(
      createSelector(createGetObjectsOfType('VDI'), createGetObjectsOfType('VDI-snapshot'), (vdis, snapshotVdis) =>
        Object.assign({}, vdis, snapshotVdis)
      ),
      createSelector(getSrs, srs => vdi => {
        if (vdi.$VBDs.length !== 0 || !HANDLED_VDI_TYPES.has(vdi.VDI_type)) {
          return false
        }

        const sr = srs[vdi.$SR]
        return (
          sr !== undefined &&
          // Condition copied from iso-device.js
          sr.SR_type !== 'iso' &&
          (sr.SR_type !== 'udev' || !sr.size)
        )
      })
    )
  )
  const getOrphanVmSnapshots = createGetObjectsOfType('VM-snapshot')
    .filter([snapshot => !snapshot.$snapshot_of])
    .sort()
  const getVms = createGetObjectsOfType('VM')
  const MAX_HEALTHY_SNAPSHOT_COUNT = 5
  const getTooManySnapshotsVms = getVms.filter([vm => vm.snapshots.length > MAX_HEALTHY_SNAPSHOT_COUNT]).sort()
  const getGuestToolsVms = getVms
    .filter([vm => vm.power_state === 'Running' && (!vm.managementAgentDetected || !vm.pvDriversUpToDate)])
    .sort()
  const getUserSrs = getSrs.filter([isSrWritable])
  const getAlertMessages = createGetObjectsOfType('message').filter([message => message.name === 'ALARM'])
  const getVifsByMac = createGetObjectsOfType('VIF')
    .pick(
      createCollectionWrapper(
        createSelector(getVms, vms => {
          const vifs = []
          forEach(vms, ({ blockedOperations: ops, VIFs }) => {
            if (!('start' in ops && 'start_on' in ops)) {
              Array.prototype.push.apply(vifs, VIFs)
            }
          })
          return vifs.sort()
        })
      )
    )
    .groupBy('MAC')

  return {
    alertMessages: getAlertMessages,
    areObjectsFetched,
    orphanVdis: getOrphanVdis,
    orphanVmSnapshots: getOrphanVmSnapshots,
    tooManySnapshotsVms: getTooManySnapshotsVms,
    guestToolsVms: getGuestToolsVms,
    userSrs: getUserSrs,
    vifsByMac: getVifsByMac,
  }
})
export default class Health extends Component {
  state = {
    pools: [],
  }

  componentWillReceiveProps(props) {
    if (props.alertMessages !== this.props.alertMessages) {
      this._updateAlarms(props)
    }
  }

  componentDidMount() {
    this._updateAlarms(this.props)
  }

  _updateAlarms = props => {
    Promise.all(
      map(props.alertMessages, ({ body }, id) => {
        const matches = /^value:\s*([0-9.]+)\s+config:\s*([^]*)$/.exec(body)
        if (!matches) {
          return
        }

        const [, value, xml] = matches
        return fromCallback(xml2js.parseString, xml).then(result => {
          const object = mapValues(result && result.variable, value => get(value, '[0].$.value'))
          if (!object || !object.name) {
            return
          }

          const { name, ...alarmAttributes } = object

          return { name, value, alarmAttributes, id }
        }, noop)
      })
    ).then(formattedMessages => {
      this.setState({
        messages: map(formattedMessages, ({ id, ...formattedMessage }) => ({
          formatted: formattedMessage,
          ...props.alertMessages[id],
        })),
      })
    }, noop)
  }

  _getSrUrl = sr => `srs/${sr.id}`

  _getDuplicatedMacAddresses = createCollectionWrapper(
    createSelector(
      () => this._getVifsByMac(),
      vifsByMac => {
        const duplicatedMacAddresses = []
        for (const [macAddress, vifs] of Object.entries(vifsByMac)) {
          if (vifs.length > 1) {
            duplicatedMacAddresses.push(macAddress)
          }
        }
        return duplicatedMacAddresses.sort()
      }
    )
  )

  _getPoolIds = createCollectionWrapper(createSelector(() => this.state.pools, resolveIds))

  _getPoolPredicate = createSelector(this._getPoolIds, poolIds =>
    isEmpty(poolIds) ? undefined : item => includes(poolIds, item.$pool)
  )

  _getUserSrs = createFilter(() => this.props.userSrs, this._getPoolPredicate)

  _getOrphanVdis = createFilter(() => this.props.orphanVdis, this._getPoolPredicate)

  _getOrphanVmSnapshots = createFilter(() => this.props.orphanVmSnapshots, this._getPoolPredicate)

  _getTooManySnapshotsVms = createFilter(() => this.props.tooManySnapshotsVms, this._getPoolPredicate)

  _getGuestToolsVms = createFilter(() => this.props.guestToolsVms, this._getPoolPredicate)

  _getAlertMessages = createFilter(() => this.props.alertMessages, this._getPoolPredicate)

  _getMessages = createFilter(() => this.state.messages, this._getPoolPredicate)

  _getVifsByMac = createFilter(
    () => this.props.vifsByMac,
    createSelector(this._getPoolIds, poolIds =>
      isEmpty(poolIds) ? undefined : vifs => vifs.some(vif => poolIds.includes(vif.$pool))
    )
  )

  render() {
    const { props, state } = this

    const duplicatedMacAddresses = this._getDuplicatedMacAddresses()
    const userSrs = this._getUserSrs()
    const orphanVdis = this._getOrphanVdis()

    return (
      <Container>
        <Row className='mb-1'>
          <SelectPool multi onChange={this.linkState('pools')} value={state.pools} />
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('srStatePanel')}
              </CardHeader>
              <CardBlock>
                <NoObjects collection={props.areObjectsFetched ? userSrs : null} emptyMessage={_('noSrs')}>
                  {() => (
                    <Row>
                      <Col>
                        <SortedTable
                          collection={userSrs}
                          columns={SR_COLUMNS}
                          rowLink={this._getSrUrl}
                          shortcutsTarget='body'
                          stateUrlParam='s_srs'
                        />
                      </Col>
                    </Row>
                  )}
                </NoObjects>
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('orphanedVdis')}
              </CardHeader>
              <CardBlock>
                <p>
                  <Icon icon='info' /> <em>{_('orphanVdisTip')}</em>
                </p>
                <NoObjects
                  collection={props.areObjectsFetched ? orphanVdis : null}
                  emptyMessage={_('noOrphanedObject')}
                >
                  {() => (
                    <SortedTable
                      actions={ORPHANED_VDI_ACTIONS}
                      collection={orphanVdis}
                      columns={ORPHANED_VDI_COLUMNS}
                      filters={ORPHAN_VDI_FILTERS}
                      stateUrlParam='s_vdis'
                    />
                  )}
                </NoObjects>
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('vdisOnControlDomain')}
              </CardHeader>
              <CardBlock>
                <AttachedVdisTable poolPredicate={this._getPoolPredicate()} />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row className='orphaned-vms'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('orphanedVms')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  actions={VM_ACTIONS}
                  collection={props.areObjectsFetched ? this._getOrphanVmSnapshots() : null}
                  columns={VM_COLUMNS}
                  component={SortedTable}
                  emptyMessage={_('noOrphanedObject')}
                  shortcutsTarget='.orphaned-vms'
                  stateUrlParam='s_orphan_vms'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row className='too-many-snapshots-vms'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm-snapshot' /> {_('tooManySnapshots')}
              </CardHeader>
              <CardBlock>
                <p>
                  <Icon icon='info' /> <em>{_('tooManySnapshotsTip')}</em>
                </p>
                <NoObjects
                  collection={props.areObjectsFetched ? this._getTooManySnapshotsVms() : null}
                  columns={TOO_MANY_SNAPSHOT_COLUMNS}
                  component={SortedTable}
                  emptyMessage={_('noTooManySnapshotsObject')}
                  shortcutsTarget='.too-many-snapshots-vms'
                  stateUrlParam='s_too_many_snapshots_vms'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='network' /> {_('duplicatedMacAddresses')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  collection={props.areObjectsFetched ? duplicatedMacAddresses : null}
                  columns={DUPLICATED_MAC_ADDRESSES_COLUMNS}
                  component={SortedTable}
                  data-vifsByMac={this.props.vifsByMac}
                  emptyMessage={_('noDuplicatedMacAddresses')}
                  stateUrlParam='s_duplicated_mac_addresses'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row className='guest-tools-vms'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='administration' /> {_('guestToolStatus')}
              </CardHeader>
              <CardBlock>
                <p>
                  <Icon icon='info' /> <em>{_('guestToolStatusTip')}</em>
                </p>
                <NoObjects
                  collection={props.areObjectsFetched ? this._getGuestToolsVms() : null}
                  columns={GUEST_TOOLS_COLUMNS}
                  component={SortedTable}
                  emptyMessage={_('noGuestToolStatusObject')}
                  shortcutsTarget='.guest-tools-vms'
                  stateUrlParam='s_guest_tools_vms'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='alarm' /> {_('alarmMessage')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  collection={props.areObjectsFetched ? this._getAlertMessages() : null}
                  emptyMessage={_('noAlarms')}
                >
                  {() => (
                    <SortedTable
                      actions={ALARM_ACTIONS}
                      collection={this._getMessages()}
                      columns={ALARM_COLUMNS}
                      stateUrlParam='s_alarm'
                    />
                  )}
                </NoObjects>
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
