import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import HTML5Backend from 'react-dnd-html5-backend'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { Toggle } from 'form'
import { forEach, map } from 'lodash'
import { setVmBootOrder } from 'xo'

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

const GRAB_STYLE = { cursor: 'grab' }
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
          <span className='mr-1' style={GRAB_STYLE}>
            <Icon icon='grab' /> <Icon icon='grab' />
          </span>
          {item.text}
          <span className='pull-right'>
            <Toggle value={item.active} onChange={this._toggle} />
          </span>
        </li>
      )
    )
  }
}

@DragDropContext(HTML5Backend)
export default class BootOrder extends Component {
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
    const { vm } = this.props
    const { order: newOrder } = this.state
    let order = ''
    forEach(newOrder, item => {
      item.active && (order += item.id)
    })
    return setVmBootOrder(vm, order)
  }

  render() {
    const { order } = this.state

    return (
      <form>
        <ul className='pl-0'>
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
