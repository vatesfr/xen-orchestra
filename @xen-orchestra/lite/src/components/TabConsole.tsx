import React from 'react'
import { withState } from 'reaclette'

import Console from './Console'
import Button from './Button'

interface RFB {
  sendCtrlAltDel: () => void
}

interface ParentState {}

interface State {
  RFB: RFB | null
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  sendCtrlAltDel: () => void
  setRFB: (RFB: RFB) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      RFB: null,
    }),
    effects: {
      sendCtrlAltDel: function () {
        this.state.RFB?.sendCtrlAltDel()
      },
      setRFB: function (RFB) {
        this.state.RFB = RFB
      },
    },
  },
  ({ effects, vmId }) => (
    <div style={{ height: '100vh' }}>
      <Button label='CTRL+ALT+DEL' onClick={effects.sendCtrlAltDel} />
      <Console vmId={vmId} setRFB={effects.setRFB} />
    </div>
  )
)

export default TabConsole
