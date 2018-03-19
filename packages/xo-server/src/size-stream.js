// @flow

// $FlowFixMe
import through2 from 'through2'
import { type Readable } from 'stream'

const createSizeStream = (): Readable & { size: number } => {
  const wrapper = through2((chunk, enc, cb) => {
    wrapper.size += chunk.length
    cb(null, chunk)
  })
  wrapper.size = 0
  return wrapper
}

export { createSizeStream as default }
