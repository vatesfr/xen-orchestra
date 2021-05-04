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
  sendCtrlAltDel: React.MouseEventHandler
  setCtrlAltDel: (sendCtrlAltDel: State['sendCtrlAltDel']) => void
}

interface Computed {}

const TabConsole = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      sendCtrlAltDel: undefined,
    }),
    effects: {
      sendCtrlAltDel: function () {
        const { sendCtrlAltDel } = this.state
        sendCtrlAltDel !== undefined && sendCtrlAltDel
      },
      setCtrlAltDel: function (sendCtrlAltDel) {
        this.state.sendCtrlAltDel = sendCtrlAltDel
      },
    },
  },
  ({ effects, vmId }) => (
    <div style={{ height: '100vh' }}>
      <Button label={<FormattedMessage id='ctrlAltDel' />} onClick={effects.sendCtrlAltDel} />
      <Console vmId={vmId} setCtrlAltDel={effects.setCtrlAltDel} />
    </div>
  )
)

export default TabConsole
