import React from 'react'
import { withState } from 'reaclette'

<<<<<<< HEAD
<<<<<<< HEAD
import Button from './Button'

import Console, { IConsole } from './Console'
=======
import Console from './Console'
=======
>>>>>>> sort
import Button from './Button'
import Console from './Console'

interface RFB {
  sendCtrlAltDel: () => void
}
>>>>>>> TabConsole

interface ParentState {}

interface State {
<<<<<<< HEAD
  console: React.RefObject<IConsole>
=======
  RFB: RFB | null
>>>>>>> TabConsole
}

interface Props {
  vmId: string
}

interface ParentEffects {}

<<<<<<< HEAD
interface Effects {}
=======
interface Effects {
  sendCtrlAltDel: () => void
  setRFB: (RFB: RFB) => void
}
>>>>>>> TabConsole

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
<<<<<<< HEAD
      console: React.createRef(),
    }),
  },
  ({ state, vmId }) => (
    <div style={{ height: '100vh' }}>
      {state.console.current !== null &&
        <Button label='CTRL+ALT+DEL' onClick={state.console.current._effects.sendCtrlAltDel} />
      }
      <Console vmId={vmId} ref={state.console} />
=======
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
<<<<<<< HEAD
      <Console vmId={vmId} setRFB={effects.setRFB} />
>>>>>>> TabConsole
=======
      <Console setRFB={effects.setRFB} vmId={vmId} />
>>>>>>> sort
    </div>
  )
)

export default TabConsole
