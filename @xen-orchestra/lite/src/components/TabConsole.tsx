import React from 'react'
import { withState } from 'reaclette'

import Console from './Console'
import RangeInput from './RangeInput'

interface ParentState {}

interface State {
  consoleSize: {
    height: number
    width: number
  }
  defaultValue: number
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  scaleConsole: (value: number) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      consoleSize: {
        // Value in percent
        height: 100,
        width: 100,
      },
      defaultValue: 100
    }),
    effects: {
      scaleConsole: function (value) {
        this.state.consoleSize = {
          height: value,
          width: value,
        }
        // With "scaleViewport", the canvas occupies all
        // available space of its container.
        // But when the size of the container is changed,
        // the canvas size isn't updated
        // Issue https://github.com/novnc/noVNC/issues/1364
        // PR https://github.com/novnc/noVNC/pull/1365
        window.dispatchEvent(new UIEvent('resize'))
      },
    },
  },
  ({ state, effects, vmId }) => {
    return (
      <div style={{ height: '100vh' }}>
        <RangeInput defaultValue={state.defaultValue} inputAttribues={{ max: 100, min: 1, step: 1 }} onChange={effects.scaleConsole} />
        <Console vmId={vmId} scale={state.consoleSize} />
      </div>
    )
  }
)

export default TabConsole
