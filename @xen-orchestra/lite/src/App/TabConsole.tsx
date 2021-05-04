import React from 'react'
import { withState } from 'reaclette'

import Button from '../components/Button'
import Console from '../components/Console'
import { FormattedMessage } from 'react-intl'

interface ParentState {}

interface State {
  sendCtrlAltDel?: () => void
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  noop: () => void
  setCtrlAltDel: (sendCtrlAltDel: State['sendCtrlAltDel']) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      sendCtrlAltDel: undefined,
    }),
    effects: {
      noop: function () {},
      setCtrlAltDel: function (sendCtrlAltDel) {
        this.state.sendCtrlAltDel = sendCtrlAltDel
      },
    },
  },
  ({ effects, state, vmId }) => (
    <div style={{ height: '100vh' }}>
      <Button label={<FormattedMessage id='ctrlAltDel' />} onClick={state.sendCtrlAltDel !== undefined ? state.sendCtrlAltDel : effects.noop}/>
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
    </div>
  )
)

export default TabConsole
