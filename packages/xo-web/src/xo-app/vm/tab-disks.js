import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import HTML5Backend from 'react-dnd-html5-backend'
import Icon from 'icon'
import IsoDevice from 'iso-device'
import PropTypes from 'prop-types'
import React from 'react'
import SingleLineRow from 'single-line-row'
import StateButton from 'state-button'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { Sr } from 'render-xo-item'
import { Container, Row, Col } from 'grid'
import {
  createGetObjectsOfType,
  createSelector,
  createFinder,
  getCheckPermissions,
  isAdmin,
} from 'selectors'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { injectIntl } from 'react-intl'
import {
  noop,
  addSubscriptions,
  formatSize,
  connectStore,
  resolveResourceSet,
} from 'utils'
import { SelectSr, SelectVdi, SelectResourceSetsSr } from 'select-objects'
import { SizeInput, Toggle } from 'form'
import { XoSelect, Size, Text } from 'editable'
import { confirm } from 'modal'
import { error } from 'notification'
import {
  filter,
  find,
  forEach,
  get,
  groupBy,
  map,
  mapValues,
  pick,
  some,
} from 'lodash'
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
  isSrWritable,
  isVmRunning,
  migrateVdi,
  setBootableVbd,
  setVmBootOrder,
  subscribeResourceSets,
} from 'xo'

const COLUMNS_VM_PV = [
  {
    itemRenderer: vdi => (
      <Text
        value={vdi.name_label}
        onChange={value => editVdi(vdi, { name_label: value })}
      />
    ),
    name: _('vdiNameLabel'),
    sortCriteria: 'name_label',
    default: true,
  },
  {
    itemRenderer: vdi => (
      <Text
        value={vdi.name_description}
        onChange={value => editVdi(vdi, { name_description: value })}
      />
    ),
    name: _('vdiNameDescription'),
    sortCriteria: 'name_description',
  },
  {
    itemRenderer: vdi => (
      <Size
        value={vdi.size || null}
        onChange={size => editVdi(vdi, { size })}
      />
    ),
    name: _('vdiSize'),
    sortCriteria: 'size',
  },
  {
    itemRenderer: (vdi, userData) => {
      const sr = userData.srs[vdi.$SR]
      return (
        sr !== undefined && (
          <XoSelect
            labelProp='name_label'
            onChange={sr => migrateVdi(vdi, sr)}
            predicate={sr => sr.$pool === userData.vm.$pool && isSrWritable(sr)}
            useLongClick
            value={sr}
            xoType='SR'
          >
            <Sr id={sr.id} link />
          </XoSelect>
        )
      )
    },
    name: _('vdiSr'),
    sortCriteria: (vdi, userData) => {
      const sr = userData.srs[vdi.$SR]
      return sr !== undefined && sr.name_label
    },
  },
  {
    itemRenderer: (vdi, userData) => {
      const vbd = userData.vbdsByVdi[vdi.id]
      return (
        <Toggle
          onChange={bootable => setBootableVbd(vbd, bootable)}
          value={vbd.bootable}
        />
      )
    },
    name: _('vbdBootableStatus'),
    id: 'vbdBootableStatus',
  },
  {
    itemRenderer: (vdi, userData) => {
      const vbd = userData.vbdsByVdi[vdi.id]
      return (
        <StateButton
          disabledLabel={_('vbdStatusDisconnected')}
          disabledHandler={connectVbd}
          disabledTooltip={_('vbdConnect')}
          enabledLabel={_('vbdStatusConnected')}
          enabledHandler={disconnectVbd}
          enabledTooltip={_('vbdDisconnect')}
          disabled={!(vbd.attached || isVmRunning(userData.vm))}
          handlerParam={vbd}
          state={vbd.attached}
        />
      )
    },
    name: _('vbdStatus'),
  },
]

const COLUMNS = filter(COLUMNS_VM_PV, col => col.id !== 'vbdBootableStatus')

const ACTIONS = [
  {
    disabled: (selectedItems, userData) =>
      some(map(selectedItems, vdi => userData.vbdsByVdi[vdi.id]), 'attached'),
    handler: (selectedItems, userData) =>
      deleteVbds(map(selectedItems, vdi => userData.vbdsByVdi[vdi.id])),
    individualDisabled: (vdi, userData) => {
      const vbd = userData.vbdsByVdi[vdi.id]
      return vbd !== undefined && vbd.attached
    },
    individualHandler: (vdi, userData) => {
      const vbd = userData.vbdsByVdi[vdi.id]
      return vbd !== undefined && deleteVbd(vbd)
    },
    icon: 'vdi-forget',
    label: _('vdiForget'),
    level: 'danger',
  },
  {
    disabled: (selectedItems, userData) =>
      some(map(selectedItems, vdi => userData.vbdsByVdi[vdi.id]), 'attached'),
    handler: deleteVdis,
    individualDisabled: (vdi, userData) => {
      const vbd = userData.vbdsByVdi[vdi.id]
      return vbd !== undefined && vbd.attached
    },
    individualHandler: deleteVdi,
    individualLabel: _('vdiRemove'),
    icon: 'vdi-remove',
    label: _('deleteSelectedVdis'),
    level: 'danger',
  },
]

