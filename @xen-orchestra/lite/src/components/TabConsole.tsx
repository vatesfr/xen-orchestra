import React from 'react'
import { withState } from 'reaclette'

<<<<<<< HEAD
<<<<<<< HEAD
import Button from './Button'
<<<<<<< HEAD

import Console, { IConsole } from './Console'
=======
import Console from './Console'
=======
>>>>>>> sort
import Button from './Button'
<<<<<<< HEAD
import Console from './Console'

interface RFB {
  sendCtrlAltDel: () => void
}
>>>>>>> TabConsole
=======
import Console, { IConsole } from './Console'
>>>>>>> use ref
=======
import Console from './Console'
>>>>>>> remove ref

interface ParentState {}

interface State {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  console: React.RefObject<IConsole>
=======
  RFB: RFB | null
>>>>>>> TabConsole
=======
  console: React.RefObject<IConsole>
>>>>>>> use ref
=======
  ctrlAltDel: Function | null
>>>>>>> remove ref
}

interface Props {
  vmId: string
}

interface ParentEffects {}

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
interface Effects {}
=======
interface Effects {
  sendCtrlAltDel: () => void
  setRFB: (RFB: RFB) => void
}
>>>>>>> TabConsole
=======
interface Effects {}
>>>>>>> use ref
=======
interface Effects {
  sendCtrlAltDel: React.MouseEventHandler<HTMLButtonElement>
  setCtrlAltDel: (fn: () => void) => void
}
>>>>>>> remove ref

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
<<<<<<< HEAD
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
=======
      console: React.createRef(),
<<<<<<< HEAD
>>>>>>> use ref
=======
      ctrlAltDel: null,
>>>>>>> remove ref
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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
      <Button label='CTRL+ALT+DEL' onClick={effects.sendCtrlAltDel} />
<<<<<<< HEAD
      <Console vmId={vmId} setRFB={effects.setRFB} />
>>>>>>> TabConsole
=======
      <Console setRFB={effects.setRFB} vmId={vmId} />
>>>>>>> sort
=======
      <Button label='CTRL+ALT+DEL' onClick={state.console.current?._effects.sendCtrlAltDel} />
=======
      {state.console.current !== null &&
        <Button label='CTRL+ALT+DEL' onClick={state.console.current._effects.sendCtrlAltDel} />
      }
>>>>>>> remove useless code
      <Console vmId={vmId} ref={state.console} />
>>>>>>> use ref
=======
      <Button label='CTRL+ALT+DEL' onClick={effects.sendCtrlAltDel} />
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
>>>>>>> remove ref
    </div>
  )
)

export default TabConsole
