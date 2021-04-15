import React from 'react'
import { withState } from 'reaclette'

import Button from './Button'

import Console, { IConsole } from './Console'

interface ParentState {}

interface State {
  console: React.RefObject<IConsole>
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
      console: React.createRef(),
    }),
  },
  ({ state, vmId }) => (
    <div style={{ height: '100vh' }}>
      {state.console.current !== null &&
        <Button label='CTRL+ALT+DEL' onClick={state.console.current._effects.sendCtrlAltDel} />
      }
      <Console vmId={vmId} ref={state.console} />
    </div>
  )
)

export default TabConsole
