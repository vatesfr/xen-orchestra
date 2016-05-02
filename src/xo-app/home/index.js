import _ from 'messages'
import groupBy from 'lodash/fp/groupBy'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import { connectStore, createSimpleMatcher } from 'utils'
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
    // const { vms, vmContainers } = this.props
    // const vmsByContainer = this.getVmsByContainer()

    return <div>
      <h1>{_('homePage')}</h1>
      {!isEmpty(vms)
        ? <div>
          <p>
            <input type='text' onChange={event => {
              this.setState({
                filter: event.target.value
              })
            }} />
          </p>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('vmStatus')}</th>
                <th>{_('vmName')}</th>
                <th>{_('vmDescription')}</th>
                <th>{_('vmSettings')}</th>
              </tr>
            </thead>
            <tbody>
              {map(vms, (vm) =>
                <tr key={vm.id}>
                  <td>{_(`powerState${vm.power_state}`)}</td>
                  <td><Link to={`/vms/${vm.id}`}>{vm.name_label}</Link></td>
                  <td>{vm.name_description}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
