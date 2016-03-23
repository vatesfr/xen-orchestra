import _ from 'messages'
import filter from 'lodash/fp/filter'
import flow from 'lodash/flow'
import map from 'lodash/map'
import React, { Component } from 'react'
import sortBy from 'lodash/fp/sortBy'
import { connectStore, createFilter } from 'utils'
import { createSelector } from 'reselect'
import { Link } from 'react-router'

@connectStore({
  vms: createSelector(
    (state, props) => state.objects,
    flow(filter({ type: 'VM' }), sortBy('name_label'))
  )
})
export default class extends Component {
  constructor () {
    super()

    this.state = {
      filter: ''
    }

    this.getFilteredVms = createFilter(
      () => this.props.vms,
      () => this.state.filter,
      (vm) => vm.name_label
    )
  }

  render () {
    const { vms } = this.props
    const filteredVms = this.getFilteredVms()

    return <div>
      <h1>{_('homePage')}</h1>
      {vms.length
        ? <div>
          <p>
            <input type='text' onChange={(event) => {
              this.setState({
                filter: event.target.value
              })
            }} />
          </p>
          <ul>
            {map(filteredVms, (vm) => <li key={vm.id}>
              <Link to={`/vms/${vm.id}`}>{vm.name_label}</Link> ({vm.power_state})
            </li>)}
          </ul>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
