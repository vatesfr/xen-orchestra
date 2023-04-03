'use strict'

const assert = require('assert')

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
    : new Promise((resolve, reject) => {
        if (size !== undefined) {
          assert(size > 0)

          // per Node documentation:
          // > The size argument must be less than or equal to 1 GiB.
          assert(size < 1073741824)
        }

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

/**
 * Skips a given number of bytes from a readable stream.
 *
 * @param {Readable} stream - A readable stream to skip bytes from.
 * @param {number} size - The number of bytes to skip.
 * @returns {Promise<number>} A Promise that resolves to the number of bytes actually skipped. If the end of the stream is reached before all bytes are skipped, the Promise resolves to the number of bytes that were skipped before the end of the stream was reached. The Promise is rejected if there is an error while reading from the stream.
 */
async function skip(stream, size) {
  return size === 0 || stream.closed || stream.readableEnded
    ? Promise.resolve(0)
    : new Promise((resolve, reject) => {
        let left = size
        function onEnd() {
          resolve(size - left)
          removeListeners()
        }
        function onError(error) {
          reject(error)
          removeListeners()
        }
        function onReadable() {
          const data = stream.read()
          left -= data === null ? 0 : data.length
          if (left > 0) {
            // continue to read
          } else {
            // if more than wanted has been read, push back the rest
            if (left < 0) {
              stream.unshift(data.slice(left))
            }

            resolve(size)
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
}
exports.skip = skip

/**
 * Skips a given number of bytes from a stream.
 *
 * @param {Readable} stream - A readable stream to skip bytes from.
 * @param {number} size - The number of bytes to skip.
 * @returns {Promise<void>} - A Promise that resolves when the exact number of bytes have been skipped. The Promise is rejected if there is an error while reading from the stream or the stream ends before the exact number of bytes have been skipped.
 */
exports.skipStrict = async function skipStrict(stream, size) {
  const bytesSkipped = await skip(stream, size)
  if (bytesSkipped !== size) {
    const error = new Error('stream has ended with not enough data')
    error.bytesSkipped = bytesSkipped
    throw error
  }
}
