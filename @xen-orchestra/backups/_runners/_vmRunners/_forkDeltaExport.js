'use strict'

const { mapValues } = require('lodash')
const { forkStreamUnpipe } = require('../_forkStreamUnpipe')

exports.forkDeltaExport = function forkDeltaExport(deltaExport) {
  return Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })
}
