import * as CM from 'complex-matcher'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import Link from 'link'
import MigrateVdiModalBody from 'xo/migrate-vdi-modal'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import renderXoItem, { Vdi, Vm } from 'render-xo-item'
import { confirm } from 'modal'
import { injectIntl } from 'react-intl'
import { Text } from 'editable'
import { SizeInput, Toggle } from 'form'
import { Container, Row, Col } from 'grid'
import { connectStore, formatSize, noop } from 'utils'
import { concat, every, groupBy, isEmpty, map, mapValues, pick, some, sortBy } from 'lodash'
import { createCollectionWrapper, createGetObjectsOfType, createSelector, getCheckPermissions } from 'selectors'
import {
  connectVbd,
  createDisk,
  deleteVbd,
  deleteVdi,
  deleteVdis,
  disconnectVbd,
  editVdi,
  exportVdi,
  importVdi,
  isVmRunning,
  isSrIso,
  isSrShared,
  migrateVdi,
  setCbt,
} from 'xo'
import { error } from 'notification'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: (vdi, { vdisByBaseCopy }) => {
      const activeVdis = vdisByBaseCopy[vdi.id]
      const isMetadataVdi = vdi.VDI_type === 'cbt_metadata'
      return (
        <span>
          <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />{' '}
          {vdi.type === 'VDI-snapshot' && (
            <span className='tag tag-info'>
              <Icon icon='vm-snapshot' />
            </span>
          )}
          {isMetadataVdi && (
            <span className='tag tag-info' style={{ marginLeft: '0.4em' }}>
              <Tooltip content={_('isMetadataVdi')}>
                <Icon icon='file' />
              </Tooltip>
            </span>
          )}
          {vdi.type === 'VDI-unmanaged' &&
            (activeVdis !== undefined ? (
              <span>
                (
                <Link
                  to={`/srs/${activeVdis[0].$SR}/disks?s=${encodeURIComponent(
                    new CM.Property(
                      'id',
                      new CM.Or(activeVdis.map(activeVdi => new CM.String(activeVdi.id)))
                    ).toString()
                  )}`}
                >
                  {activeVdis.length > 1 ? (
                    _('multipleActiveVdis', { firstVdi: <Vdi id={activeVdis[0].id} />, nVdis: activeVdis.length - 1 })
                  ) : (
                    <Vdi id={activeVdis[0].id} showSize />
                  )}
                </Link>
                )
              </span>
            ) : (
              <span>({_('noActiveVdi')})</span>
            ))}
        </span>
      )
    },
    sortCriteria: vdi => vdi.name_label,
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
    ),
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags,
  },
  {
    name: _('vdiDiskFormat'),
    itemRenderer: vdi => vdi.disk_format,
    sortCriteria: vdi => vdi.disk_format,
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size,
  },
  {
    name: _('vbdCbt'),
    itemRenderer: vdi => <Toggle value={vdi.cbt_enabled} onChange={cbt => setCbt(vdi, cbt)} />,
    sortCriteria: vdi => vdi.cbt_enabled,
  },
  {
    name: _('vdiVms'),
    component: connectStore(() => {
      const getVbds = createGetObjectsOfType('VBD')
        .pick((_, props) => props.item.$VBDs)
        .sort()
      const getVmIds = createSelector(getVbds, vbds => map(vbds, 'VM'))
      const getVms = createGetObjectsOfType('VM').pick(getVmIds)
      const getVmControllers = createGetObjectsOfType('VM-controller').pick(getVmIds)
      const getVmSnapshots = createGetObjectsOfType('VM-snapshot').pick(getVmIds)
      const getVmTemplates = createGetObjectsOfType('VM-template').pick(getVmIds)
      const getAllVms = createSelector(
        getVms,
        getVmControllers,
        getVmSnapshots,
        getVmTemplates,
        (vms, vmControllers, vmSnapshots, vmTemplates) => ({
          ...vms,
          ...vmControllers,
          ...vmSnapshots,
          ...vmTemplates,
        })
      )

      return (state, props) => ({
        vms: getAllVms(state, props),
        vbds: getVbds(state, props),
      })
    })(({ item: vdi, vbds, vms, userData: { vmSnapshotsBySuspendVdi } }) => {
      const vmSnapshot = vmSnapshotsBySuspendVdi[vdi.uuid]?.[0]

      return (
        <Container>
          {vmSnapshot === undefined ? (
            map(vbds, (vbd, index) => {
              const vm = vms[vbd.VM]

              if (vm === undefined) {
                return null
              }

              const type = vm.type
              let link
              if (type === 'VM') {
                link = `/vms/${vm.id}`
              } else if (type === 'VM-template') {
                link = `/home?s=${vm.id}&t=VM-template`
              } else {
                link = vm.$snapshot_of === undefined ? '/dashboard/health' : `/vms/${vm.$snapshot_of}/snapshots`
              }

              return (
                <Row className={index > 0 && 'mt-1'}>
                  <Col mediumSize={8}>
                    <Link to={link}>{renderXoItem(vm)}</Link>
                  </Col>
                  <Col mediumSize={4}>
                    <ButtonGroup>
                      {vbd.attached ? (
                        <ActionRowButton
                          btnStyle='danger'
                          handler={disconnectVbd}
                          handlerParam={vbd}
                          icon='disconnect'
                          tooltip={_('vbdDisconnect')}
                        />
                      ) : (
                        <ActionRowButton
                          btnStyle='primary'
                          disabled={some(vbds, 'attached') || !isVmRunning(vm)}
                          handler={connectVbd}
                          handlerParam={vbd}
                          icon='connect'
                          tooltip={_('vbdConnect')}
                        />
                      )}
                      <ActionRowButton
                        btnStyle='danger'
                        handler={deleteVbd}
                        handlerParam={vbd}
                        icon='vdi-forget'
                        tooltip={_('vdiForget')}
                      />
                    </ButtonGroup>
                  </Col>
                </Row>
              )
            })
          ) : (
            <Col mediumSize={8}>
              <Link to={`/vms/${vmSnapshot.$snapshot_of}/snapshots`}>
                <Vm id={vmSnapshot.$snapshot_of} />
              </Link>
            </Col>
          )}
        </Container>
      )
    }),
  },
]

