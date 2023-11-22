import cloneDeep from 'lodash/cloneDeep.js'
import mapValues from 'lodash/mapValues.js'

import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'

export function forkDeltaExport(deltaExport) {
  const { streams, ...rest } = deltaExport
  const newMetadata = cloneDeep(rest)
  newMetadata.streams = mapValues(streams, forkStreamUnpipe)
  return newMetadata
}
