'use strict'

const { Metadata } = require('./_runners/Metadata.js')
const { VmsRemote } = require('./_runners/VmsRemote.js')
const { VmsXapi } = require('./_runners/VmsXapi.js')

exports.createRunner = function createRunner(opts) {
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
