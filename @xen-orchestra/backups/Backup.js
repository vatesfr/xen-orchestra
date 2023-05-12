'use strict'

const { Runner } = require('./_Runner.js')

exports.createRunner = function createRunner(opts) {
  const { type } = opts.job
  switch (type) {
    case 'backup':
      return new Runner(opts)
    case 'metadataBackup':
      return new Runner(opts)
    default:
      throw new Error(`No runner for the backup type ${type}`)
  }
}
