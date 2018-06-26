import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import xml2js from 'xml2js'
import { confirm } from 'modal'
import { SelectPool } from 'select-objects'
import { fromCallback } from 'promise-toolbox'
import { Container, Row, Col } from 'grid'
import { Card, CardHeader, CardBlock } from 'card'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { flatten, get, includes, isEmpty, map, mapValues } from 'lodash'
import { connectStore, formatSize, noop, resolveIds } from 'utils'
import {
  deleteMessage,
  deleteOrphanedVdis,
  deleteVbd,
  deleteVbds,
  deleteVdi,
  deleteVm,
  isSrWritable,
} from 'xo'
import {
  areObjectsFetched,
  createCollectionWrapper,
  createFilter,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'

const SrColContainer = connectStore(() => ({
  container: createGetObject(),
}))(({ container }) => (
  <Link to={`${container.type}s/${container.id}`}>{container.name_label}</Link>
))

const VdiColSr = connectStore(() => ({
  sr: createGetObject(),
}))(({ sr }) => <Link to={`srs/${sr.id}`}>{sr.name_label}</Link>)

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
          <meter
            value={(sr.physical_usage / sr.size) * 100}
            min='0'
            max='100'
            optimum='40'
            low='80'
            high='90'
          />
        </Tooltip>
      ),
    sortCriteria: sr => sr.physical_usage / sr.size,
    sortOrder: 'desc',
  },
]

const ORPHANED_VDI_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: vdi => (
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
    ),
    sortCriteria: vdi => vdi.snapshot_time,
    sortOrder: 'desc',
  },
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => vdi.name_label,
    sortCriteria: vdi => vdi.name_label,
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => vdi.name_description,
    sortCriteria: vdi => vdi.name_description,
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size,
  },
  {
    name: _('vdiSr'),
    itemRenderer: vdi => <VdiColSr id={vdi.$SR} />,
  },
  {
    name: _('logAction'),
    itemRenderer: vdi => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
      />
    ),
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

const AttachedVdisTable = [
  connectStore({
    pools: createGetObjectsOfType('pool'),
    srs: createGetObjectsOfType('SR'),
    vbds: createGetObjectsOfType('VBD').pick(
      createSelector(
        createFilter(
          createGetObjectsOfType('VM-controller'),
          (_, props) => props.poolPredicate
        ),
        createCollectionWrapper(vmControllers =>
          flatten(map(vmControllers, '$VBDs'))
        )
      )
    ),
    vdis: createGetObjectsOfType('VDI'),
    vdiSnapshots: createGetObjectsOfType('VDI-snapshot'),
  }),
  ({ columns, rowTransform }) => ({ pools, srs, vbds, vdis, vdiSnapshots }) => (
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
    />
  ),
  {
    columns: [
      {
        name: _('vdiNameLabel'),
        itemRenderer: ({ vdi }) => (
          <span>
            {vdi.name_label}
            {vdi.type === 'VDI-snapshot' && [
              ' ',
              <Icon icon='vm-snapshot' key='1' />,
            ]}
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
          pool === undefined ? null : (
            <Link to={`pools/${pool.id}`}>{pool.name_label}</Link>
          ),
        sortCriteria: ({ pool }) => pool != null && pool.name_label,
      },
      {
        name: _('vdiSize'),
        itemRenderer: ({ vdi }) => formatSize(vdi.size),
        sortCriteria: ({ vdi }) => vdi.size,
      },
      {
        name: _('vdiSr'),
        itemRenderer: ({ sr }) =>
          sr === undefined ? null : (
            <Link to={`srs/${sr.id}`}>{sr.name_label}</Link>
          ),
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
].reduceRight((value, decorator) => decorator(value))

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
  {
    name: _('logAction'),
    itemRenderer: vm => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVm}
        handlerParam={vm}
        icon='delete'
      />
    ),
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
  {
    name: _('logAction'),
    itemRenderer: message => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteMessage}
        handlerParam={message}
        icon='delete'
      />
    ),
  },
]

