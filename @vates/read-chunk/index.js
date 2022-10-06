'use strict'

const readChunk = (stream, size) =>
  stream.closed || stream.readableEnded
    ? Promise.resolve(null)
    : size === 0
    ? Promise.resolve(Buffer.alloc(0))
    : new Promise((resolve, reject) => {
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
exports.readChunk = readChunk

exports.readChunkStrict = async function readChunkStrict(stream, size) {
  const chunk = await readChunk(stream, size)
  if (chunk === null) {
    throw new Error('stream has ended without data')
  }

  if (size !== undefined && chunk.length !== size) {
    const error = new Error('stream has ended with not enough data')
    Object.defineProperties(error, {
      chunk: {
        value: chunk,
      },
    })
    throw error
  }

  return chunk
}
