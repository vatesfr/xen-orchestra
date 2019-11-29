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
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { confirm } from 'modal'
import { injectIntl } from 'react-intl'
import { Text } from 'editable'
import { SizeInput, Toggle } from 'form'
import { Container, Row, Col } from 'grid'
import { connectStore, formatSize, noop } from 'utils'
import {
  concat,
  compact,
  forEach,
  groupBy,
  isEmpty,
  keyBy,
  map,
  mapValues,
  pick,
  some,
} from 'lodash'
import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createSelector,
  getCheckPermissions,
} from 'selectors'
import {
  areSrsOnSameHost,
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
  isSrShared,
  migrateVdi,
} from 'xo'
import { error } from 'notification'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        <Text
          value={vdi.name_label}
          onChange={value => editVdi(vdi, { name_label: value })}
        />{' '}
        {vdi.type === 'VDI-snapshot' && (
          <span className='tag tag-info'>
            <Icon icon='vm-snapshot' />
          </span>
        )}
      </span>
    ),
    sortCriteria: vdi => vdi.name_label,
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text
        value={vdi.name_description}
        onChange={value => editVdi(vdi, { name_description: value })}
      />
    ),
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags,
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size,
  },
  {
    name: _('vdiVms'),
    component: connectStore(() => {
      const getVbds = createGetObjectsOfType('VBD')
        .pick((_, props) => props.item.$VBDs)
        .sort()
      const getVmIds = createSelector(getVbds, vbds => map(vbds, 'VM'))
      const getVms = createGetObjectsOfType('VM').pick(getVmIds)
      const getVmControllers = createGetObjectsOfType('VM-controller').pick(
        getVmIds
      )
      const getVmSnapshots = createGetObjectsOfType('VM-snapshot').pick(
        getVmIds
      )
      const getVmTemplates = createGetObjectsOfType('VM-template').pick(
        getVmIds
      )
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
    })(({ vbds, vms }) => {
      if (isEmpty(vms)) {
        return null
      }

      return (
        <Container>
          {map(vbds, (vbd, index) => {
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
              link =
                vm.$snapshot_of === undefined
                  ? '/dashboard/health'
                  : `/vms/${vm.$snapshot_of}/snapshots`
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
          })}
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
    label: _('deleteSelectedVdis'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  ...(process.env.XOA_PLAN > 1
    ? [
        {
          disabled: ({ id, type }, { isVdiAttached }) =>
            isVdiAttached[id] || type === 'VDI-unmanaged',
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
    label: _('deleteSelectedVdi'),
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
            {_('vbdReadonly')}{' '}
            <Toggle onChange={this.toggleState('readOnly')} value={readOnly} />
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
  const getAllVdis = createGetObjectsOfType('VDI')
  const getSrs = createGetObjectsOfType('SR')
  const getVbds = createGetObjectsOfType('VBD')

  const getVdisById = createSelector(
    (_, props) => props.vdis,
    vdis => keyBy(vdis, 'id')
  )

  const getVbdsByVdi = createSelector(
    createSelector(getVbds, vbds => keyBy(vbds, 'id')),
    createSelector(getVdisById, vdis => mapValues(vdis, '$VBDs')),
    (vbds, vbdIdsByVdi) =>
      mapValues(vbdIdsByVdi, vbdIds => map(vbdIds, vbdId => vbds[vbdId]))
  )

  const getVmIdsByVdi = createSelector(getVbdsByVdi, vbdsByVdi =>
    mapValues(vbdsByVdi, vbds => map(vbds, 'VM'))
  )

  const getVmsByVdi = createSelector(
    createGetObjectsOfType('VM'),
    getVmIdsByVdi,
    (vms, vmIdsByVdi) => mapValues(vmIdsByVdi, vmIds => pick(vms, vmIds))
  )

  const getVmControllersByVdi = createSelector(
    createGetObjectsOfType('VM-controller'),
    getVmIdsByVdi,
    (vmControllers, vmIdsByVdi) =>
      mapValues(vmIdsByVdi, vmIds => pick(vmControllers, vmIds))
  )

  const getVmSnapshotsByVdi = createSelector(
    createGetObjectsOfType('VM-snapshot'),
    getVmIdsByVdi,
    (vmSnapshots, vmIdsByVdi) =>
      mapValues(vmIdsByVdi, vmIds => pick(vmSnapshots, vmIds))
  )

  const getVmTemplatesByVdi = createSelector(
    createGetObjectsOfType('VM-template'),
    getVmIdsByVdi,
    (vmTemplates, vmIdsByVdi) =>
      mapValues(vmIdsByVdi, vmIds => pick(vmTemplates, vmIds))
  )

  const getAllVmsByVdi = createSelector(
    getVdisById,
    getVmsByVdi,
    getVmControllersByVdi,
    getVmSnapshotsByVdi,
    getVmTemplatesByVdi,
    (
      vdisById,
      vmsByVdi,
      vmControllersByVdi,
      vmSnapshotsByVdi,
      vmTemplatesByVdi
    ) =>
      mapValues(vdisById, ({ id }) => ({
        ...vmsByVdi[id],
        ...vmControllersByVdi[id],
        ...vmSnapshotsByVdi[id],
        ...vmTemplatesByVdi[id],
      }))
  )

  return {
    allVdis: getAllVdis,
    allVmsByVdi: getAllVmsByVdi,
    checkPermissions: getCheckPermissions,
    vbds: getVbds,
    srs: getSrs,
  }
})
export default class SrDisks extends Component {
  _closeNewDiskForm = () => this.setState({ newDisk: false })

  _getAllVdis = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    concat
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

  _getVmSrs = createSelector(
    _ => _,
    () => this.props.vbds,
    () => this.props.allVmsByVdi,
    () => this.props.allVdis,
    () => this.props.srs,
    (selectedVdis, allVbds, vmsByVdi, vdis, srs) => {
      let vbds = []
      forEach(selectedVdis, ({ id }) => {
        forEach(vmsByVdi[id], vm => {
          vbds = [...vbds, ...vm.$VBDs]
        })
      })

      return compact(
        vbds.map(vbdId => {
          const vbd = allVbds[vbdId]
          let vdi
          return (
            !vbd.is_cd_drive &&
            ((vdi = vdis[vbd.VDI]), vdi !== undefined && srs[vdi.$SR])
          )
        })
      )
    }
  )

  _getRequiredHost = createSelector(this._getVmSrs, srs => {
    if (!areSrsOnSameHost(srs)) {
      return
    }

    let container
    forEach(srs, sr => {
      if (sr !== undefined && !isSrShared(sr)) {
        container = sr.$container
        return false
      }
    })
    return container
  })

  _getCheckSr = createSelector(this._getRequiredHost, requiredHost => sr =>
    sr === undefined ||
    isSrShared(sr) ||
    requiredHost === undefined ||
    sr.$container === requiredHost
  )

  _migrateVdis = vdis => {
    return confirm({
      title: _('vdiMigrate'),
      body: (
        <MigrateVdiModalBody
          checkSr={this._getCheckSr(vdis)}
          pool={this.props.sr.$pool}
        />
      ),
    }).then(({ sr, migrateAll }) => {
      if (!sr) {
        return error(_('vdiMigrateNoSr'), _('vdiMigrateNoSrMessage'))
      }

      return Promise.all(
        map(migrateAll ? this.props.vdis : vdis, vdi => migrateVdi(vdi, sr))
      )
    })
  }

  _actions = [
    {
      disabled: vdis =>
        some(
          vdis,
          ({ type }) => type === 'VDI-unmanaged' || type === 'VDI-snapshot'
        ),
      handler: this._migrateVdis,
      icon: 'vdi-migrate',
      individualLabel: _('vdiMigrate'),
      label: _('migrateSelectedVdis'),
    },
  ]

  render() {
    const vdis = this._getAllVdis()
    const { newDisk } = this.state

    return (
      <Container>
        {this._getIsSrAdmin() && [
          <Row>
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
            <Row>
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
