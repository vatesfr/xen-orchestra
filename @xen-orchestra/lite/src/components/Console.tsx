import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import styled from 'styled-components'
import { fibonacci } from 'iterable-backoff'
import { withState } from 'reaclette'

import IntlMessage from './IntlMessage'
import { confirm } from './Modal'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  // Type error with HTMLDivElement.
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
  container: React.RefObject<any>
  // See https://github.com/vatesfr/xen-orchestra/pull/5722#discussion_r619296074
  rfb: any
  rfbConnected: boolean
  timeout?: NodeJS.Timeout
}

interface Props {
  scale: number
  setCtrlAltDel: (sendCtrlAltDel: Effects['sendCtrlAltDel']) => void
  vmId: string
}

interface ParentEffects {}

interface Effects {
  _connect: () => Promise<void>
  _handleConnect: () => void
  _handleDisconnect: () => void
  sendCtrlAltDel: () => void
}

interface Computed {}

interface PropsStyledConsole {
  scale: number
  visible: boolean
}
const StyledConsole = styled.div<PropsStyledConsole>`
  height: ${props => props.scale}%;
  margin: auto;
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  width: ${props => props.scale}%;
`

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      container: React.createRef(),
      rfb: undefined,
      rfbConnected: false,
      timeout: undefined,
    }),
    effects: {
      initialize: function () {
        this.effects._connect()
      },
      _handleConnect: function () {
        this.state.rfbConnected = true
      },
      _handleDisconnect: function () {
        this.state.rfbConnected = false
        this.effects._connect()
      },
      _connect: async function () {
        const { vmId } = this.props
        const { objectsByType, rfb, xapi } = this.state
        let lastError: unknown

        // 8 tries mean 54s
        for (const delay of fibonacci().toMs().take(8)) {
          try {
            const consoles = (objectsByType.get('VM')?.get(vmId) as Vm)?.$consoles.filter(
              vmConsole => vmConsole.protocol === 'rfb'
            )

            if (rfb !== undefined) {
              rfb.removeEventListener('connect', this.effects._handleConnect)
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
            this.state.rfb.addEventListener('connect', this.effects._handleConnect)
            this.state.rfb.addEventListener('disconnect', this.effects._handleDisconnect)
            this.state.rfb.scaleViewport = true
            this.props.setCtrlAltDel(this.effects.sendCtrlAltDel)
            return
          } catch (error) {
            lastError = error
            await new Promise(resolve => (this.state.timeout = setTimeout(resolve, delay)))
          }
        }
        throw lastError
      },
      finalize: function () {
        const { rfb, timeout } = this.state
        rfb.removeEventListener('connect', this.effects._handleConnect)
        rfb.removeEventListener('disconnect', this.effects._handleDisconnect)
        if (timeout !== undefined) {
          clearTimeout(timeout)
        }
      },
      sendCtrlAltDel: async function () {
        await confirm({
          message: <IntlMessage id='confirmCtrlAltDel' />,
          title: <IntlMessage id='ctrlAltDel' />,
        })
        this.state.rfb.sendCtrlAltDel()
      },
    },
  },
  ({ scale, state }) => (
    <>
      {state.rfb !== undefined && !state.rfbConnected && (
        <p>
          <IntlMessage id='reconnectionAttempt' />
        </p>
      )}
      <StyledConsole ref={state.container} scale={scale} visible={state.rfbConnected} />
    </>
  )
)

export default Console
