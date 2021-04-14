import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { withState } from 'reaclette'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  container: React.RefObject<HTMLDivElement>
  isConnected: boolean
}

interface Props {
  vmId: string
}

interface ParentEffects {}

interface Effects {
  _attemptToReconnect: () => void
  _connect: () => void
}

interface Computed {}

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      container: React.createRef(),
      isConnected: false,
    }),
    effects: {
      initialize: function () {
        this.effects._connect()
      },
      _attemptToReconnect: function () {
        this.state.isConnected = false
        const attemptInterval = setInterval(() => {
          this.effects._connect()
          if (this.state.isConnected) {
            clearInterval(attemptInterval)
          }
        }, 1000)
      },
      _connect: async function () {
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

        // eslint-disable-next-line no-new
        new RFB(this.state.container.current, url, {
          wsProtocols: ['binary'],
        }).addEventListener('disconnect', this.effects._attemptToReconnect)
        this.state.isConnected = true
      },
    },
  },
  ({ state }) => <div ref={state.container} />
)

export default Console