const parseBootOrder = bootOrder => {
  // FIXME missing translation
  const bootOptions = {
    c: 'Hard-Drive',
    d: 'DVD-Drive',
    n: 'Network',
  }
  const order = []
  if (bootOrder) {
    for (const id of bootOrder) {
      if (id in bootOptions) {
        order.push({ id, text: bootOptions[id], active: true })
        delete bootOptions[id]
      }
    }
  }
  forEach(bootOptions, (text, id) => {
    order.push({ id, text, active: false })
  })
  return order
}

@injectIntl
@addSubscriptions({
  resourceSets: subscribeResourceSets,
})
@connectStore({
  isAdmin,
})
class NewDisk extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    vm: PropTypes.object.isRequired,
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

  _getResolvedResourceSet = createSelector(
    this._getResourceSet,
    resolveResourceSet
  )

  _getResourceSetDiskLimit = createSelector(
    this._getResourceSet,
    resourceSet => get(resourceSet, 'limits.disk.available')
  )

  render() {
    const { vm, isAdmin } = this.props
    const { formatMessage } = this.props.intl
    const { size, sr, name, bootable, readOnly } = this.state

    const diskLimit = this._getResourceSetDiskLimit()
    const resourceSet = this._getResolvedResourceSet()

    const SelectSr_ =
      isAdmin || resourceSet == null ? SelectSr : SelectResourceSetsSr

    return (
      <form id='newDiskForm'>
        <div className='form-group'>
          <SelectSr_
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
                {_('vbdBootable')}{' '}
                <Toggle
                  onChange={this.toggleState('bootable')}
                  value={bootable}
                />{' '}
              </span>
            )}
            <span>
              {_('vbdReadonly')}{' '}
              <Toggle
                onChange={this.toggleState('readOnly')}
                value={readOnly}
              />
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

class AttachDisk extends Component {
  static propTypes = {
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

  _addVdi = () => {
    const { vm, vbds, onClose = noop } = this.props
    const { bootable, readOnly, vdi } = this.state

    const _isFreeForWriting = vdi =>
      vdi.$VBDs.length === 0 ||
      some(vdi.$VBDs, id => {
        const vbd = vbds[id]
        return !vbd || !vbd.attached || vbd.read_only
      })
    return attachDiskToVm(vdi, vm, {
      bootable,
      mode: readOnly || !_isFreeForWriting(vdi) ? 'RO' : 'RW',
    }).then(onClose)
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
              <ActionButton
                icon='connect'
                form='attachDiskForm'
                btnStyle='primary'
                handler={this._addVdi}
              >
                {_('vbdAttach')}
              </ActionButton>
            </span>
          </fieldset>
        )}
      </form>
    )
  }
}

const orderItemSource = {
  beginDrag: props => ({
    id: props.id,
    index: props.index,
  }),
}

const orderItemTarget = {
  hover: (props, monitor, component) => {
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    if (dragIndex === hoverIndex) {
      return
    }

    props.move(dragIndex, hoverIndex)
    monitor.getItem().index = hoverIndex
  },
}

@DropTarget('orderItem', orderItemTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('orderItem', orderItemSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class OrderItem extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    id: PropTypes.any.isRequired,
    item: PropTypes.object.isRequired,
    move: PropTypes.func.isRequired,
  }

  _toggle = checked => {
    const { item } = this.props
    item.active = checked
    this.forceUpdate()
  }

  render() {
    const { item, connectDragSource, connectDropTarget } = this.props
    return connectDragSource(
      connectDropTarget(
        <li className='list-group-item'>
          <Icon icon='grab' /> <Icon icon='grab' /> {item.text}
          <span className='pull-right'>
            <Toggle value={item.active} onChange={this._toggle} />
          </span>
        </li>
      )
    )
  }
}

@DragDropContext(HTML5Backend)
class BootOrder extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    vm: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    const { vm } = props
    const order = parseBootOrder(vm.boot && vm.boot.order)
    this.state = { order }
  }

  _moveOrderItem = (dragIndex, hoverIndex) => {
    const order = this.state.order.slice()
    const dragItem = order.splice(dragIndex, 1)
    if (dragItem.length) {
      order.splice(hoverIndex, 0, dragItem.pop())
      this.setState({ order })
    }
  }

  _reset = () => {
    const { vm } = this.props
    const order = parseBootOrder(vm.boot && vm.boot.order)
    this.setState({ order })
  }

  _save = () => {
    const { vm, onClose = noop } = this.props
    const { order: newOrder } = this.state
    let order = ''
    forEach(newOrder, item => {
      item.active && (order += item.id)
    })
    return setVmBootOrder(vm, order).then(onClose)
  }

  render() {
    const { order } = this.state

    return (
      <form>
        <ul>
          {map(order, (item, index) => (
            <OrderItem
              key={index}
              index={index}
              id={item.id}
              // FIXME missing translation
              item={item}
              move={this._moveOrderItem}
            />
          ))}
        </ul>
        <fieldset className='form-inline'>
          <span className='pull-right'>
            <ActionButton icon='save' btnStyle='primary' handler={this._save}>
              {_('saveBootOption')}
            </ActionButton>{' '}
            <ActionButton icon='reset' handler={this._reset}>
              {_('resetBootOption')}
            </ActionButton>
          </span>
        </fieldset>
      </form>
    )
  }
}

