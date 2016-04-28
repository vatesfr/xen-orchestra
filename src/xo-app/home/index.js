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
        (filter) => createSimpleMatcher(filter, (vm) => vm.name_label)
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
    const vmsByContainer = this.getVmsByContainer()

    return <div>
      <h1>{_('homePage')}</h1>
      {!isEmpty(vms)
        ? <div>
          <p>
            <input type='text' onChange={(event) => {
              this.setState({
                filter: event.target.value
              })
            }} />
          </p>
          <ul>
            {map(vmsByContainer, (vms, id) => {
              const container = vmContainers[id]

              return <li key={id}>
                {container == null
                  ? <em>Unknown</em>
                  : container.type === 'host'
                    ? <Link to={`/hosts/${container.id}`}>{container.name_label}</Link>
                    : container.name_label
                }
                <ul>
                  {map(vms, (vm) => <li key={vm.id}>
                    <Link to={`/vms/${vm.id}`}>{vm.name_label}</Link> ({_(`powerState${vm.power_state}`)})
                  </li>)}
                </ul>
              </li>
            })}
          </ul>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