@connectStore(() => {
  const getOrphanVdiSnapshots = createGetObjectsOfType('VDI-snapshot')
    .filter([_ => !_.$snapshot_of && _.$VBDs.length === 0])
    .sort()
  const getOrphanVmSnapshots = createGetObjectsOfType('VM-snapshot')
    .filter([snapshot => !snapshot.$snapshot_of])
    .sort()
  const getUserSrs = createGetObjectsOfType('SR').filter([isSrWritable])
  const getVdiSrs = createGetObjectsOfType('SR').pick(
    createSelector(getOrphanVdiSnapshots, snapshots => map(snapshots, '$SR'))
  )
  const getAlertMessages = createGetObjectsOfType('message').filter([
    message => message.name === 'ALARM',
  ])

  return {
    areObjectsFetched,
    alertMessages: getAlertMessages,
    userSrs: getUserSrs,
    vdiOrphaned: getOrphanVdiSnapshots,
    vdiSr: getVdiSrs,
    vmOrphaned: getOrphanVmSnapshots,
  }
})
export default class Health extends Component {
  state = {
    pools: [],
  }

  componentWillReceiveProps (props) {
    if (props.alertMessages !== this.props.alertMessages) {
      this._updateAlarms(props)
    }
  }

  componentDidMount () {
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
        return fromCallback(cb => xml2js.parseString(xml, cb)).then(result => {
          const object = mapValues(result && result.variable, value =>
            get(value, '[0].$.value')
          )
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

  _deleteOrphanedVdis = () => deleteOrphanedVdis(this.props.vdiOrphaned)

  _deleteAllLogs = () =>
    confirm({
      title: _('removeAllLogsModalTitle'),
      body: (
        <div>
          <p>{_('removeAllLogsModalWarning')}</p>
          <p>{_('definitiveMessageModal')}</p>
        </div>
      ),
    }).then(
      () => Promise.all(map(this.props.alertMessages, deleteMessage)),
      noop
    )

  _getSrUrl = sr => `srs/${sr.id}`

  _getPoolPredicate = createSelector(
    createSelector(() => this.state.pools, resolveIds),
    poolIds =>
      isEmpty(poolIds) ? undefined : item => includes(poolIds, item.$pool)
  )

  _getUserSrs = createFilter(() => this.props.userSrs, this._getPoolPredicate)

  _getVdiOrphaned = createFilter(
    () => this.props.vdiOrphaned,
    this._getPoolPredicate
  )

  _getVmOrphaned = createFilter(
    () => this.props.vmOrphaned,
    this._getPoolPredicate
  )

  _getAlertMessages = createFilter(
    () => this.props.alertMessages,
    this._getPoolPredicate
  )

  _getMessages = createFilter(() => this.state.messages, this._getPoolPredicate)

  render () {
    const { props, state } = this

    const userSrs = this._getUserSrs()
    const vdiOrphaned = this._getVdiOrphaned()

    return process.env.XOA_PLAN > 3 ? (
      <Container>
        <Row className='mb-1'>
          <SelectPool
            multi
            onChange={this.linkState('pools')}
            value={state.pools}
          />
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('srStatePanel')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  collection={props.areObjectsFetched ? userSrs : null}
                  emptyMessage={_('noSrs')}
                >
                  {() => (
                    <Row>
                      <Col>
                        <SortedTable
                          collection={userSrs}
                          columns={SR_COLUMNS}
                          rowLink={this._getSrUrl}
                          shortcutsTarget='body'
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
                <NoObjects
                  collection={props.areObjectsFetched ? vdiOrphaned : null}
                  emptyMessage={_('noOrphanedObject')}
                >
                  {() => (
                    <div>
                      <Row>
                        <Col className='text-xs-right'>
                          <TabButton
                            btnStyle='danger'
                            handler={this._deleteOrphanedVdis}
                            icon='delete'
                            labelId='removeAllOrphanedObject'
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <SortedTable
                            collection={vdiOrphaned}
                            columns={ORPHANED_VDI_COLUMNS}
                          />
                        </Col>
                      </Row>
                    </div>
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
                  collection={
                    props.areObjectsFetched ? this._getVmOrphaned() : null
                  }
                  columns={VM_COLUMNS}
                  component={SortedTable}
                  emptyMessage={_('noOrphanedObject')}
                  shortcutsTarget='.orphaned-vms'
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
                  collection={
                    props.areObjectsFetched ? this._getAlertMessages() : null
                  }
                  emptyMessage={_('noAlarms')}
                >
                  {() => (
                    <div>
                      <Row>
                        <Col className='text-xs-right'>
                          <TabButton
                            btnStyle='danger'
                            handler={this._deleteAllLogs}
                            icon='delete'
                            labelId='logRemoveAll'
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <SortedTable
                            collection={this._getMessages()}
                            columns={ALARM_COLUMNS}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                </NoObjects>
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    ) : (
      <Container>
        <Upgrade place='health' available={4} />
      </Container>
    )
  }
}
