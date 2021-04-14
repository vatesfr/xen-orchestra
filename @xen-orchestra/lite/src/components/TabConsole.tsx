import React from 'react'
import { withState } from 'reaclette'

import Console from './Console'

import { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {
  Vm: Vm | null
  RFB: any
  RFBConnected: boolean
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      Vm: null,
      RFB: null,
      RFBConnected: false,
    }),
    effects: {
      initialize: function () {
        this.state.Vm = this.state.objectsByType.get('VM')?.get(this.props.vmId) as Vm
      },
    },
  },
  ({ state, vmId }) => {
    const Vm = state.objectsByType.get('VM')?.get(vmId) as Vm

    return (
      <div style={{ height: '100vh' }}>
        {Vm.power_state !== 'Running' ? <p>Console is only available for running VMs.</p> : <Console vmId={vmId} />}
      </div>
    )
  }
)

export default TabConsole
