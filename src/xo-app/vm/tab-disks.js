import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import HTML5Backend from 'react-dnd-html5-backend'
import Icon from 'icon'
import IsoDevice from 'iso-device'
import Link from 'link'
import propTypes from 'prop-types-decorator'
import React from 'react'
import SingleLineRow from 'single-line-row'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { Container, Row, Col } from 'grid'
import { createSelector, createFinder, getCheckPermissions, isAdmin } from 'selectors'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { injectIntl } from 'react-intl'
import { noop, addSubscriptions, formatSize, connectStore } from 'utils'
import { SelectSr, SelectVdi } from 'select-objects'
import { SizeInput, Toggle } from 'form'
import { XoSelect, Size, Text } from 'editable'
import { confirm } from 'modal'
import { error } from 'notification'
import {
  forEach,
  get,
  includes,
  isEmpty,
  map,
  some
} from 'lodash'
import {
  attachDiskToVm,
  createDisk,
  connectVbd,
  deleteVbd,
  deleteVdi,
  disconnectVbd,
  editVdi,
  isSrWritable,
  isVmRunning,
  migrateVdi,
  setBootableVbd,
  setVmBootOrder,
  subscribeResourceSets
} from 'xo'

const parseBootOrder = bootOrder => {
  // FIXME missing translation
  const bootOptions = {
    c: 'Hard-Drive',
    d: 'DVD-Drive',
    n: 'Network'
  }
  const order = []
  if (bootOrder) {
    for (const id of bootOrder) {
      if (id in bootOptions) {
        order.push({id, text: bootOptions[id], active: true})
        delete bootOptions[id]
      }
    }
  }
  forEach(bootOptions, (text, id) => { order.push({id, text, active: false}) })
  return order
}

@injectIntl
@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired
})
@addSubscriptions({
  resourceSets: subscribeResourceSets
})
@connectStore({
  isAdmin
})
class NewDisk extends Component {
  _createDisk = () => {
    const { vm, onClose = noop } = this.props
    const { bootable, name, readOnly, size, sr } = this.state

    return createDisk(name, size, sr, vm, {
      bootable,
      mode: readOnly ? 'RO' : 'RW'
    }).then(onClose)
  }

  _getIsInResourceSet = createSelector(
    () => {
      const resourceSet = this._getResourceSet()
      return resourceSet && resourceSet.objects
    },
    objectsIds => objectsIds != null
      ? id => includes(objectsIds, id)
      : () => true
  )

  // FIXME: duplicate code
  _getSrPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    this._getIsInResourceSet,
    () => this.props.isAdmin,
    (poolId, isInResourceSet, isAdmin) => sr =>
      sr.$pool === poolId &&
      isSrWritable(sr) &&
      (isAdmin || isInResourceSet(sr.id))
  )

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.props.vm.resourceSet,
      id => resourceSet => resourceSet.id === id
    )
  )

  _getResourceSetName = createSelector(
    this._getResourceSet,
    resourceSet => resourceSet && resourceSet.name
  )

  _getResourceSetDiskLimit = createSelector(
    this._getResourceSet,
    resourceSet => get(resourceSet, 'limits.disk.available')
  )

  render () {
    const { vm } = this.props
    const { formatMessage } = this.props.intl
    const { size } = this.state

    const diskLimit = this._getResourceSetDiskLimit()
    const resourceSetName = this._getResourceSetName()

    return <form id='newDiskForm'>
      <div className='form-group'>
        <SelectSr predicate={this._getSrPredicate()} onChange={this.linkState('sr')} required />
      </div>
      <fieldset className='form-inline'>
        <div className='form-group'>
          <input type='text' onChange={this.linkState('name')} placeholder={formatMessage(messages.vbdNamePlaceHolder)} className='form-control' required />
        </div>
        {' '}
        <div className='form-group'>
          <SizeInput onChange={this.linkState('size')} placeholder={formatMessage(messages.vbdSizePlaceHolder)} required />
        </div>
        {' '}
        <div className='form-group'>
          {vm.virtualizationMode === 'pv' && <span>{_('vbdBootable')} <Toggle onChange={this.toggleState('bootable')} /> </span>}
          <span>{_('vbdReadonly')} <Toggle onChange={this.toggleState('readOnly')} /></span>
        </div>
        <span className='pull-right'>
          <ActionButton form='newDiskForm' icon='add' btnStyle='primary' handler={this._createDisk} disabled={diskLimit < size}>{_('vbdCreate')}</ActionButton>
        </span>
      </fieldset>
      {resourceSetName != null && diskLimit >= size && <em>{_('useQuotaWarning', { resourceSet: <strong>{resourceSetName}</strong>, spaceLeft: formatSize(diskLimit) })}</em>}
      {diskLimit < size && <em className='text-danger'>{_('notEnoughSpaceInResourceSet', { resourceSet: <strong>{resourceSetName}</strong>, spaceLeft: formatSize(diskLimit) })}</em>}
    </form>
  }
}

