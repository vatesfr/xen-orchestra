import React from 'react'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import Console from './Console'

import { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  vm: Vm
}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      vm: (state, { vmId }) => state.objectsByType.get('VM')?.get(vmId) as Vm,
    },
  },
  ({ state, vmId }) => (
    <div style={{ height: '100vh' }}>
      {state.vm.power_state !== 'Running' ? (
        <p>
          <FormattedMessage id='consoleNotAvailable' />
        </p>
      ) : (
        <Console vmId={vmId} />
      )}
    </div>
  )
)

export default TabConsole
