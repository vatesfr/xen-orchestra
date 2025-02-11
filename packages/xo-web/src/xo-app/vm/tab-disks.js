import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import defined, { get as getDefined } from '@xen-orchestra/defined'
import Icon from 'icon'
import IsoDevice from 'iso-device'
import MigrateVdiModalBody from 'xo/migrate-vdi-modal'
import PropTypes from 'prop-types'
import React from 'react'
import StateButton from 'state-button'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { compact, every, filter, find, forEach, get, map, reduce, some, sortedUniq, uniq } from 'lodash'
import { Sr, Vdi } from 'render-xo-item'
import { Container, Row, Col } from 'grid'
import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createSelector,
  createFilter,
  createFinder,
  getCheckPermissions,
  getResolvedResourceSet,
  isAdmin,
} from 'selectors'
import {
  addSubscriptions,
  connectStore,
  createCompare,
  createCompareContainers,
  formatSize,
  generateReadableRandomString,
  noop,
  resolveResourceSet,
} from 'utils'
import { SizeInput, Toggle } from 'form'
import { XoSelect, Size, Text } from 'editable'
import { confirm } from 'modal'
import { error } from 'notification'
import {
  attachDiskToVm,
  createDisk,
  connectVbd,
  deleteVbd,
  deleteVbds,
  deleteVdi,
  deleteVdis,
  disconnectVbd,
  editVdi,
  exportVdi,
  importVdi,
  isSrShared,
  isSrWritable,
  isVmRunning,
  migrateVdi,
  setBootableVbd,
  setCbt,
  subscribeResourceSets,
} from 'xo'
import { Card, CardHeader, CardBlock } from 'card'
import { FormattedRelative, injectIntl } from 'react-intl'
import { SelectResourceSetsSr, SelectSr as SelectAnySr, SelectVdi } from 'select-objects'

const compareSrs = createCompare([isSrShared])

@connectStore(() => ({
  isAdmin,
}))
class VdiSr extends Component {
  _getCompareContainers = createSelector(
    () => this.props.userData.vm.$pool,
    poolId => createCompareContainers(poolId)
  )

  _getSrPredicate = createSelector(
    () => this.props.userData.vm.$pool,
    poolId => sr => sr.$pool === poolId && isSrWritable(sr)
  )

  _onChangeSr = sr => {
    const {
      item: { vdi },
      userData: { resourceSet },
    } = this.props
    return migrateVdi(
      vdi,
      sr,
      getDefined(() => resourceSet.id)
    )
  }

  render() {
    const {
      isAdmin,
      item: { vdiSr },
      userData: { resourceSet },
    } = this.props
    const self = !isAdmin && resourceSet !== undefined
    return (
      vdiSr !== undefined && (
        <XoSelect
          compareContainers={this._getCompareContainers()}
          compareOptions={compareSrs}
          labelProp='name_label'
          onChange={this._onChangeSr}
          predicate={this._getSrPredicate()}
          resourceSet={self ? resourceSet : undefined}
          useLongClick
          value={vdiSr}
          xoType={self ? 'resourceSetSr' : 'SR'}
        >
          <Sr id={vdiSr.id} link={!self} self={self} />
        </XoSelect>
      )
    )
  }
}

const COLUMNS_VM_PV = [
  {
    itemRenderer: ({ vdi }) => <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />,
    name: _('vdiNameLabel'),
    sortCriteria: 'vdi.name_label',
  },
  {
    itemRenderer: ({ vdi }) => (
      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
    ),
    name: _('vdiNameDescription'),
    sortCriteria: 'vdi.name_description',
  },
  {
    itemRenderer: ({ vdi }) => (
      <Text value={vdi.disk_format.join(', ')} onChange={value => editVdi(vdi, { disk_format: value })} />
    ),
    name: _('vdiDiskFormat'),
    sortCriteria: 'vdi.disk_format',
  },
  {
    itemRenderer: ({ vdi }) => <Size value={defined(vdi.size, null)} onChange={size => editVdi(vdi, { size })} />,
    name: _('vdiSize'),
    sortCriteria: 'vdi.size',
  },
  {
    itemRenderer: ({ vdi }) => <Toggle value={vdi.cbt_enabled} onChange={cbt => setCbt(vdi, cbt)} />,
    name: _('vbdCbt'),
    sortCriteria: 'vdi.cbt_enabled',
  },
  {
    component: VdiSr,
    name: _('vdiSr'),
    sortCriteria: ({ vdiSr }) => vdiSr !== undefined && vdiSr.name_label,
  },
  {
    default: true,
    itemRenderer: vbd => <span>{vbd.device}</span>,
    name: _('vbdDevice'),
    sortCriteria: vbd => +vbd.position,
  },
  {
    itemRenderer: vbd => <Toggle onChange={bootable => setBootableVbd(vbd, bootable)} value={vbd.bootable} />,
    name: _('vbdBootableStatus'),
    id: 'vbdBootableStatus',
  },
  {
    itemRenderer: (vbd, { vm }) => (
      <StateButton
        disabledLabel={_('vbdStatusDisconnected')}
        disabledHandler={connectVbd}
        disabledTooltip={_('vbdConnect')}
        enabledLabel={_('vbdStatusConnected')}
        enabledHandler={disconnectVbd}
        enabledTooltip={_('vbdDisconnect')}
        disabled={!(vbd.attached || isVmRunning(vm))}
        handlerParam={vbd}
        state={vbd.attached}
      />
    ),
    name: _('vbdStatus'),
  },
]

