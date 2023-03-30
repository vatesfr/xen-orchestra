'use strict'

/**
 * Read a chunk of data from a stream.
 *
 * The returned promise is rejected if there is an error while reading the stream.
 *
 * For streams in object mode, the returned promise resolves to a single object read from the stream.
 *
 * For streams in binary mode, the returned promise resolves to a Buffer or a string if an encoding has been specified using the `stream.setEncoding()` method.
 *
 * If `size` bytes are not available to be read, `null` will be returned *unless* the stream has ended, in which case all of the data remaining will be returned.
 *
 * @param {Readable} stream - A readable stream to read from.
 * @param {number} [size] - The number of bytes to read for binary streams (ignored for object streams).
 * @returns {Promise<Buffer|string|unknown|null>} - A Promise that resolves to the read chunk if available, or null if end of stream is reached.
 */
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

/**
 * Read a chunk of data from a stream.
 *
 * The returned promise is rejected if there is an error while reading the stream.
 *
 * For streams in object mode, the returned promise resolves to a single object read from the stream.
 *
 * For streams in binary mode, the returned promise resolves to a Buffer or a string if an encoding has been specified using the `stream.setEncoding()` method.
 *
 * If `size` bytes are not available to be read, the returned promise is rejected.
 *
 * @param {Readable} stream - A readable stream to read from.
 * @param {number} [size] - The number of bytes to read for binary streams (ignored for object streams).
 * @returns {Promise<Buffer|string|unknown>} - A Promise that resolves to the read chunk.
 */
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
