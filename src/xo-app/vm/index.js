// import _ from 'messages'
import ActionBar from 'action-bar'
import React, { Component } from 'react'
import { connectStore } from 'utils'

// ===================================================================

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          label: 'stopVmLabel',
          handler: () => handlers.stopVm(vm.id)
        }
      ]}
    />
  ),
  Halted: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          label: 'startVmLabel',
          handler: () => handlers.startVm(vm.id)
        }
      ]}
    />
  )
}

const VmActionBar = ({
  vm,
  handlers
}) => {
  const ActionBar = vmActionBarByState[vm.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} handlers={handlers} />
}

// ===================================================================

@connectStore((state, props) => {
  const { objects } = state
  const { id } = props.params

  const vm = objects[id]
  if (!vm) {
    return {}
  }

  return {
    container: objects[vm.$container],
    pool: objects[vm.$pool],
    vm
  }
})
export default class extends Component {
  render () {
    const {
      container,
      pool,
      vm
    } = this.props
    console.log(this.props)

    if (!vm) {
      return <h1>Loading…</h1>
    }

    return <div>
      <h1>{vm.name_label}</h1>
      <p>{pool.name_label} > {container.name_label}</p>

      <VmActionBar vm={vm} handlers={this.props} />
    </div>
  }
}
