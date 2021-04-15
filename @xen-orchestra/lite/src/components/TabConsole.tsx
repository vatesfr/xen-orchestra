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
<<<<<<< HEAD
import Console from './Console'

interface RFB {
  sendCtrlAltDel: () => void
}
>>>>>>> TabConsole
=======
import Console, { IConsole } from './Console'
>>>>>>> use ref

interface ParentState {}

interface State {
<<<<<<< HEAD
<<<<<<< HEAD
  console: React.RefObject<IConsole>
=======
  RFB: RFB | null
>>>>>>> TabConsole
=======
  console: React.RefObject<IConsole>
>>>>>>> use ref
}

interface Props {
  vmId: string
}

interface ParentEffects {}

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
>>>>>>> use ref
    }),
  },
  ({ state, vmId }) => (
    <div style={{ height: '100vh' }}>
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
    </div>
  )
)

export default TabConsole
