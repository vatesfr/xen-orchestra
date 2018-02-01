const streamToNewBuffer = stream => new Promise((resolve, reject) => {
  const chunks = []
  let length = 0

  const onData = chunk => {
    chunks.push(chunk)
    length += chunk.length
  }
  stream.on('data', onData)

  const clean = () => {
    stream.removeListener('data', onData)
    stream.removeListener('end', onEnd)
    stream.removeListener('error', onError)
  }
  const onEnd = () => {
    resolve(Buffer.concat(chunks, length))
    clean()
  }
  stream.on('end', onEnd)
  const onError = error => {
    reject(error)
    clean()
  }
  stream.on('error', onError)
})
export { streamToNewBuffer as default }
