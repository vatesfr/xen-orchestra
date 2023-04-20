import through2 from 'through2'
import { createHash } from 'crypto'
import { defer, fromEvent } from 'promise-toolbox'
import invert from 'lodash/invert.js'

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

// Create a through stream which computes the checksum of all data going
// through.
//
// The `checksum` attribute is a promise which resolves at the end of the stream
// with a string representation of the checksum.
//
//    const source = ...
//    const checksumStream = source.pipe(createChecksumStream())
//    checksumStream.resume() // make the data flow without an output
//    console.log(await checksumStream.checksum)
export const createChecksumStream = (algorithm = 'md5') => {
  const algorithmId = ALGORITHM_TO_ID[algorithm]

  if (!algorithmId) {
    throw new Error(`unknown algorithm: ${algorithm}`)
  }

  const hash = createHash(algorithm)
  const { promise, resolve, reject } = defer()

  const stream = through2(
    (chunk, enc, callback) => {
      hash.update(chunk)
      callback(null, chunk)
    },
    callback => {
      resolve(`$${algorithmId}$$${hash.digest('hex')}`)
      callback()
    }
  ).once('error', reject)
  stream.checksum = promise
  return stream
}

// Check if the checksum of a readable stream is equals to an expected checksum.
// The given stream is wrapped in a stream which emits an error event
// if the computed checksum is not equals to the expected checksum.
export const validChecksumOfReadStream = (stream, expectedChecksum) => {
  const algorithmId = expectedChecksum.slice(1, expectedChecksum.indexOf('$', 1))

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
          checksum !== expectedChecksum ? new Error(`Bad checksum (${checksum}), expected: ${expectedChecksum}`) : null
        )
      }
    )
  )

  stream.on('error', error => wrapper.emit('error', error))
  wrapper.checksumVerified = fromEvent(wrapper, 'end')

  return wrapper
}
