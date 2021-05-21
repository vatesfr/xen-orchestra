import assert from 'assert'

const streamToExistingBuffer = (stream, buffer, offset = 0, end = buffer.length) =>
  new Promise((resolve, reject) => {
    assert(offset >= 0)
    assert(end > offset)
    assert(end <= buffer.length)

    let i = offset

    const onData = chunk => {
      const prev = i
      i += chunk.length

      if (i > end) {
        return onError(new Error('too much data'))
      }

      chunk.copy(buffer, prev)
    }
    stream.on('data', onData)

    const clean = () => {
      stream.removeListener('data', onData)
      stream.removeListener('end', onEnd)
      stream.removeListener('error', onError)
    }
    const onEnd = () => {
      resolve(i - offset)
      clean()
    }
    stream.on('end', onEnd)
    const onError = error => {
      reject(error)
      clean()
    }
    stream.on('error', onError)
  })

export { streamToExistingBuffer as default }
