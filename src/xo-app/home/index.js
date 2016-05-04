import _ from 'messages'
import groupBy from 'lodash/fp/groupBy'
import isEmpty from 'lodash/isEmpty'
import Icon from 'icon'
import map from 'lodash/map'
import Tooltip from 'tooltip'
import { Row, Col } from 'grid'
import React, { Component } from 'react'
import { connectStore, createSimpleMatcher, osFamily } from 'utils'
import { Link } from 'react-router'
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
      filter: ''
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
          <Row>
            <Col mediumSize={6}>
              <p>
                <input type='text' onChange={event => {
                  this.setState({
                    filter: event.target.value
                  })
                }} />
              </p>
            </Col>
            <Col mediumSize={3}>
              <p>TODO</p>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={12}>
              <table className='table'>
                <tbody>
                  {map(vms, (vm) =>
                    <tr key={vm.id}>
                      <td><input type='checkbox'></input></td>
                      <td><Tooltip content={_(`powerState${vm.power_state}`)}><Icon icon={`${vm.power_state.toLowerCase()}`} /></Tooltip></td>
                      <td><Link to={`/vms/${vm.id}`}>{vm.name_label}</Link></td>
                      <td>{vm.xenTools ? <Icon icon={osFamily(vm.os_version.distro)} /> : <i className='fa fa-fw'>&nbsp;</i>} {vm.name_description}</td>
                      <td>{vmContainers[vm.$container].name_label}</td>
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