@propTypes({
  onClose: propTypes.func,
  vbds: propTypes.array.isRequired,
  vm: propTypes.object.isRequired
})
class AttachDisk extends Component {
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

  _selectVdi = vdi => this.setState({vdi})

  _addVdi = () => {
    const { vm, vbds, onClose = noop } = this.props
    const { bootable, readOnly, vdi } = this.state

    const _isFreeForWriting = vdi => vdi.$VBDs.length === 0 || some(vdi.$VBDs, id => {
      const vbd = vbds[id]
      return !vbd || !vbd.attached || vbd.read_only
    })
    return attachDiskToVm(vdi, vm, {
      bootable,
      mode: readOnly || !_isFreeForWriting(vdi) ? 'RO' : 'RW'
    }).then(onClose)
  }

  render () {
    const { vm } = this.props
    const { vdi } = this.state

    return <form id='attachDiskForm'>
      <div className='form-group'>
        <SelectVdi
          predicate={this._getVdiPredicate()}
          srPredicate={this._getSrPredicate()}
          onChange={this._selectVdi}
        />
      </div>
      {vdi && <fieldset className='form-inline'>
        <div className='form-group'>
          {vm.virtualizationMode === 'pv' && <span>{_('vbdBootable')} <Toggle ref='bootable' /> </span>}
          <span>{_('vbdReadonly')} <Toggle ref='readOnly' /></span>
        </div>
        <span className='pull-right'>
          <ActionButton icon='add' form='attachDiskForm' btnStyle='primary' handler={this._addVdi}>{_('vbdCreate')}</ActionButton>
        </span>
      </fieldset>
      }
    </form>
  }
}

const orderItemSource = {
  beginDrag: props => ({
    id: props.id,
    index: props.index
  })
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
  }
}

@DropTarget('orderItem', orderItemTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource('orderItem', orderItemSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
@propTypes({
  connectDragSource: propTypes.func.isRequired,
  connectDropTarget: propTypes.func.isRequired,
  index: propTypes.number.isRequired,
  isDragging: propTypes.bool.isRequired,
  id: propTypes.any.isRequired,
  item: propTypes.object.isRequired,
  move: propTypes.func.isRequired
})
class OrderItem extends Component {
  _toggle = checked => {
    const { item } = this.props
    item.active = checked
    this.forceUpdate()
  }

  render () {
    const { item, connectDragSource, connectDropTarget } = this.props
    return connectDragSource(connectDropTarget(
      <li className='list-group-item'>
        <Icon icon='grab' />
        {' '}
        <Icon icon='grab' />
        {' '}
        {item.text}
        <span className='pull-right'>
          <Toggle value={item.active} onChange={this._toggle} />
        </span>
      </li>
    ))
  }
}

@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired
})
@DragDropContext(HTML5Backend)
class BootOrder extends Component {
  constructor (props) {
    super(props)
    const { vm } = props
    const order = parseBootOrder(vm.boot && vm.boot.order)
    this.state = {order}
  }

  _moveOrderItem = (dragIndex, hoverIndex) => {
    const order = this.state.order.slice()
    const dragItem = order.splice(dragIndex, 1)
    if (dragItem.length) {
      order.splice(hoverIndex, 0, dragItem.pop())
      this.setState({order})
    }
  }

  _reset = () => {
    const { vm } = this.props
    const order = parseBootOrder(vm.boot && vm.boot.order)
    this.setState({order})
  }

  _save = () => {
    const { vm, onClose = noop } = this.props
    const { order: newOrder } = this.state
    let order = ''
    forEach(newOrder, item => { item.active && (order += item.id) })
    return setVmBootOrder(vm, order)
      .then(onClose)
  }

  render () {
    const { order } = this.state

    return <form>
      <ul>
        {map(order, (item, index) => <OrderItem
          key={index}
          index={index}
          id={item.id}
          // FIXME missing translation
          item={item}
          move={this._moveOrderItem}
        />)}
      </ul>
      <fieldset className='form-inline'>
        <span className='pull-right'>
          <ActionButton icon='save' btnStyle='primary' handler={this._save}>{_('saveBootOption')}</ActionButton>
          {' '}
          <ActionButton icon='reset' handler={this._reset}>{_('resetBootOption')}</ActionButton>
        </span>
      </fieldset>
    </form>
  }
}

class MigrateVdiModalBody extends Component {
  get value () {
    return this.state
  }

  render () {
    return <Container>
      <SingleLineRow>
        <Col size={6}>
          {_('vdiMigrateSelectSr')}
        </Col>
        <Col size={6}>
          <SelectSr
            onChange={this.linkState('sr')}
            required
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col>
          <label>
            <input type='checkbox' onChange={this.linkState('migrateAll')} />
            {' '}
            {_('vdiMigrateAll')}
          </label>
        </Col>
      </SingleLineRow>
    </Container>
  }
}

