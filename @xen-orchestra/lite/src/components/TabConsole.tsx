import React from 'react'
import { withState } from 'reaclette'

import Console from './Console'
import RangeInput from './RangeInput'

const RESIZEEVENT = new UIEvent('resize')

interface ParentState {}

interface State {
  consoleSize: {
    height: number
    width: number
  }
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  _scaleConsole: (value: number) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      consoleSize: {
        height: 768,
        width: 1024,
      },
      resizeEvent: new UIEvent('resize'),
    }),
    effects: {
      _scaleConsole: function (value) {
        this.state.consoleSize = {
          height: 768 * value,
          width: 1024 * value,
        }
        // With "scaleViewport", the canvas occupies all
        // available space of his container.
        // But when the size of the container is changed,
        // the canvas size aren't updated
        // Issue https://github.com/novnc/noVNC/issues/1364
        // PR https://github.com/novnc/noVNC/pull/1365
        window.dispatchEvent(RESIZEEVENT)
      },
    },
  },
  ({ effects, vmId }) => {
    return (
      <>
        <RangeInput defaultValue={1} max={3} min={0.1} onChange={effects._scaleConsole} step={0.1} />
        <Console vmId={vmId} />
      </>
    )
  }
)

export default TabConsole
