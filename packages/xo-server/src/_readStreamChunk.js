function onEnd() {
  this.onError(new Error('unexpected end of stream'))
}

function onError(reject, error) {
  reject(error)
  removeListeners.call(this)
}

function onReadable(resolve, size) {
  const data = this.stream.read(size)
  if (data !== null) {
    resolve(data)
    removeListeners.call(this)
  }
}

function removeListeners() {
  const { onEnd, onError, onReadable, stream } = this
  stream.removeListener('end', onEnd)
  stream.removeListener('error', onError)
  stream.removeListener('readable', onReadable)
}

function Reader(stream, size, resolve, reject) {
  stream.on('end', (this.onEnd = onEnd.bind(this, reject)))
  stream.on('error', (this.onError = onError.bind(this, reject)))
  stream.on('readable', (this.onReadable = onReadable.bind(this, resolve, size)))
  this.stream = stream
}

export default (stream, size) =>
  new Promise((resolve, reject) => {
    new Reader(stream, size, resolve, reject).onReadable()
  })
