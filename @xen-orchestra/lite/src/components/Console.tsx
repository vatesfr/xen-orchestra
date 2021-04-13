import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { withState } from 'reaclette'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface RFB {
  sendCtrlAltDel: () => void
}

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  container: React.RefObject<HTMLDivElement>
}

interface Props {
  setRFB: (RFB: RFB) => void
  vmId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      container: React.createRef(),
    }),
    effects: {
      initialize: async function () {
        const { setRFB, vmId } = this.props
        const { objectsByType, xapi } = this.state
        const consoles = (objectsByType.get('VM')?.get(vmId) as Vm)?.$consoles.filter(
          vmConsole => vmConsole.protocol === 'rfb'
        )

        if (consoles === undefined || consoles.length === 0) {
          throw new Error('Could not find VM console')
        }

        if (xapi.sessionId === undefined) {
          throw new Error('Not connected to XAPI')
        }

        const url = new URL(consoles[0].location)
        url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        url.searchParams.set('session_id', xapi.sessionId)

        setRFB(
          new RFB(this.state.container.current, url, {
            wsProtocols: ['binary'],
          })
        )
      },
    },
  },
  ({ state }) => <div ref={state.container} />
)

export default Console
