import _ from 'messages'
import filter from 'lodash/fp/filter'
import flow from 'lodash/flow'
import map from 'lodash/map'
import React, { Component } from 'react'
import sortBy from 'lodash/fp/sortBy'
import { connectStore } from 'utils'
import { createSelector } from 'reselect'

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
          {map(vms, (vm) => <li>{vm.name_label}</li>)}
        </ul>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
