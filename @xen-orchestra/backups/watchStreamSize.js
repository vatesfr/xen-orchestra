exports.watchStreamSize = stream => {
  const container = { size: 0 }
  stream.on('data', data => {
    container.size += data.length
  })
  stream.pause()
  return container
}
