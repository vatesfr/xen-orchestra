import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { withState } from 'reaclette'

import RangeInput from './RangeInput'

import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  container: React.RefObject<HTMLDivElement>
}

interface Props {
  vmId: string
  scale: number
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

        const rfb = new RFB(this.state.container.current, url, {
          wsProtocols: ['binary'],
        })
        rfb.scaleViewport = true
      }
    },
  },
  ({ state }) => {
    const [consoleSize, setConsoleSize] = React.useState({
      height: 768,
      width: 1024
    })

    const resizeEvent = React.useMemo(() => new UIEvent('resize')
    ,[])

    const _scaleConsole = React.useCallback((value: number) => {
      setConsoleSize({
        height: 768 * value,
        width: 1024 * value
      })

      // To resize the console automatically
      // rfb.resizeSession not working
      window.dispatchEvent(resizeEvent)
    },[])

    return (
    <>
      <RangeInput defaultValue={1} max={3} min={0.1} onChange={_scaleConsole} step={0.1} />
      <div ref={state.container} style={consoleSize}/>
    </>
    )

  }
)

export default Console