const COLUMNS = filter(COLUMNS_VM_PV, col => col.id !== 'vbdBootableStatus')

const PROGRESS_STYLES = { margin: 0 }

const COLUMNS_VDI_TASKS = [
  {
    itemRenderer: task => task.name_label,
    name: _('name'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: task => <Vdi id={task.details.vdiId} />,
    name: _('object'),
    sortCriteria: 'details.vdiName',
  },
  {
    itemRenderer: task => task.details.action,
    name: _('action'),
    sortCriteria: 'details.action',
  },
  {
    itemRenderer: task => formatSize(task.details.length),
    name: _('size'),
    sortCriteria: 'details.length',
  },
  {
    itemRenderer: task => (
      <progress style={PROGRESS_STYLES} className='progress' value={task.progress * 100} max='100' />
    ),
    name: _('progress'),
    sortCriteria: 'progress',
  },
  {
    itemRenderer: task => <FormattedRelative value={task.created * 1000} />,
    name: _('taskStarted'),
    sortCriteria: 'created',
  },
  {
    itemRenderer: task => {
      const started = task.created * 1000
      const { progress } = task

      if (progress === 0 || progress === 1) {
        return // not yet started or already finished
      }
      return <FormattedRelative value={started + (Date.now() - started) / progress} />
    },
    name: _('taskEstimatedEnd'),
  },
]

const INDIVIDUAL_ACTIONS = [
  ...(process.env.XOA_PLAN > 1
    ? [
        {
          handler: vbd => exportVdi(vbd.vdi),
          icon: 'export',
          label: _('exportVdi'),
        },
        {
          disabled: vbd => vbd.attached,
          handler: vbd => importVdi(vbd.vdi),
          icon: 'import',
          label: _('importVdi'),
        },
      ]
    : []),
  {
    handler: vbd => copy(vbd.vdi.uuid),
    icon: 'clipboard',
    label: vbd => _('copyUuid', { uuid: vbd.vdi.uuid }),
  },
]

@injectIntl
@addSubscriptions({
  resourceSets: subscribeResourceSets,
})
@connectStore({
  isAdmin,
})
class NewDisk extends Component {
  static propTypes = {
    checkSr: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    vm: PropTypes.object.isRequired,
  }

  state = {
    name: `${this.props.vm.name_label}_${generateReadableRandomString(5)}`,
  }

  _createDisk = () => {
    const { vm, onClose = noop } = this.props
    const { bootable, name, readOnly, size, sr } = this.state

    return createDisk(name, size, sr, {
      vm,
      bootable,
      mode: readOnly ? 'RO' : 'RW',
    }).then(onClose)
  }

  // FIXME: duplicate code
  _getSrPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => sr => sr.$pool === poolId && isSrWritable(sr)
  )

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.props.vm.resourceSet,
      id => resourceSet => resourceSet.id === id
    )
  )

  _getResolvedResourceSet = createSelector(this._getResourceSet, resolveResourceSet)

  _getResourceSetDiskLimit = createSelector(this._getResourceSet, resourceSet =>
    get(resourceSet, 'limits.disk.available')
  )

  _checkSr = createSelector(
    () => this.props.checkSr,
    () => this.state.sr,
    (check, sr) => check(sr)
  )

  render() {
    const { vm, isAdmin } = this.props
    const { formatMessage } = this.props.intl
    const { size, sr, name, bootable, readOnly } = this.state

    const diskLimit = this._getResourceSetDiskLimit()
    const resourceSet = this._getResolvedResourceSet()

    const SelectSr = isAdmin || resourceSet == null ? SelectAnySr : SelectResourceSetsSr

    return (
      <form id='newDiskForm'>
        <div className='form-group'>
          <SelectSr
            onChange={this.linkState('sr')}
            predicate={this._getSrPredicate()}
            required
            resourceSet={isAdmin ? undefined : resourceSet}
            value={sr}
          />
        </div>
        <fieldset className='form-inline'>
          <div className='form-group'>
            <input
              type='text'
              onChange={this.linkState('name')}
              value={name}
              placeholder={formatMessage(messages.vbdNamePlaceHolder)}
              className='form-control'
              required
            />
          </div>{' '}
          <div className='form-group'>
            <SizeInput
              onChange={this.linkState('size')}
              value={size}
              placeholder={formatMessage(messages.vbdSizePlaceHolder)}
              required
            />
          </div>{' '}
          <div className='form-group'>
            {vm.virtualizationMode === 'pv' && (
              <span>
                {_('vbdBootable')} <Toggle onChange={this.toggleState('bootable')} value={bootable} />{' '}
              </span>
            )}
            <span>
              {_('vbdReadonly')} <Toggle onChange={this.toggleState('readOnly')} value={readOnly} />
            </span>
          </div>
          <span className='pull-right'>
            <ActionButton
              form='newDiskForm'
              icon='add'
              btnStyle='primary'
              handler={this._createDisk}
              disabled={!isAdmin && diskLimit < size}
            >
              {_('vbdCreate')}
            </ActionButton>
          </span>
        </fieldset>
        {!this._checkSr() && (
          <div>
            <span className='text-danger'>
              <Icon icon='alarm' /> {_('warningVdiSr')}
            </span>
          </div>
        )}
        {resourceSet != null &&
          diskLimit != null &&
          (diskLimit < size ? (
            <em className='text-danger'>
              {_('notEnoughSpaceInResourceSet', {
                resourceSet: <strong>{resourceSet.name}</strong>,
                spaceLeft: formatSize(diskLimit),
              })}
            </em>
          ) : (
            <em>
              {_('useQuotaWarning', {
                resourceSet: <strong>{resourceSet.name}</strong>,
                spaceLeft: formatSize(diskLimit),
              })}
            </em>
          ))}
      </form>
    )
  }
}

