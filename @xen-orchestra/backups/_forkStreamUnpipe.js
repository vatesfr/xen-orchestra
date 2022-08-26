'use strict'

const eos = require('end-of-stream')
const { PassThrough } = require('stream')

const { debug } = require('@xen-orchestra/log').createLogger('xo:backups:forkStreamUnpipe')

// create a new readable stream from an existing one which may be piped later
//
// in case of error in the new readable stream, it will simply be unpiped
// from the original one
exports.forkStreamUnpipe = function forkStreamUnpipe(stream) {
  const { forks = 0 } = stream
  stream.forks = forks + 1

  debug('forking', { forks: stream.forks })

  const proxy = new PassThrough()
  stream.pipe(proxy)
  eos(stream, error => {
    if (error !== undefined) {
      debug('error on original stream, destroying fork', { error })
      proxy.destroy(error)
    }
  })
  eos(proxy, error => {
    debug('end of stream, unpiping', { error, forks: --stream.forks })

    stream.unpipe(proxy)

    if (stream.forks === 0) {
      debug('no more forks, destroying original stream')
      stream.destroy(new Error('no more consumers for this stream'))
    }
  })
  return proxy
}
