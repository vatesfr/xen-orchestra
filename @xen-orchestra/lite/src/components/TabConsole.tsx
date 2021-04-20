import React from 'react'
import { withState } from 'reaclette'

import Button from './Button'
import Console from './Console'

interface ParentState {}

interface State {
  ctrlAltDel: () => void
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  setCtrlAltDel: (fn: () => void) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      ctrlAltDel: () => {},
    }),
    effects: {
      setCtrlAltDel: function (fn) {
        this.state.ctrlAltDel = fn
      },
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100vh' }}>
      <Button label='CTRL+ALT+DEL' onClick={state.ctrlAltDel} />
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
    </div>
  )
)

export default TabConsole
