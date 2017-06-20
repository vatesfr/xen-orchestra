import _ from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import DragNDropOrder from 'drag-n-drop-order'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import map from 'lodash/map'
import React from 'react'
import sortBy from 'lodash/sortBy'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { editVm, removeAppliance } from 'xo'
import { Row, Col } from 'grid'
import { SelectVm } from 'select-objects'

const VM_COLUMNS = [
  {
    name: _('vmGroupLabel'),
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
    name: _('vmGroupDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description
  },
  {
    name: _('vmGroupActions'),
    itemRenderer: vm => (
      <ActionRowButton
        btnStyle='danger'
        handler={(vm) => removeAppliance(vm)}
        handlerParam={vm}
        icon='delete'
      />
    )
  }
]

export default class TabManagement extends Component {
  constructor (props) {
    super(props)
    this.state = {
      attachVm: false,
      bootOrder: false
    }
  }

  parseBootOrder = vms => {
    // FIXME missing translation
    var previousOrder = vms[Object.keys(vms)[0]].order
    var toggleActive = false
    const orderVms = sortBy(vms, vm => {
      if (vm.order !== previousOrder) toggleActive = true
      return vm.order
    })
    const order = []
    forEach(orderVms, vm => {
      order.push({id: vm.id, text: vm.name_label})
    })
    return {order, toggleActive}
  }

  setVmBootOrder = (vms, order, toggleActive) => {
    var orderValue = 0
    forEach(order, (vm, key) => {
      editVm(vms[vm.id], { order: toggleActive ? orderValue : 0 })
      orderValue += 1
    })
  }

  _addVm = () => {
    forEach(this.state.vmsToAdd, vm => editVm(vm, { appliance: this.props.vmGroup.id }))
  }
  _selectVm = vmsToAdd => this.setState({vmsToAdd})
  _toggleBootOrder = () => this.setState({
    bootOrder: !this.state.bootOrder,
    attachVm: false
  })
  _toggleNewVm = () => this.setState({
    attachVm: !this.state.attachVm,
    bootOrder: false
  })
  _vmPredicate = vm => vm.appliance === null

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
              labelId='attachVmButton'
            />
            <TabButton
              btnStyle={bootOrder ? 'info' : 'primary'}
              handler={this._toggleBootOrder}
              icon='sort'
              labelId='vmsBootOrder'
            />
          </Col>
        </Row>
        {bootOrder && <div><DragNDropOrder parseOrderParam={vms} parseOrder={this.parseBootOrder} setOrder={this.setVmBootOrder} toggleItems={false} onClose={this._toggleBootOrder} /><hr /></div>}
        {attachVm && <div>
          <form id='attachVm'>
            <SelectVm multi onChange={this._selectVm} predicate={this._vmPredicate} required />
            <span className='pull-right'>
              <ActionButton form='attachVm' icon='add' btnStyle='primary' handler={this._addVm}>{_('add')}</ActionButton>
            </span>
          </form>
        </div>}
        <SortedTable collection={vms} columns={VM_COLUMNS} />
      </div>
    )
  }
}
