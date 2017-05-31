import _ from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import HTML5Backend from 'react-dnd-html5-backend'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React from 'react'
import sortBy from 'lodash/sortBy'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { Row, Col } from 'grid'
import { SelectVm } from 'select-objects'
import { Toggle } from 'form'

const deleteVM = () => { /* TODO */ }

const VM_COLUMNS = [
  {
    name: 'label',
    itemRenderer: vm => (<span><Tooltip
      content={isEmpty(vm.current_operations)
        ? _(`powerState${vm.power_state}`)
        : <div>{_(`powerState${vm.power_state}`)}{' ('}{map(vm.current_operations)[0]}{')'}</div>
      }
    >
      {isEmpty(vm.current_operations)
        ? <Icon icon={`${vm.power_state.toLowerCase()}`} />
        : <Icon icon='busy' />
      }
    </Tooltip>
    &nbsp;
      <Link to={`/vms/${vm.id}`}>
        {vm.name_label}
      </Link>
    </span>),
    sortCriteria: vm => vm.name_label
  },
  {
    name: 'description',
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description
  },
  {
    name: 'Actions',
    itemRenderer: vm => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVM}
        handlerParam={vm}
        icon='delete'
      />
    )
  }
]

const parseBootOrder = vms => {
  // FIXME missing translation
  const orderVms = sortBy(vms, vm => {
    return vm.order
  })
  const order = []
  forEach(orderVms, vm => { order.push({id: vm.id, text: vm.name_label, active: vm.order !== 0}) })
  return order
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
    /* TODO */
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
  onClose: propTypes.func
})
@DragDropContext(HTML5Backend)
class BootOrder extends Component {
  constructor (props) {
    super(props)
    const { vms } = props
    const order = parseBootOrder(vms)
    this.state = {order}
  }

  _moveOrderItem = (dragIndex, hoverIndex) => {
    /* TODO */
  }

  _reset = () => {
    /* TODO */
  }

  _save = () => {
    /* TODO */
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

export default class TabManagement extends Component {
  constructor (props) {
    super(props)
    this.state = {
      attachVm: false,
      bootOrder: false
    }
  }

  _addVm = vm => { /* TODO */ }
  _selectVm = vm => this.setState({vm})
  _toggleBootOrder = () => this.setState({
    bootOrder: !this.state.bootOrder,
    attachVm: false
  })
  _toggleNewVm = () => this.setState({
    attachVm: !this.state.attachVm,
    bootOrder: false
  })
  _vmPredicate = vm => !this.props.vms.includes(vm)

  render () {
    const { vms } = this.props
    const { attachVm, bootOrder } = this.state
    return (
      <div>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle={attachVm ? 'info' : 'primary'}
              handler={this._toggleNewVm}
              icon='add'
              labelId='vbdCreateDeviceButton'
            />
            <TabButton
              btnStyle={bootOrder ? 'info' : 'primary'}
              handler={this._toggleBootOrder}
              icon='sort'
              labelId='vdiBootOrder'
            />
          </Col>
        </Row>
        {bootOrder && <div><BootOrder vms={vms} onClose={this._toggleBootOrder} /><hr /></div>}
        {attachVm && <div>
          <SelectVm onChange={this._selectVm} predicate={this._vmPredicate} required />
          <span className='pull-right'>
            <ActionButton icon='add' btnStyle='primary' handler={this._addVm}>{_('add')}</ActionButton>
          </span>
        </div>}
        <SortedTable collection={vms} columns={VM_COLUMNS} />
      </div>
    )
  }
}
