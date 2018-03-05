import invert from 'lodash/invert'
import through2 from 'through2'
import { createHash } from 'crypto'
import { defer, fromEvent } from 'promise-toolbox'

const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

// Wrap a readable stream in a stream with a checksum promise
// attribute which is resolved at the end of an input stream.
// (Finally .checksum contains the checksum of the input stream)
//
// Example:
// const sourceStream = ...
// const targetStream = ...
// const checksumStream = addChecksumToReadStream(sourceStream)
// await Promise.all([
//   fromEvent(checksumStream.pipe(targetStream), 'finish'),
//   checksumStream.checksum.then(console.log)
// ])
export const addChecksumToReadStream = (stream, algorithm = 'md5') => {
  const algorithmId = ALGORITHM_TO_ID[algorithm]

  if (!algorithmId) {
    throw new Error(`unknown algorithm: ${algorithm}`)
  }

  const hash = createHash(algorithm)
  const { promise, resolve } = defer()

  const wrapper = stream.pipe(
    through2(
      (chunk, enc, callback) => {
        hash.update(chunk)
        callback(null, chunk)
      },
      callback => {
        resolve(hash.digest('hex'))
        callback()
      }
    )
  )

  stream.on('error', error => wrapper.emit('error', error))
  wrapper.checksum = promise.then(hash => `$${algorithmId}$$${hash}`)

  return wrapper
}

// Check if the checksum of a readable stream is equals to an expected checksum.
// The given stream is wrapped in a stream which emits an error event
// if the computed checksum is not equals to the expected checksum.
export const validChecksumOfReadStream = (stream, expectedChecksum) => {
  const algorithmId = expectedChecksum.slice(
    1,
    expectedChecksum.indexOf('$', 1)
  )

  if (!algorithmId) {
    throw new Error(`unknown algorithm: ${algorithmId}`)
  }

  const hash = createHash(ID_TO_ALGORITHM[algorithmId])

  const wrapper = stream.pipe(
    through2(
      { highWaterMark: 0 },
      (chunk, enc, callback) => {
        hash.update(chunk)
        callback(null, chunk)
      },
      callback => {
        const checksum = `$${algorithmId}$$${hash.digest('hex')}`

        callback(
          checksum !== expectedChecksum
            ? new Error(
              `Bad checksum (${checksum}), expected: ${expectedChecksum}`
            )
            : null
        )
      }
    )
  )

  stream.on('error', error => wrapper.emit('error', error))
  wrapper.checksumVerified = fromEvent(wrapper, 'end')

  return wrapper
}