class MigrateVdiModalBody extends Component {
  get value() {
    return this.state
  }

  render() {
    return (
      <Container>
        <SingleLineRow>
          <Col size={6}>{_('vdiMigrateSelectSr')}</Col>
          <Col size={6}>
            <SelectSr onChange={this.linkState('sr')} required />
          </Col>
        </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col>
            <label>
              <input type='checkbox' onChange={this.linkState('migrateAll')} />{' '}
              {_('vdiMigrateAll')}
            </label>
          </Col>
        </SingleLineRow>
      </Container>
    )
  }
}

@connectStore(() => ({
  checkPermissions: getCheckPermissions,
  isAdmin,
  allVbds: createGetObjectsOfType('VBD'),
}))
export default class TabDisks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      attachDisk: false,
      bootOrder: false,
      newDisk: false,
    }
  }

  _toggleNewDisk = () =>
    this.setState({
      newDisk: !this.state.newDisk,
      attachDisk: false,
      bootOrder: false,
    })

  _toggleAttachDisk = () =>
    this.setState({
      attachDisk: !this.state.attachDisk,
      bootOrder: false,
      newDisk: false,
    })

  _toggleBootOrder = () =>
    this.setState({
      bootOrder: !this.state.bootOrder,
      attachDisk: false,
      newDisk: false,
    })

  _migrateVdi = vdi => {
    return confirm({
      title: _('vdiMigrate'),
      body: <MigrateVdiModalBody />,
    }).then(({ sr, migrateAll }) => {
      if (!sr) {
        return error(_('vdiMigrateNoSr'), _('vdiMigrateNoSrMessage'))
      }
      return migrateAll
        ? Promise.all(map(this.props.vdis, vdi => migrateVdi(vdi, sr)))
        : migrateVdi(vdi, sr)
    })
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
    (isAdmin, resourceSet, isVmAdmin) =>
      isAdmin || (resourceSet == null && isVmAdmin)
  )

  _getVbdsByVdi = createSelector(
    () => this.props.vdis,
    () => this.props.vbds,
    () => this.props.vm,
    (vdis, vbds, vm) => mapValues(vdis, vdi => find(vbds, { VDI: vdi.id }))
  )

  _getIsVdiAttached = createSelector(
    createSelector(
      () => this.props.allVbds,
      () => Object.keys(this.props.vdis),
      (vbds, vdis) => pick(groupBy(vbds, 'VDI'), vdis)
    ),
    vbdsByVdi => mapValues(vbdsByVdi, vbds => some(vbds, 'attached'))
  )

  individualActions = [
    ...(process.env.XOA_PLAN > 1
      ? [
          {
            handler: exportVdi,
            icon: 'export',
            label: _('exportVdi'),
          },
          {
            disabled: ({ id }, { isVdiAttached }) => isVdiAttached[id],
            handler: importVdi,
            icon: 'import',
            label: _('importVdi'),
          },
        ]
      : []),
    {
      handler: this._migrateVdi,
      icon: 'vdi-migrate',
      label: _('vdiMigrate'),
    },
    {
      handler: vdi => copy(vdi.uuid),
      icon: 'clipboard',
      label: vdi => _('copyUuid', { uuid: vdi.uuid }),
    },
  ]

  render() {
    const { srs, vbds, vdis, vm } = this.props

    const { attachDisk, bootOrder, newDisk } = this.state

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
                labelId='vdiAttachDeviceButton'
              />
            )}
            {vm.virtualizationMode !== 'pv' && (
              <TabButton
                btnStyle={bootOrder ? 'info' : 'primary'}
                handler={this._toggleBootOrder}
                icon='sort'
                labelId='vdiBootOrder'
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            {newDisk && (
              <div>
                <NewDisk vm={vm} onClose={this._toggleNewDisk} />
                <hr />
              </div>
            )}
            {attachDisk && (
              <div>
                <AttachDisk
                  vm={vm}
                  vbds={vbds}
                  onClose={this._toggleAttachDisk}
                />
                <hr />
              </div>
            )}
            {bootOrder && (
              <div>
                <BootOrder vm={vm} onClose={this._toggleBootOrder} />
                <hr />
              </div>
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <SortedTable
              actions={ACTIONS}
              collection={vdis}
              columns={vm.virtualizationMode === 'pv' ? COLUMNS_VM_PV : COLUMNS}
              data-isVdiAttached={this._getIsVdiAttached()}
              data-srs={srs}
              data-vbdsByVdi={this._getVbdsByVdi()}
              data-vm={vm}
              individualActions={this.individualActions}
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
      </Container>
    )
  }
}
