exports.watchStreamSize = stream => {
  const container = { size: 0 }
  const isPaused = stream.isPaused()
  stream.on('data', data => {
    container.size += data.length
  })
  if (isPaused) {
    stream.pause()
  }
  return container
}
