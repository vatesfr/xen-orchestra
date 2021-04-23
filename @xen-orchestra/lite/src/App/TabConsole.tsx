import React from 'react'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import Console from '../components/Console'
import RangeInput from '../components/RangeInput'
import { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {
  consoleScale: number
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  scaleConsole: React.ChangeEventHandler<HTMLInputElement>
}

interface Computed {
  vm: Vm
}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      // Value in percent
      consoleScale: 100,
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
    },
    computed: {
      vm: (state, { vmId }) => state.objectsByType.get('VM')?.get(vmId) as Vm,
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100vh' }}>
      {state.vm.power_state !== 'Running' ? (
        <p>
          <FormattedMessage id='consoleNotAvailable' />
        </p>
      ) : (
        <>
          <RangeInput max={100} min={1} onChange={effects.scaleConsole} step={1} value={state.consoleScale} />
          <Console scale={state.consoleScale} vmId={vmId} />
        </>
      )}
    </div>
  )
)

export default TabConsole