@connectStore({
  srs: createGetObjectsOfType('SR'),
})
class AttachDisk extends Component {
  static propTypes = {
    checkSr: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    vbds: PropTypes.array.isRequired,
    vm: PropTypes.object.isRequired,
  }

  _getVdiPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => vdi => vdi.$pool === poolId
  )

  // FIXME: duplicate code
  _getSrPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => sr => sr.$pool === poolId && isSrWritable(sr)
  )

  _selectVdi = vdi => this.setState({ vdi })

  _checkSr = createSelector(
    () => this.props.checkSr,
    () => this.props.srs,
    () => this.state.vdi,
    (check, srs, vdi) => check(srs[vdi.$SR])
  )

  _addVdi = () => {
    const { vm, vbds, onClose = noop } = this.props
    const { bootable, readOnly, vdi } = this.state

    const _isFreeForWriting = vdi =>
      vdi.$VBDs.length === 0 ||
      every(vdi.$VBDs, id => {
        const vbd = vbds[id]
        return !vbd || !vbd.attached || vbd.read_only
      })

    const _attachDisk = () =>
      attachDiskToVm(vdi, vm, {
        bootable,
        mode: readOnly || !_isFreeForWriting(vdi) ? 'RO' : 'RW',
      }).then(onClose)

    // check if the selected VDI is already attached to this VM.
    return some(vbds, { VDI: vdi.id, VM: vm.id })
      ? confirm({
          body: _('vdiAttachDeviceConfirm'),
          icon: 'alarm',
          title: _('vdiAttachDevice'),
        }).then(_attachDisk)
      : _attachDisk()
  }

  render() {
    const { vm } = this.props
    const { vdi } = this.state

    return (
      <form id='attachDiskForm'>
        <div className='form-group'>
          <SelectVdi
            predicate={this._getVdiPredicate()}
            srPredicate={this._getSrPredicate()}
            onChange={this._selectVdi}
          />
        </div>
        {vdi && (
          <fieldset className='form-inline'>
            <div className='form-group'>
              {vm.virtualizationMode === 'pv' && (
                <span>
                  {_('vbdBootable')} <Toggle ref='bootable' />{' '}
                </span>
              )}
              <span>
                {_('vbdReadonly')} <Toggle ref='readOnly' />
              </span>
            </div>
            <span className='pull-right'>
              <ActionButton icon='connect' form='attachDiskForm' btnStyle='primary' handler={this._addVdi}>
                {_('vbdAttach')}
              </ActionButton>
            </span>
            {!this._checkSr() && (
              <div>
                <span className='text-danger'>
                  <Icon icon='alarm' /> {_('warningVdiSr')}
                </span>
              </div>
            )}
          </fieldset>
        )}
      </form>
    )
  }
}

