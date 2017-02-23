import from2 from 'from2'

const constantStream = (data, n = 1) => {
  if (!Buffer.isBuffer(data)) {
    data = Buffer.from(data)
  }

  const { length } = data

  if (!length) {
    throw new Error('data should not be empty')
  }

  n *= length
  let currentLength = length

  return from2((size, next) => {
    if (n <= 0) {
      return next(null, null)
    }

    if (n < size) {
      size = n
    }

    if (size < currentLength) {
      const m = Math.floor(size / length) * length || length
      n -= m
      return next(null, data.slice(0, m))
    }

    // if more than twice the data length is requested, repeat the data
    if (size > currentLength * 2) {
      currentLength = Math.floor(size / length) * length
      data = Buffer.alloc(currentLength, data)
    }

    n -= currentLength
    return next(null, data)
  })
}
export { constantStream as default }