const GROUPED_ACTIONS = [
  {
    disabled: vdis => some(vdis, { type: 'VDI-unmanaged' }),
    handler: deleteVdis,
    icon: 'delete',
    label: _('destroySelectedVdis'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  ...(process.env.XOA_PLAN > 1
    ? [
        {
          disabled: ({ id, type }, { isVdiAttached }) => isVdiAttached[id] || type === 'VDI-unmanaged',
          handler: importVdi,
          icon: 'import',
          label: _('importVdi'),
        },
        {
          disabled: ({ type }) => type === 'VDI-unmanaged',
          handler: exportVdi,
          icon: 'export',
          label: _('exportVdi'),
        },
      ]
    : []),
  {
    handler: vdi => copy(vdi.uuid),
    icon: 'clipboard',
    label: vdi => _('copyUuid', { uuid: vdi.uuid }),
  },
  {
    disabled: ({ type }) => type === 'VDI-unmanaged',
    handler: deleteVdi,
    icon: 'delete',
    label: _('destroyVdi'),
    level: 'danger',
  },
]

const FILTERS = {
  filterOnlyManaged: 'type:!VDI-unmanaged',
  filterOnlyRegular: '!type:|(VDI-snapshot VDI-unmanaged)',
  filterOnlySnapshots: 'type:VDI-snapshot',
  filterOnlyOrphaned: 'type:!VDI-unmanaged $VBDs:!""',
  filterOnlyUnmanaged: 'type:VDI-unmanaged',
}

// ===================================================================

@injectIntl
class NewDisk extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    sr: PropTypes.object.isRequired,
  }

  _createDisk = () => {
    const { sr, onClose = noop } = this.props
    const { name, readOnly, size } = this.state

    return createDisk(name, size, sr, {
      mode: readOnly ? 'RO' : 'RW',
    }).then(onClose)
  }

  render() {
    const { formatMessage } = this.props.intl
    const { name, readOnly, size } = this.state

    return (
      <form id='newDiskForm' className='form-inline'>
        <div className='form-group'>
          <input
            autoFocus
            className='form-control'
            onChange={this.linkState('name')}
            placeholder={formatMessage(messages.vbdNamePlaceHolder)}
            required
            type='text'
            value={name}
          />
        </div>
        <div className='form-group ml-1'>
          <SizeInput
            onChange={this.linkState('size')}
            placeholder={formatMessage(messages.vbdSizePlaceHolder)}
            required
            value={size}
          />
        </div>
        <div className='form-group ml-1'>
          <span>
            {_('vbdReadonly')} <Toggle onChange={this.toggleState('readOnly')} value={readOnly} />
          </span>
        </div>
        <ActionButton
          className='pull-right'
          btnStyle='primary'
          form='newDiskForm'
          handler={this._createDisk}
          icon='add'
        >
          {_('vbdCreate')}
        </ActionButton>
      </form>
    )
  }
}

@connectStore(() => {
  const getVbds = createGetObjectsOfType('VBD')
  const getVmSnapshotsBySuspendVdi = createGetObjectsOfType('VM-snapshot').groupBy('suspendVdi')

  return (state, props) => ({
    checkPermissions: getCheckPermissions(state, props),
    vbds: getVbds(state, props),
    vmSnapshotsBySuspendVdi: getVmSnapshotsBySuspendVdi(state, props),
  })
})
export default class SrDisks extends Component {
  _closeNewDiskForm = () => this.setState({ newDisk: false })

