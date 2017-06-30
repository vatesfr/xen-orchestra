import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import HTML5Backend from 'react-dnd-html5-backend'
import Icon from 'icon'
import map from 'lodash/map'
import propTypes from 'prop-types-decorator'
import React from 'react'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { Toggle } from 'form'

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
    const { item, connectDragSource, connectDropTarget, toggle } = this.props
    return connectDragSource(connectDropTarget(
      <li className='list-group-item'>
        <Icon icon='grab' />
        {' '}
        <Icon icon='grab' />
        {' '}
        {item.text}
        {toggle && <span className='pull-right'>
          <Toggle value={item.active} onChange={this._toggle} />
        </span>}
      </li>
    ))
  }
}

@propTypes({
  onClose: propTypes.func
})
@DragDropContext(HTML5Backend)
export default class DragNDropOrder extends Component {
  constructor (props) {
    super(props)
    const { parseOrderParam, parseOrder } = props
    this.state = parseOrder(parseOrderParam)
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
    const { parseOrderParam, parseOrder } = this.props
    this.state = this.setState(parseOrder(parseOrderParam))
  }

  _save = () => {
    const { order, toggleActive } = this.state
    this.props.setOrder(this.props.parseOrderParam, order, toggleActive)
  }

  _toggleOnChange = event => this.setState({toggleActive: event})

  render () {
    const { order, toggleActive } = this.state
    const { toggleItems } = this.props
    return <form>
      {!toggleItems && <Toggle value={toggleActive} onChange={this._toggleOnChange} />}
      <ul>
        {map(order, (item, index) => <OrderItem
          toggle={toggleItems}
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
