'use strict'

const assert = require('node:assert')
const { finished, Readable } = require('node:stream')

const noop = Function.prototype

// Inspired by https://github.com/nodejs/node/blob/85705a47958c9ae5dbaa1f57456db19bdefdc494/lib/internal/streams/readable.js#L1107
class StreamReader {
  #ended = false
  #error
  #executor = resolve => {
    this.#resolve = resolve
  }
  #stream
  #resolve = noop

  constructor(stream) {
    stream = typeof stream.pipe === 'function' ? stream : Readable.from(stream)

    this.#stream = stream

    stream.on('readable', () => this.#resolve())

    finished(stream, { writable: false }, error => {
      this.#error = error
      this.#ended = true
      this.#resolve()
    })
  }

  async read(size) {
    if (size !== undefined) {
      assert(size > 0)
    }

    do {
      if (this.#ended) {
        if (this.#error) {
          throw this.#error
        }
        return null
      }

      const value = this.#stream.read(size)
      if (value !== null) {
        return value
      }

      await new Promise(this.#executor)
    } while (true)
  }

  async readStrict(size) {
    const chunk = await this.read(size)
    if (chunk === null) {
      throw new Error('stream has ended without data')
    }

    if (size !== undefined && chunk.length !== size) {
      const error = new Error(`stream has ended with not enough data (actual: ${chunk.length}, expected: ${size})`)
      Object.defineProperties(error, {
        chunk: {
          value: chunk,
        },
      })
      throw error
    }

    return chunk
  }

  async skip(size) {
    if (size === 0) {
      return size
    }

    let toSkip = size
    do {
      if (this.#ended) {
        if (this.#error) {
          throw this.#error
        }
        return size - toSkip
      }

      const data = this.#stream.read()
      if (data !== null) {
        toSkip -= data === null ? 0 : data.length
        if (toSkip > 0) {
          // continue to read
        } else {
          // if more than wanted has been read, push back the rest
          if (toSkip < 0) {
            this.#stream.unshift(data.slice(toSkip))
          }

          return size
        }
      }

      await new Promise(this.#executor)
    } while (true)
  }

  async skipStrict(size) {
    const bytesSkipped = await this.skip(size)
    if (bytesSkipped !== size) {
      const error = new Error(`stream has ended with not enough data (actual: ${bytesSkipped}, expected: ${size})`)
      error.bytesSkipped = bytesSkipped
      throw error
    }
  }
}

StreamReader.prototype[Symbol.asyncIterator] = async function* asyncIterator() {
  let chunk
  while ((chunk = await this.read()) !== null) {
    yield chunk
  }
}

module.exports = StreamReader
