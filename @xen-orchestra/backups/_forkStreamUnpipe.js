const eos = require('end-of-stream')
const { PassThrough } = require('stream')

// create a new readable stream from an existing one which may be piped later
//
// in case of error in the new readable stream, it will simply be unpiped
// from the original one
const forkStreamUnpipe = stream => {
  const { forks = 0 } = stream
  stream.forks = forks + 1

  const proxy = new PassThrough()
  stream.pipe(proxy)
  eos(stream, error => {
    if (error !== undefined) {
      proxy.destroy(error)
    }
  })
  eos(proxy, _ => {
    stream.forks--
    stream.unpipe(proxy)

    if (stream.forks === 0) {
      stream.destroy(new Error('no more consumers for this stream'))
    }
  })
  return proxy
}

exports.forkStreamUnpipe = forkStreamUnpipe
