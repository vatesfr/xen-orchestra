import mapValues from 'lodash/mapValues.js'

import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'

export function forkDeltaExport(deltaExport) {
  return Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })
}
