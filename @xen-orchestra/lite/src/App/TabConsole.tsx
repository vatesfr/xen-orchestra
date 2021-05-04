import React from 'react'
<<<<<<< HEAD
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import Button from '../components/Button'
import Console from '../components/Console'
<<<<<<< HEAD
import RangeInput from '../components/RangeInput'
=======
import { withState } from 'reaclette'

<<<<<<<< HEAD:@xen-orchestra/lite/src/App/TabConsole.tsx
import Button from '../components/Button'
import Console from '../components/Console'
========
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
>>>>>>>> move tabConsole into App/:@xen-orchestra/lite/src/components/TabConsole.tsx
>>>>>>> move tabConsole into App/
=======
import { FormattedMessage } from 'react-intl'
>>>>>>> fixes

interface ParentState {}

interface State {
<<<<<<< HEAD
<<<<<<< HEAD
  consoleScale: number
  sendCtrlAltDel?: () => void
=======
<<<<<<< HEAD
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
=======
  ctrlAltDel: () => void
>>>>>>> create small minimal modal
>>>>>>> move tabConsole into App/
=======
  sendCtrlAltDel?: () => void
>>>>>>> fixes
}

interface Props {
  vmId: string
}

interface ParentEffects {}

<<<<<<< HEAD
interface Effects {
  scaleConsole: React.ChangeEventHandler<HTMLInputElement>
  setCtrlAltDel: (sendCtrlAltDel: State['sendCtrlAltDel']) => void
}
=======
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
  noop: () => void
  setCtrlAltDel: (sendCtrlAltDel: State['sendCtrlAltDel']) => void
}
>>>>>>> remove ref
>>>>>>> move tabConsole into App/

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
<<<<<<< HEAD
<<<<<<< HEAD
      // Value in percent
      consoleScale: 100,
      sendCtrlAltDel: undefined,
    }),
    effects: {
      scaleConsole: function (e) {
        this.state.consoleScale = +e.currentTarget.value

        // With "scaleViewport", the canvas occupies all available space of its
        // container. But when the size of the container is changed, the canvas
        // size isn't updated
        // Issue https://github.com/novnc/noVNC/issues/1364
        // PR https://github.com/novnc/noVNC/pull/1365
        window.dispatchEvent(new UIEvent('resize'))
      },
      setCtrlAltDel: function (sendCtrlAltDel) {
        this.state.sendCtrlAltDel = sendCtrlAltDel
=======
<<<<<<< HEAD
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
=======
      ctrlAltDel: () => {},
>>>>>>> create small minimal modal
    }),
    effects: {
      setCtrlAltDel: function (fn) {
        this.state.ctrlAltDel = fn
>>>>>>> move tabConsole into App/
=======
      sendCtrlAltDel: undefined,
    }),
    effects: {
      noop: function () {},
      setCtrlAltDel: function (sendCtrlAltDel) {
        this.state.sendCtrlAltDel = sendCtrlAltDel
>>>>>>> fixes
      },
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100vh' }}>
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
      <RangeInput max={100} min={1} onChange={effects.scaleConsole} step={1} value={state.consoleScale} />
      <Button onClick={state.sendCtrlAltDel}>
        <FormattedMessage id='ctrlAltDel' />
      </Button>
      <Console vmId={vmId} scale={state.consoleScale} setCtrlAltDel={effects.setCtrlAltDel} />
=======
<<<<<<< HEAD
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
=======
      <Button label='CTRL+ALT+DEL' onClick={state.ctrlAltDel} />
>>>>>>> create small minimal modal
=======
      <Button label={<FormattedMessage id='ctrlAltDel' />} onClick={effects.sendCtrlAltDel} />
>>>>>>> fixes
=======
      <Button label={<FormattedMessage id='ctrlAltDel' />} onClick={state.sendCtrlAltDel !== undefined ? state.sendCtrlAltDel : effects.noop}/>
>>>>>>> noop if sndCtrlAltDel undefined
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
>>>>>>> remove ref
>>>>>>> move tabConsole into App/
    </div>
  )
)

export default TabConsole
