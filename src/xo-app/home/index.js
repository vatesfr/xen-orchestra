import _ from 'messages'
import groupBy from 'lodash/fp/groupBy'
import isEmpty from 'lodash/isEmpty'
import Icon from 'icon'
import map from 'lodash/map'
import Tooltip from 'tooltip'
import { editVm } from 'xo'
import { Row, Col } from 'grid'
import React, { Component } from 'react'
import { connectStore, createSimpleMatcher, osFamily } from 'utils'
import { Link } from 'react-router'
import { Text } from 'editable'
import {
  create as createSelector,
  createFilter,
  vms, vmContainers
} from 'selectors'

@connectStore({
  vmContainers,
  vms
})
export default class Home extends Component {
  constructor (props) {
    super(props)

    this.state = {
      filter: '',
      displayActions: false
    }

    const filteredVms = createFilter(
      () => this.props.vms,
      createSelector(
        () => this.state.filter,
        filter => createSimpleMatcher(filter, vm => vm.name_label)
      ),
      true
    )

    this.getVmsByContainer = createSelector(
      filteredVms,
      groupBy('$container')
    )
  }

  render () {
    const { vms, vmContainers } = this.props
    // const vmsByContainer = this.getVmsByContainer()

    return <div>
      {!isEmpty(vms)
        ? <div>
          <Row className='xo-row-header'>
            <Col mediumSize={4}>
              <div>
                <input type='text' className='form-control' onChange={event => {
                  this.setState({
                    filter: event.target.value
                  })
                }} />
              </div>
            </Col>
            <Col mediumSize={4}>
              <div className='btn-group'>
                <button className='btn btn-secondary active' active>
                  {_('homeTypeVm')}
                </button>
                <button className='btn btn-secondary disabled'>
                  {_('homeTypeHost')}
                </button>
                <button className='btn btn-secondary disabled'>
                  {_('homeTypeSr')}
                </button>
              </div>
            </Col>
            <Col mediumSize={4} className='text-xs-right'>
              <button className='btn btn-success'>
                <Icon icon='vm-new' /> {_('homeNewVm')}
              </button>
            </Col>
          </Row>
          <Row className='xo-row-header'>
            <Col mediumSize={4}>
              <i>&nbsp;&nbsp;&nbsp;</i><input type='checkbox' onChange={() => {
                this.setState({
                  displayActions: !this.state.displayActions
                })
              }}></input>
              {this.state.displayActions
                ? <span className='text-muted'>&nbsp;&nbsp;&nbsp;2x <Icon icon='vm' /> selected</span>
                : <span className='text-muted'>&nbsp;&nbsp;&nbsp;11x <Icon icon='vm' /> (on 15)</span>
              }
            </Col>
            <Col mediumSize={8} className='text-xs-right'>
            {this.state.displayActions
              ? <div className='btn-group'>
                <button className='btn btn-secondary'><Icon icon='vm-stop' /></button>
                <button className='btn btn-secondary'><Icon icon='vm-start' /></button>
                <button className='btn btn-secondary'><Icon icon='vm-reboot' /></button>
                <button className='btn btn-secondary'><Icon icon='vm-migrate' /></button>
                <button className='btn btn-secondary dropdown-toggle'>More</button>
              </div>
              : <div>
                <button className='btn btn-link dropdown-toggle'>
                  {_('homeAllPools')}
                </button>
                <button className='btn btn-link dropdown-toggle'>
                  {_('homeAllHosts')}
                </button>
                <button className='btn btn-link dropdown-toggle'>
                  {_('homeAllTags')}
                </button>
                <button className='btn btn-link dropdown-toggle'>
                  {_('homeSort')}
                </button>
              </div>
            }
            </Col>
          </Row>
          <Row>
            <Col mediumSize={12}>
              <table className='table table-hover'>
                <tbody>
                  {map(vms, (vm) =>
                    <tr key={vm.id}>
                      <td style={{width: '4em'}}>
                        <input type='checkbox'></input>
                        <i>&nbsp;&nbsp;</i>
                        <Tooltip content={_(`powerState${vm.power_state}`)}><Link to={`/vms/${vm.id}`}><Icon icon={`${vm.power_state.toLowerCase()}`} /></Link></Tooltip>
                      </td>
                      <td>
                        <Text onChange={value => editVm(vm, { name_label: value })}>
                          {vm.name_label}</Text>
                      </td>
                      <td>
                        {vm.xenTools ? <Icon icon={osFamily(vm.os_version.distro)} /> : <i className='fa fa-fw'>&nbsp;</i>}
                        <Text onChange={value => editVm(vm, { name_description: value })}>
                          {vm.name_description}</Text>
                      </td>
                      <td>
                        {vmContainers[vm.$container].type === 'host'
                          ? <Link to={`/hosts/${vmContainers[vm.$container].id}`}>{vmContainers[vm.$container].name_label}</Link>
                          : vmContainers[vm.$container].name_label
                        }
                      </td>
                      <td><Icon icon='nav' /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Col>
          </Row>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
