import through2 from 'through2'

const createSizeStream = () => {
  const wrapper = through2((chunk, enc, cb) => {
    wrapper.size += chunk.length
    cb(null, chunk)
  })
  wrapper.size = 0
  return wrapper
}

export { createSizeStream as default }
