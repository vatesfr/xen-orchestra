import _ from 'messages'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import HTML5Backend from 'react-dnd-html5-backend'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import { Link } from 'react-router'
import { propTypes } from 'utils'
import { SelectSr, SelectVdi } from 'select-objects'
import { Toggle } from 'form'
import { XoSelect, Size, Text } from 'editable'

import {
  deleteVbd,
  deleteVdi,
  disconnectVbd,
  editVdi,
  migrateVdi,
  setBootableVbd
} from 'xo'

class NewDisk extends Component {
  render () {
    return <form>
      <div className='form-group'>
        <SelectSr />
      </div>
      <fieldset className='form-inline'>
        <div className='form-group'>
          <input type='text' placeholder='Disk Name' className='form-control' />
        </div>
        {' '}
        <div className='form-group'>
          <input type='text' placeholder='Size' className='form-control' />
        </div>
        {' '}
        <div className='form-group'>
          Bootable <Toggle ref='bootable' /> Readonly <Toggle ref='readOnly' />
        </div>
        <span className='pull-right'>
          <ActionButton icon='add' btnStyle='primary' handler={() => null()}>Create</ActionButton>
          {' '}
          <ActionButton icon='cancel' btnStyle='default' handler={() => null()}>Cancel</ActionButton>
        </span>
      </fieldset>
    </form>
  }
}

class AttachDisk extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    const { vm } = this.props
    const srPredicate = sr => sr.$pool === vm.$pool && sr.SR_type !== 'iso'
    const vdiPredicate = vdi => vdi.$pool === vm.$pool
    return <form>
      <div className='form-group'>
        <SelectVdi
          predicate={vdiPredicate}
          containerPredicate={srPredicate}
          onChange={vdi => this.setState({vdi})}
        />
      </div>
      <pre>{JSON.stringify(this.state.vdi)}</pre>
      {' '}
      <fieldset className='form-inline'>
        <div className='form-group'>
          Bootable <Toggle ref='bootable' /> Readonly <Toggle ref='readOnly' />
        </div>
        <span className='pull-right'>
          <ActionButton icon='add' btnStyle='primary' handler={() => null()}>Create</ActionButton>
          {' '}
          <ActionButton icon='cancel' btnStyle='default' handler={() => null()}>Cancel</ActionButton>
        </span>
      </fieldset>
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

@DropTarget('orderItem', orderItemTarget, connect => ({connectDropTarget: connect.dropTarget}))
@DragSource('orderItem', orderItemSource, (connect, monitor) => ({conenctDragSource: connect.dragSource, isDragging: monitor.isDragging}))
@propTypes({
  connectDragSource: propTypes.func.isRequired,
  connectDropTarget: propTypes.func.isRequired,
  index: propTypes.number.isRequired,
  isDragging: propTypes.bool.isRequired,
  id: propTypes.any.isRequired,
  text: propTypes.string.isRequired,
  move: propTypes.func.isRequired
})
class OrderItem extends Component {
  render () {
    const { text, /* isDragging, */connectDragSource, connectDropTarget } = this.props
    return connectDragSource(connectDropTarget(
      <li className='list-group-item'>{text}</li>
    ))
  }
}

@DragDropContext(HTML5Backend)
class BootOrder extends Component {
  constructor (props) {
    super(props)
    this.state = {
      order: [
        {id: 1, text: 'one'},
        {id: 2, text: 'two'},
        {id: 3, text: 'three'}
      ]
    }
  }

  moveOrderItem = (dragIndex, hoverIndex) => {
    const order = this.state.order.slice()
    const dragItem = order.splice(dragIndex, 1)
    if (dragItem.length) {
      order.splice(hoverIndex, 0, dragItem.pop())
      this.setState({order})
    }
  }

  render () {
    const { order } = this.state

    return <ul className='list-group-item'>
      {map(order, (item, index) => <OrderItem
        key={index}
        index={index}
        id={item.id}
        text={item.text}
        move={this.moveOrderItem}
      />)}
    </ul>
  }
}

export default ({
  srs,
  vbds,
  vdis,
  vm
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: add disk
        icon='add'
        labelId='vbdCreateDeviceButton'
      />
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: attach disk
        icon='disk'
        labelId='vdiAttachDeviceButton'
      />
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: boot order
        icon='sort'
        labelId='vdiBootOrder'
      />
    </Col>
  </Row>
  <Row>
    <NewDisk />
    <AttachDisk vm={vm} />
    <BootOrder />
  </Row>
  <Row style={{ minWidth: '0' }}>
    <Col>
      {!isEmpty(vbds)
        ? <table className='table'>
          <thead className='thead-default'>
            <tr>
              <th>{_('vdiNameLabel')}</th>
              <th>{_('vdiNameDescription')}</th>
              <th>{_('vdiSize')}</th>
              <th>{_('vdiSr')}</th>
              <th>{_('vdbBootableStatus')}</th>
              <th>{_('vdbStatus')}</th>
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
                <td><Size value={vdi.size} onChange={size => editVdi(vdi, { size })} /></td>
                <td>
                  <XoSelect
                    onChange={sr => migrateVdi(vdi, sr)}
                    xoType='SR'
                    predicate={sr => (sr.$pool === vm.$pool) && (sr.content_type === 'user')}
                    labelProp='name_label'
                    value={sr}
                    useLongClick
                  >
                    <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>
                  </XoSelect>
                </td>
                <td>
                  <Toggle
                    value={vbd.bootable}
                    onChange={bootable => setBootableVbd(vbd, bootable)}
                  />
                </td>
                <td>
                  {vbd.attached
                    ? <span>
                      <span className='tag tag-success'>
                          {_('vbdStatusConnected')}
                      </span>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='default'
                          icon='disconnect'
                          handler={disconnectVbd}
                          handlerParam={vbd}
                        />
                      </ButtonGroup>
                    </span>
                    : <span>
                      <span className='tag tag-default'>
                          {_('vbdStatusDisconnected')}
                      </span>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='default'
                          icon='vdi-forget'
                          handler={deleteVbd}
                          handlerParam={vbd}
                        />
                        <ActionRowButton
                          btnStyle='default'
                          icon='vdi-remove'
                          handler={deleteVdi}
                          handlerParam={vdi}
                        />
                      </ButtonGroup>
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
</Container>
