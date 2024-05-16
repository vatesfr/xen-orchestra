import { createLogger } from '@xen-orchestra/log'
import { finished, PassThrough } from 'node:stream'

const { debug } = createLogger('xo:backups:forkStreamUnpipe')

// create a new readable stream from an existing one which may be piped later
//
// in case of error in the new readable stream, it will simply be unpiped
// from the original one
export function forkStreamUnpipe(source) {
  const { forks = 0 } = source
  source.forks = forks + 1

  debug('forking', { forks: source.forks })

  const fork = new PassThrough()
  source.pipe(fork)
  finished(source, { writable: false }, error => {
    if (error !== undefined) {
      debug('error on original stream, destroying fork', { error })
      fork.destroy(error)
    }
  })
  finished(fork, { readable: false }, error => {
    debug('end of stream, unpiping', { error, forks: --source.forks })

    source.unpipe(fork)

    if (source.forks === 0) {
      debug('no more forks, destroying original stream')
      source.destroy(new Error('no more consumers for this stream'))
    } else {
      // a combination of stream.unpipe, onReadable and onData may stall stream here
      // force it to flow again since we're piping it
      source.resume()
    }
  })
  return fork
}
