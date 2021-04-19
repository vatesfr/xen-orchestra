import React from 'react'
import { withState } from 'reaclette'

import Button from './Button'
import Console from './Console'

interface ParentState {}

interface State {
  ctrlAltDel: Function | null
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  sendCtrlAltDel: React.MouseEventHandler<HTMLButtonElement>
  setCtrlAltDel: (fn: () => void) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      console: React.createRef(),
      ctrlAltDel: null,
    }),
    effects: {
      sendCtrlAltDel: function () {
        const { ctrlAltDel } = this.state
        ctrlAltDel !== null && ctrlAltDel()
      },
      setCtrlAltDel: function (fn) {
        this.state.ctrlAltDel = fn
      },
    },
  },
  ({ effects, vmId }) => (
    <div style={{ height: '100vh' }}>
      <Button label='CTRL+ALT+DEL' onClick={effects.sendCtrlAltDel} />
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
    </div>
  )
)

export default TabConsole
