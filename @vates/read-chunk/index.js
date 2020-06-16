exports.readChunk = (stream, size) =>
  new Promise((resolve, reject) => {
    function onEnd() {
      resolve(null)
      removeListeners()
    }
    function onError(error) {
      reject(error)
      removeListeners()
    }
    function onReadable() {
      const data = stream.read(size)
      if (data !== null) {
        resolve(data)
        removeListeners()
      }
    }
    function removeListeners() {
      stream.removeListener('end', onEnd)
      stream.removeListener('error', onError)
      stream.removeListener('readable', onReadable)
    }
    stream.on('end', onEnd)
    stream.on('error', onError)
    stream.on('readable', onReadable)
    onReadable()
  })
