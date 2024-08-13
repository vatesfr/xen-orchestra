import { createLogger } from '@xen-orchestra/log'
import { finished, PassThrough } from 'node:stream'

const { debug } = createLogger('xo:backups:forkStreamUnpipe')

// create a new readable stream from an existing one which may be piped later
//
// in case of error in the new readable stream, it will simply be unpiped
// from the original one
export function forkStreamUnpipe(source) {
  const { forks = 0, id = Math.round(Math.random() * 1000) } = source
  source.forks = forks + 1
  source.id = id

  debug('forking', { forks: source.forks, id: source.id })

  const fork = new PassThrough()
  fork.id = Math.round(Math.random() * 1000)
  source.pipe(fork)
  let stillPiped = true

  function unpipeFork() {
    source.unpipe(fork)
    --source.forks
    stillPiped = false
  }

  finished(source, { writable: false }, error => {
    if (stillPiped) {
      debug('finished source stream, destroying fork', { error, id: source.id, forkId: fork.id })
      unpipeFork()
      // from https://nodejs.org/api/stream.html
      // By default, stream.end() is called on the destination Writable stream when the source Readable stream emits 'end', so that the destination is no longer writable.
      // One important caveat is that if the Readable stream emits an error during processing, the Writable destination is not closed automatically. If an error occurs, it will be necessary to manually close each stream in order to prevent memory leaks.
      if (error !== undefined) {
        debug('source errored, destroy fork')
        fork.destroy(error)
      }
    } else {
      debug('finished source stream, already handled')
    }
  })
  finished(fork, { readable: false }, error => {
    if (stillPiped) {
      debug('end of forked stream, unpiping', { error, forks: source.forks, id: source.id, forkId: fork.id })
      unpipeFork()
      if (source.forks === 0) {
        debug('no more forks, destroy source')
        // this will trigger the finished(source , ) code block an all other forks
        source.destroy(error)
      } else {
        // a combination of stream.unpipe, onReadable and onData may stall stream here
        // force it to flow again since we're piping it
        source.resume()
      }
    } else {
      debug('end of forked stream already handled')
    }
  })
  return fork
}