@connectStore(() => ({
  checkPermissions: getCheckPermissions,
  isAdmin
}))
export default class TabDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      attachDisk: false,
      bootOrder: false,
      newDisk: false
    }
  }

  _toggleNewDisk = () => this.setState({
    newDisk: !this.state.newDisk,
    attachDisk: false,
    bootOrder: false
  })

  _toggleAttachDisk = () => this.setState({
    attachDisk: !this.state.attachDisk,
    bootOrder: false,
    newDisk: false
  })

  _toggleBootOrder = () => this.setState({
    bootOrder: !this.state.bootOrder,
    attachDisk: false,
    newDisk: false
  })

  _migrateVdi = vdi => {
    return confirm({
      title: _('vdiMigrate'),
      body: <MigrateVdiModalBody />
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
    (isAdmin, resourceSet, isVmAdmin) => isAdmin || (resourceSet == null && isVmAdmin)
  )

  render () {
    const {
      srs,
      vbds,
      vdis,
      vm
    } = this.props

    const {
      attachDisk,
      bootOrder,
      newDisk
    } = this.state

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle={newDisk ? 'info' : 'primary'}
            handler={this._toggleNewDisk}
            icon='add'
            labelId='vbdCreateDeviceButton'
          />
          {this._getAttachDiskPredicate() && <TabButton
            btnStyle={attachDisk ? 'info' : 'primary'}
            handler={this._toggleAttachDisk}
            icon='disk'
            labelId='vdiAttachDeviceButton'
          />}
          {vm.virtualizationMode !== 'pv' && <TabButton
            btnStyle={bootOrder ? 'info' : 'primary'}
            handler={this._toggleBootOrder}
            icon='sort'
            labelId='vdiBootOrder'
          />}
        </Col>
      </Row>
      <Row>
        <Col>
          {newDisk && <div><NewDisk vm={vm} onClose={this._toggleNewDisk} /><hr /></div>}
          {attachDisk && <div><AttachDisk vm={vm} vbds={vbds} onClose={this._toggleAttachDisk} /><hr /></div>}
          {bootOrder && <div><BootOrder vm={vm} onClose={this._toggleBootOrder} /><hr /></div>}
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(vbds)
            ? <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('vdiNameLabel')}</th>
                  <th>{_('vdiNameDescription')}</th>
                  <th>{_('vdiSize')}</th>
                  <th>{_('vdiSr')}</th>
                  {vm.virtualizationMode === 'pv' && <th>{_('vbdBootableStatus')}</th>}
                  <th>{_('vbdStatus')}</th>
                  <th className='text-xs-right'>{_('vbdAction')}</th>
                </tr>
              </thead>
              <tbody>
                {map(vbds, vbd => {
                  const vdi = vdis[vbd.VDI]
                  if (vbd.is_cd_drive || !vdi) {
                    return
                  }

                  const sr = srs[vdi.$SR]

                  return <tr key={vbd.id}>
                    <td>
                      <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
                    </td>
                    <td>
                      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                    </td>
                    <td><Size value={vdi.size || null} onChange={size => editVdi(vdi, { size })} /></td>
                    <td> {sr &&
                      <XoSelect
                        onChange={sr => migrateVdi(vdi, sr)}
                        xoType='SR'
                        predicate={sr => sr.$pool === vm.$pool && isSrWritable(sr)}
                        labelProp='name_label'
                        value={sr}
                        useLongClick
                      >
                        <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>
                      </XoSelect>
                    }
                    </td>
                    {vm.virtualizationMode === 'pv' && <td>
                      <Toggle
                        value={vbd.bootable}
                        onChange={bootable => setBootableVbd(vbd, bootable)}
                      />
                    </td>}
                    <td>
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
                    </td>
                    <td className='text-xs-right'>
                      <Tooltip content={_('vdiMigrate')}>
                        <ActionRowButton
                          icon='vdi-migrate'
                          handler={this._migrateVdi}
                          handlerParam={vdi}
                        />
                      </Tooltip>
                      {!vbd.attached &&
                        <span>
                          <Tooltip content={_('vdiForget')}>
                            <ActionRowButton
                              icon='vdi-forget'
                              handler={deleteVbd}
                              handlerParam={vbd}
                            />
                          </Tooltip>
                          <Tooltip content={_('vdiRemove')}>
                            <ActionRowButton
                              icon='vdi-remove'
                              handler={deleteVdi}
                              handlerParam={vdi}
                            />
                          </Tooltip>
                        </span>
                      }
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
            : <h4 className='text-xs-center'>{_('vbdNoVbd')}</h4>
          }
        </Col>
      </Row>
      <Row>
        <Col mediumSize={5}>
          <IsoDevice vm={vm} />
        </Col>
      </Row>
    </Container>
  }
}
