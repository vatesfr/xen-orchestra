'use strict'

exports.watchStreamSize = function watchStreamSize(stream, container = { size: 0 }) {
  stream.on('data', data => {
    container.size += data.length
  })
  stream.pause()
  return container
}
