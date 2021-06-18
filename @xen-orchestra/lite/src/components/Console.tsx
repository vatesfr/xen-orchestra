import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { fibonacci } from 'iterable-backoff'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import { confirm } from './Modal'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  _timeout?: NodeJS.Timeout
  container: React.RefObject<HTMLDivElement>
  // See https://github.com/vatesfr/xen-orchestra/pull/5722#discussion_r619296074
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rfb: any
  rfbConnected: boolean
}

interface Props {
  scale: number
  setCtrlAltDel: (sendCtrlAltDel: Effects['sendCtrlAltDel']) => void
  vmId: string
}

interface ParentEffects {}

interface Effects {
  _connect: () => Promise<void>
  _displayConsole: () => void
  _handleDisconnect: () => void
  sendCtrlAltDel: () => void
}

interface Computed {}

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      _timeout: undefined,
      container: React.createRef(),
      rfb: undefined,
      rfbConnected: false,
    }),
    effects: {
      initialize: function () {
        this.effects._connect()
      },
      _handleDisconnect: function () {
        this.state.rfbConnected = false
        this.effects._connect()
      },
      _connect: async function () {
        const { vmId } = this.props
        const { objectsByType, rfb, xapi } = this.state

        // 8 tries mean 54s
        for (const delay of fibonacci().toMs().take(8)) {
          try {
            const consoles = (objectsByType.get('VM')?.get(vmId) as Vm)?.$consoles.filter(
              vmConsole => vmConsole.protocol === 'rfb'
            )

            if (rfb !== undefined) {
              rfb.removeEventListener('connect', this.effects._displayConsole)
              rfb.removeEventListener('disconnect', this.effects._handleDisconnect)
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
            this.state.rfb.addEventListener('disconnect', this.effects._handleDisconnect)
            this.state.rfb.scaleViewport = true
            this.props.setCtrlAltDel(this.effects.sendCtrlAltDel)
            return
          } catch (error) {
            await new Promise(resolve => (this.state._timeout = setTimeout(() => resolve(''), delay)))
          }
        }
        throw new Error('Unable to connect to the VM console. Too many attempts')
      },
      _displayConsole: function () {
        this.state.rfbConnected = true
      },
      finalize: function () {
        const { rfb, _timeout } = this.state
        rfb.removeEventListener('connect', this.effects._displayConsole)
        rfb.removeEventListener('disconnect', this.effects._handleDisconnect)
        if (_timeout !== undefined) {
          clearTimeout(_timeout)
        }
      },
      sendCtrlAltDel: async function () {
        await confirm({
          message: <FormattedMessage id='confirmCtrlAltDel' />,
          title: <FormattedMessage id='ctrlAltDel' />,
        })
        this.state.rfb.sendCtrlAltDel()
      },
    },
  },
  ({ scale, state }) => (
    <>
      {state.rfb !== undefined && !state.rfbConnected && (
        <p>
          <FormattedMessage id='reconnectionAttempt' />
        </p>
      )}
      <div
        ref={state.container}
        style={{
          // Prevent canvas from flashing while noVNC is still trying to connect
          visibility: `${state.rfbConnected ? 'visible' : 'hidden'}`,
          margin: 'auto',
          height: `${scale}%`,
          width: `${scale}%`,
        }}
      />
    </>
  )
)

export default Console
