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
      initialize: function (this: EffectContext) {
        // eslint-disable-next-line no-new
        new RFB(
          this.state.container.current,
          `ws://${this.state.xapiHostname}/console?uuid=${this.props.vmId}&session_id=${
            this.state.xapi.sessionId
          }`,
          {
            wsProtocols: ['binary'],
          }
        )
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
