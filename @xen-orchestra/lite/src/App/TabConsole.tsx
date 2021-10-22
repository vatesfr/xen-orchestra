import React from 'react'
import { withState } from 'reaclette'

import Button from '../components/Button'
import Console from '../components/Console'
import IntlMessage from '../components/IntlMessage'
import RangeInput from '../components/RangeInput'
import { ObjectsByType, Vm } from '../libs/xapi'
import TitleBar from '../components/TitleBar'

interface ParentState {
  objectsByType: ObjectsByType
}

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

interface Computed {
  vm?: Vm
}

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
    computed: {
      vm: (state, { vmId }) => state.objectsByType.get('VM')?.get(vmId),
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100%' }}>
      {state.vm?.power_state !== 'Running' ? (
        <p>
          <IntlMessage id='consoleNotAvailable' />
        </p>
      ) : (
        <>
          <TitleBar actions={[
            {
              icon: 'trash',
              className: "mui-btn--primary",
              title: "don't delete me, please"
            }
          ]}>{state.vm?.name_label ?? 'loading'} </TitleBar>
          {/* Hide scaling and Ctrl+Alt+Del button temporarily */}
          {/* <RangeInput max={100} min={1} onChange={effects.scaleConsole} step={1} value={state.consoleScale} />
          {state.sendCtrlAltDel !== undefined && (
            <Button onClick={state.sendCtrlAltDel}>
              <IntlMessage id='ctrlAltDel' />
            </Button>
          )} */}
          <Console vmId={vmId} scale={state.consoleScale} setCtrlAltDel={effects.setCtrlAltDel} />
        </>
      )}
    </div>
  )
)

export default TabConsole
