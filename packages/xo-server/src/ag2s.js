import { Readable } from 'stream'

// return the next value of the iterator but if it is a promise, resolve it and
// reinject it
//
// this enables the use of a simple generator instead of an async generator
// (which are less widely supported)
const next = async (iterator, arg) => {
  let cursor = iterator.next(arg)
  if (typeof cursor.then === 'function') {
    return cursor
  }
  let value
  while (
    !cursor.done &&
    (value = cursor.value) != null &&
    typeof value.then === 'function'
  ) {
    let success = false
    try {
      value = await value
      success = true
    } catch (error) {
      cursor = iterator.throw(error)
    }
    if (success) {
      cursor = iterator.next(value)
    }
  }
  return cursor
}

// Create a readable stream from a generator
//
// generator can be async or can yield promises to wait for them
export const createReadable = (generator, options) => {
  const readable = new Readable(options)
  readable._read = size => {
    const iterator = generator(size)
    readable._destroy = (error, cb) => {
      iterator.throw(error)
      cb(error)
    }
    let running = false
    const read = (readable._read = async size => {
      if (running) {
        return
      }
      running = true
      try {
        let cursor
        do {
          cursor = await next(iterator, size)
          if (cursor.done) {
            return readable.push(null)
          }
        } while (readable.push(cursor.value))
      } catch (error) {
        readable.emit('error', error)
      } finally {
        running = false
      }
    })
    return read(size)
  }

  return readable
}
