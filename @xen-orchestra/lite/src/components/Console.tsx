import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  container: React.RefObject<HTMLDivElement>
  // See https://github.com/vatesfr/xen-orchestra/pull/5722#discussion_r619296074
  rfb: any
  rfbConnected: boolean
}

interface Props {
  scale: number
  vmId: string
}

interface ParentEffects {}

interface Effects {
  _attemptToReconnect: () => void
  _connect: () => void
  _displayConsole: () => void
}

interface Computed {}

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      container: React.createRef(),
      rfb: null,
      rfbConnected: false,
    }),
    effects: {
      initialize: function () {
        this.effects._connect()
      },
      _attemptToReconnect: function () {
        this.state.rfbConnected = false
        setTimeout(() => {
          this.effects._connect()
        }, 1000)
      },
      _connect: async function () {
        const { vmId } = this.props
        const { objectsByType, rfb, xapi } = this.state
        const consoles = (objectsByType.get('VM')?.get(vmId) as Vm)?.$consoles.filter(
          vmConsole => vmConsole.protocol === 'rfb'
        )

        if (rfb !== null) {
          rfb.removeEventListener('connect', this.effects._displayConsole)
          rfb.removeEventListener('disconnect', this.effects._attemptToReconnect)
        }

        if (consoles === undefined || consoles.length === 0) {
          throw new Error('Could not find VM console')
        }

        if (xapi.sessionId === undefined) {
          throw new Error('Not connected to XAPI')
        }

        const url = new URL(consoles[0].location)
        url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        url.searchParams.set('session_id', xapi.sessionId)

        this.state.rfb = new RFB(this.state.container.current, url, {
          wsProtocols: ['binary'],
        })
        this.state.rfb.addEventListener('connect', this.effects._displayConsole)
        this.state.rfb.addEventListener('disconnect', this.effects._attemptToReconnect)
        this.state.rfb.scaleViewport = true
      },
      _displayConsole: function () {
        this.state.rfbConnected = true

        // Need to trigger a resize event to take as consideration
        // the updated css property (display)
        // Issue https://github.com/novnc/noVNC/issues/1364
        // PR https://github.com/novnc/noVNC/pull/1365
        window.dispatchEvent(new UIEvent('resize'))
      },
      finalize: function () {
        this.state.rfb.removeEventListener('connect', this.effects._displayConsole)
        this.state.rfb.removeEventListener('disconnect', this.effects._attemptToReconnect)
      },
    },
  },
  ({ scale, state }) => (
    <>
      {state.rfb !== null && !state.rfbConnected && (
        <p>
          <FormattedMessage id='reconnectionAttempt' />
        </p>
      )}
      <div
        ref={state.container}
        style={{
          display: `${state.rfbConnected ? 'block' : 'none'}`,
          margin: 'auto',
          height: `${scale}%`,
          width: `${scale}%`,
        }}
      />
    </>
  )
)

export default Console
