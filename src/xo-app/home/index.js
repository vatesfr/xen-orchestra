import _ from 'messages'
import filter from 'lodash/fp/filter'
import flow from 'lodash/flow'
import map from 'lodash/map'
import React, { Component } from 'react'
import sortBy from 'lodash/fp/sortBy'
import { connectStore } from 'utils'
import { createSelector } from 'reselect'
import { Link } from 'react-router'

@connectStore({
  vms: createSelector(
    (state) => state.objects,
    flow(filter({ type: 'VM' }), sortBy('name_label'))
  )
})
export default class extends Component {
  render () {
    const { vms } = this.props

    return <div>
      <h1>{_('homePage')}</h1>
      {vms.length
        ? <ul>
          {map(vms, (vm) => <li>
            <Link to={`/vms/${vm.id}`}>{vm.name_label}</Link> ({vm.power_state})
          </li>)}
        </ul>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
