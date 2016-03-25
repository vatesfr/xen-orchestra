import _ from 'messages'
import filter from 'lodash/fp/filter'
import flow from 'lodash/flow'
import groupBy from 'lodash/fp/groupBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import sortBy from 'lodash/fp/sortBy'
import { connectStore, createFilter } from 'utils'
import { createSelector } from 'reselect'
import { Link } from 'react-router'

@connectStore([ 'objects' ])
export default class extends Component {
  constructor (props) {
    super(props)

    this.state = {
      filter: ''
    }

    const vms = this.getVms = createSelector(
      () => this.props.objects,
      flow(filter({ type: 'VM' }), sortBy('name_label'))
    )

    const filteredVms = createFilter(
      vms,
      () => this.state.filter,
      (vm) => vm.name_label
    )

    this.getVmsByContainer = createSelector(
      filteredVms,
      groupBy('$container')
    )
  }

  render () {
    const { objects } = this.props
    const vms = this.getVms()
    const vmsByContainer = this.getVmsByContainer()

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
            {map(vmsByContainer, (vms, container) => <li key={container}>
              {objects[container].name_label}
              <ul>
                {map(vms, (vm) => <li key={vm.id}>
                  <Link to={`/vms/${vm.id}`}>{vm.name_label}</Link> ({_(`powerState${vm.power_state}`)})
                </li>)}
              </ul>
            </li>)}
          </ul>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
