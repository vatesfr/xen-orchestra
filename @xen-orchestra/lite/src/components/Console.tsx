import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { withState } from 'reaclette'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

// Remove when "novnc" types work
interface RFB {
  sendCtrlAltDel: () => void
}

export interface IConsole {
  _effects: Effects
}

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  container: React.RefObject<HTMLDivElement>
  RFB: RFB | null
}

interface Props {
  ref: React.RefObject<IConsole>
  vmId: string
  scale: number
}

interface ParentEffects {}

interface Effects {
  sendCtrlAltDel: () => void
}

interface Computed {}

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      container: React.createRef(),
      RFB: null,
    }),
    effects: {
      initialize: async function () {
        const { vmId } = this.props
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

        this.state.RFB = new RFB(this.state.container.current, url, {
          wsProtocols: ['binary'],
        })
      },
      sendCtrlAltDel: function () {
        confirm('Send Ctrl+Alt+Del to VM?') && this.state.RFB?.sendCtrlAltDel()
      },
      sendCtrlAltDel: function () {
        confirm('Send Ctrl+Alt+Del to VM?') && this.state.RFB?.sendCtrlAltDel()
      },
    },
  },
  ({ scale, state }) => (
    <div ref={state.container} style={{ margin: 'auto', height: `${scale}%`, width: `${scale}%` }} />
  )
)

export default Console