@addSubscriptions(props => ({
  // used by getResolvedResourceSet
  resourceSet: cb => subscribeResourceSets(resourceSets => cb(find(resourceSets, { id: props.vm.resourceSet }))),
}))
@connectStore(() => {
  const getAllVbds = createGetObjectsOfType('VBD')
  const getTasks = createGetObjectsOfType('task')

  const getDetailedImportVdiTasks = createSelector(
    getTasks,
    createFilter((state, props) => props.vdis, [vdi => vdi.other_config['xo:import:task'] !== undefined]),
    createCollectionWrapper((tasks, vdis) =>
      reduce(
        vdis,
        (acc, vdi) => {
          const task = tasks[vdi.other_config['xo:import:task']]
          const length = vdi.other_config['xo:import:length']

          acc.push({
            ...task,
            details: {
              action: 'import',
              length: Number(length),
              vdiId: vdi.uuid,
              vdiName: vdi.name_label,
            },
          })

          return acc
        },
        []
      )
    )
  )

  return (state, props) => ({
    allVbds: getAllVbds(state, props),
    checkPermissions: getCheckPermissions(state, props),
    detailedImportVdiTasks: getDetailedImportVdiTasks(state, props),
    isAdmin: isAdmin(state, props),
    resolvedResourceSet: getResolvedResourceSet(state, props, !props.isAdmin && props.resourceSet !== undefined),
  })
})
export default class TabDisks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      attachDisk: false,
      newDisk: false,
    }
  }

  _getVdiSrs = createSelector(
    () => this.props.vdis,
    createCollectionWrapper(vdis => sortedUniq(map(vdis, '$SR').sort()))
  )

  _areSrsOnSameHost = createSelector(
    this._getVdiSrs,
    () => this.props.srs,
    (vdiSrs, srs) => {
      if (some(vdiSrs, srId => srs[srId] === undefined)) {
        return true // the user doesn't have permissions on one of the SRs: no warning
      }
      let container
      let sr
      return every(vdiSrs, srId => {
        sr = srs[srId]
        if (isSrShared(sr)) {
          return true
        }
        return container === undefined ? ((container = sr.$container), true) : container === sr.$container
      })
    }
  )

  _toggleNewDisk = () =>
    this.setState({
      newDisk: !this.state.newDisk,
      attachDisk: false,
    })

  _toggleAttachDisk = () =>
    this.setState({
      attachDisk: !this.state.attachDisk,
      newDisk: false,
    })

  _migrateVdis = vdis => {
    const { resolvedResourceSet, vm } = this.props
    return confirm({
      title: _('vdiMigrate'),
      body: (
        <MigrateVdiModalBody
          pool={vm.$pool}
          resourceSet={resolvedResourceSet}
          warningBeforeMigrate={this._getGenerateWarningBeforeMigrate()}
        />
      ),
    }).then(({ sr }) => {
      if (sr === undefined) {
        return error(_('vdiMigrateNoSr'), _('vdiMigrateNoSrMessage'))
      }

      return Promise.all(
        map(vdis, vdi =>
          migrateVdi(
            vdi,
            sr,
            getDefined(() => resolvedResourceSet.id)
          )
        )
      )
    }, noop)
  }

  _getIsVmAdmin = createSelector(
    () => this.props.checkPermissions,
    () => this.props.vm && this.props.vm.id,
    (check, vmId) => check(vmId, 'administrate')
  )

  _getAttachDiskPredicate = createSelector(
    () => this.props.isAdmin,
    () => this.props.vm.resourceSet,
    this._getIsVmAdmin,
    (isAdmin, resourceSet, isVmAdmin) => isAdmin || (resourceSet == null && isVmAdmin)
  )

  _getRequiredHost = createSelector(
    this._areSrsOnSameHost,
    this._getVdiSrs,
    () => this.props.srs,
    (areSrsOnSameHost, vdiSrs, srs) => {
      if (!areSrsOnSameHost) {
        return
      }

      let container
      let sr
      forEach(vdiSrs, srId => {
        sr = srs[srId]
        if (sr !== undefined && !isSrShared(sr)) {
          container = sr.$container
          return false
        }
      })
      return container
    }
  )

  _getCheckSr = createSelector(
    this._getRequiredHost,
    requiredHost => sr =>
      sr === undefined || isSrShared(sr) || requiredHost === undefined || sr.$container === requiredHost
  )

  _getVbds = createSelector(
    () => this.props.vbds,
    () => this.props.vdis,
    () => this.props.srs,
    () => this.props.resolvedResourceSet,
    (vbds, vdis, srs, resourceSet) =>
      compact(
        map(vbds, vbd => {
          let vdi
          return (
            !vbd.is_cd_drive &&
            ((vdi = vdis[vbd.VDI]),
            vdi !== undefined && {
              ...vbd,
              vdi,
              vdiSr: defined(
                srs[vdi.$SR],
                find(
                  getDefined(() => resourceSet.objectsByType.SR),
                  { id: vdi.$SR }
                )
              ),
            })
          )
        })
      )
  )

  _getGenerateWarningBeforeMigrate = createSelector(
    this._getCheckSr,
    check => sr =>
      check(sr) ? null : (
        <span className='text-warning'>
          <Icon icon='alarm' /> {_('warningVdiSr')}
        </span>
      )
  )

  actions = [
    {
      disabled: selectedVbds => some(selectedVbds, 'attached'),
      handler: deleteVbds,
      individualDisabled: vbd => vbd.attached,
      individualHandler: deleteVbd,
      individualLabel: _('removeVdiFromVm'),
      icon: 'vdi-forget',
      label: _('removeSelectedVdisFromVm'),
      level: 'danger',
    },
    {
      disabled: selectedVbds => some(selectedVbds, 'attached'),
      handler: selectedVbds => deleteVdis(uniq(map(selectedVbds, 'vdi'))),
      individualDisabled: vbd => vbd.attached,
      individualHandler: vbd => deleteVdi(vbd.vdi),
      individualLabel: _('destroyVdi'),
      icon: 'vdi-remove',
      label: _('destroySelectedVdis'),
      level: 'danger',
    },
    {
      handler: selectedVbds => this._migrateVdis(uniq(map(selectedVbds, 'vdi'))),
      icon: 'vdi-migrate',
      individualLabel: _('vdiMigrate'),
      label: _('migrateSelectedVdis'),
    },
  ]

  render() {
    const { allVbds, resolvedResourceSet, vm } = this.props

    const { attachDisk, newDisk } = this.state

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle={newDisk ? 'info' : 'primary'}
              handler={this._toggleNewDisk}
              icon='add'
              labelId='vbdCreateDeviceButton'
            />
            {this._getAttachDiskPredicate() && (
              <TabButton
                btnStyle={attachDisk ? 'info' : 'primary'}
                handler={this._toggleAttachDisk}
                icon='disk'
                labelId='vdiAttachDevice'
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            {newDisk && (
              <div>
                <NewDisk checkSr={this._getCheckSr()} vm={vm} onClose={this._toggleNewDisk} />
                <hr />
              </div>
            )}
            {attachDisk && (
              <div>
                <AttachDisk checkSr={this._getCheckSr()} vm={vm} vbds={allVbds} onClose={this._toggleAttachDisk} />
                <hr />
              </div>
            )}
          </Col>
        </Row>
        <Row>
          {!this._areSrsOnSameHost() && (
            <div>
              <span className='text-danger'>
                <Icon icon='alarm' /> {_('warningVdiSr')}
              </span>
            </div>
          )}
          <Col>
            <SortedTable
              actions={this.actions}
              collection={this._getVbds()}
              columns={
                vm.virtualizationMode === 'pv' || vm.virtualizationMode === 'pv_in_pvh' ? COLUMNS_VM_PV : COLUMNS
              }
              data-resourceSet={resolvedResourceSet}
              data-vm={vm}
              individualActions={INDIVIDUAL_ACTIONS}
              shortcutsTarget='body'
              stateUrlParam='s'
            />
          </Col>
        </Row>
        <Row>
          <Col mediumSize={5}>
            <IsoDevice vm={vm} />
          </Col>
        </Row>
        <Row className='mt-1'>
          <Col>
            <Card>
              <CardHeader>{_('vdiTasks')}</CardHeader>
              <CardBlock>
                <SortedTable
                  collection={this.props.detailedImportVdiTasks}
                  columns={COLUMNS_VDI_TASKS}
                  stateUrlParam='t'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
