import React from 'react'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import Button from '../components/Button'
import Console from '../components/Console'
import RangeInput from '../components/RangeInput'

interface ParentState {}

interface State {
  consoleScale: number
  sendCtrlAltDel?: () => void
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  scaleConsole: React.ChangeEventHandler<HTMLInputElement>
  setCtrlAltDel: (sendCtrlAltDel: State['sendCtrlAltDel']) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
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
      },
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100vh' }}>
      <RangeInput max={100} min={1} onChange={effects.scaleConsole} step={1} value={state.consoleScale} />
      <Button onClick={state.sendCtrlAltDel}>
        <FormattedMessage id='ctrlAltDel' />
      </Button>
      <Console vmId={vmId} scale={state.consoleScale} setCtrlAltDel={effects.setCtrlAltDel} />
    </div>
  )
)

export default TabConsole
