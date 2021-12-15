import React from 'react'
import { withState } from 'reaclette'

import Console from '../components/Console'
import IntlMessage, { translate } from '../components/IntlMessage'
import { ObjectsByType, Vm } from '../libs/xapi'
import PanelHeader from '../components/PanelHeader'

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
  showNotImplemented: () => void
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
      showNotImplemented: function () {
        alert('Not Implemented')
      },
    },
    computed: {
      vm: (state, { vmId }) => state.objectsByType.get('VM')?.get(vmId),
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader
        actions={[
          {
            key: 'start',
            icon: 'play',
            color: 'primary',
            title: translate({ id: 'vmStartLabel' }),
            variant: 'contained',
            onClick: effects.showNotImplemented,
          },
        ]}
      >
        {state.vm?.name_label ?? 'loading'}{' '}
      </PanelHeader>

      {/* Hide scaling and Ctrl+Alt+Del button temporarily */}
      {/* <RangeInput max={100} min={1} onChange={effects.scaleConsole} step={1} value={state.consoleScale} />
          {state.sendCtrlAltDel !== undefined && (
            <Button onClick={state.sendCtrlAltDel}>
              <IntlMessage id='ctrlAltDel' />
            </Button>
          )} */}
      {state.vm?.power_state !== 'Running' ? (
        <p>
          <IntlMessage id='consoleNotAvailable' />
        </p>
      ) : (
        <div  style={{ flex: 1, position: 'relative' }}>
          <Console vmId={vmId} scale={state.consoleScale} setCtrlAltDel={effects.setCtrlAltDel}/>
        </div>
      )}
    </div>
  )
)

export default TabConsole
