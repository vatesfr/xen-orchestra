import { Metadata } from './_runners/Metadata.mjs'
import { VmsRemote } from './_runners/VmsRemote.mjs'
import { VmsXapi } from './_runners/VmsXapi.mjs'

export function createRunner(opts) {
  const { type } = opts.job
  switch (type) {
    case 'backup':
      return new VmsXapi(opts)
    case 'mirrorBackup':
      return new VmsRemote(opts)
    case 'metadataBackup':
      return new Metadata(opts)
    default:
      throw new Error(`No runner for the backup type ${type}`)
  }
}