  _getAllVdis = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    (vdis, vdiSnapshots, unmanagedVdis) => concat(vdis, vdiSnapshots, sortBy(unmanagedVdis, 'id'))
  )

  _getIsSrAdmin = createSelector(
    () => this.props.checkPermissions,
    () => this.props.sr.id,
    (check, id) => check(id, 'administrate')
  )

  _getIsVdiAttached = createSelector(
    createSelector(
      () => this.props.vbds,
      createCollectionWrapper(() => map(this.props.vdis, 'id')),
      (vbds, vdis) => pick(groupBy(vbds, 'VDI'), vdis)
    ),
    vbdsByVdi => mapValues(vbdsByVdi, vbds => some(vbds, 'attached'))
  )

  // the warning will be displayed if the SR is local
  // or the VDIs contain at least one VBD.
  _getGenerateWarningBeforeMigrate = createSelector(
    createCollectionWrapper(_ => _),
    vdis => sr =>
      sr === undefined || isSrShared(sr) || every(vdis, _ => isEmpty(_.$VBDs)) ? null : (
        <span className='text-warning'>
          <Icon icon='alarm' /> {_('migrateVdiMessage')}
        </span>
      )
  )

  _migrateVdis = vdis =>
    confirm({
      title: _('vdiMigrate'),
      body: (
        <MigrateVdiModalBody
          pool={this.props.sr.$pool}
          warningBeforeMigrate={this._getGenerateWarningBeforeMigrate(vdis)}
          isoSr={isSrIso(this.props.sr)}
        />
      ),
    }).then(({ sr }) => {
      if (sr === undefined) {
        return error(_('vdiMigrateNoSr'), _('vdiMigrateNoSrMessage'))
      }

      return Promise.all(map(vdis, vdi => migrateVdi(vdi, sr)))
    }, noop)

  _actions = [
    {
      disabled: vdis => some(vdis, ({ type }) => type === 'VDI-unmanaged' || type === 'VDI-snapshot'),
      handler: this._migrateVdis,
      icon: 'vdi-migrate',
      individualLabel: vdis => {
        const { type } = vdis[0]
        return type === 'VDI-unmanaged' || type === 'VDI-snapshot' ? _('disabledVdiMigrateTooltip') : _('vdiMigrate')
      },
      label: vdis => {
        return some(vdis, ({ type }) => type === 'VDI-unmanaged' || type === 'VDI-snapshot')
          ? _('disabledVdiMigrateTooltip')
          : _('migrateSelectedVdis')
      },
    },
  ]

  _getVdisByBaseCopy = createSelector(
    () => this.props.vdis,
    () => this.props.unmanagedVdis,
    (vdis, unmanagedVdis) => {
      const vdisByBaseCopy = {}

      vdis.forEach(vdi => {
        let baseCopy = unmanagedVdis[vdi.parent]

        while (baseCopy !== undefined) {
          const baseCopyId = baseCopy.id

          if (vdisByBaseCopy[baseCopyId] === undefined) {
            vdisByBaseCopy[baseCopyId] = []
          }
          vdisByBaseCopy[baseCopyId].push(vdi)
          baseCopy = unmanagedVdis[baseCopy.parent]
        }
      })
      return vdisByBaseCopy
    }
  )

  render() {
    const vdis = this._getAllVdis()
    const { newDisk } = this.state

    return (
      <Container>
        {this._getIsSrAdmin() && [
          <Row key='new-disk'>
            <Col className='text-xs-right'>
              <TabButton
                btnStyle={newDisk ? 'info' : 'primary'}
                handler={this.toggleState('newDisk')}
                icon='add'
                labelId='vbdCreateDeviceButton'
              />
            </Col>
          </Row>,
          newDisk && (
            <Row key='new-disk-form'>
              <Col>
                <NewDisk sr={this.props.sr} onClose={this._closeNewDiskForm} />
                <hr />
              </Col>
            </Row>
          ),
        ]}
        <Row>
          <Col>
            {!isEmpty(vdis) ? (
              <SortedTable
                actions={this._actions}
                collection={vdis}
                columns={COLUMNS}
                data-isVdiAttached={this._getIsVdiAttached()}
                data-vdisByBaseCopy={this._getVdisByBaseCopy()}
                data-vmSnapshotsBySuspendVdi={this.props.vmSnapshotsBySuspendVdi}
                defaultFilter='filterOnlyManaged'
                filters={FILTERS}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
                shortcutsTarget='body'
                stateUrlParam='s'
              />
            ) : (
              <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}
