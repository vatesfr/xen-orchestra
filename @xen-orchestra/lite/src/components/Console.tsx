import PropTypes from 'prop-types'
import React from 'react'
import RFB from '@novnc/novnc/lib/rfb'
import { injectState, provideState } from 'reaclette'

import { EffectContext, RenderParams } from '../../types/reaclette'

// https://github.com/novnc/noVNC/blob/master/docs/API.md
const Console = [
  provideState({
    initialState: () => ({
      container: React.createRef(),
    }),
    effects: {
      initialize: async function (this: EffectContext) {
        const { vmId } = this.props
        const { objectsByType, xapi } = this.state
        const consoles = objectsByType
          .get('VM')
          .get(vmId)
          .$consoles.filter((vmConsole: { protocol: string }) => vmConsole.protocol === 'rfb')

        if (consoles.length === 0) {
          throw new Error('Could not find VM console')
        }

        const url = new URL(consoles[0].location)
        url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        url.searchParams.set('session_id', xapi.sessionId)

        // eslint-disable-next-line no-new
        new RFB(this.state.container.current, url, {
          wsProtocols: ['binary'],
        })
      },
    },
  }),
  injectState,
  ({ state }: RenderParams) => <div ref={state.container} />,
].reduceRight((value, fn) => fn(value))

Console.propTypes = {
  vmId: PropTypes.string,
}

export default Console
