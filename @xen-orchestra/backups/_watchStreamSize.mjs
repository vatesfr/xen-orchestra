import { TaskProgressHandler } from './_runners/_vmRunners/_TaskProgressHandler.mjs'

/**
 * @param {import('node:stream').Readable} stream
 * @param {{ size: number, progressHandler?: TaskProgressHandler }} [container]
 *   a source `progressHandler` (`TaskProgressHandler.forSource()`) also reports the number of bytes read
 */
export function watchStreamSize(stream, container = { size: 0 }) {
  const progressHandler = container.progressHandler ?? new TaskProgressHandler()
  stream.on('data', data => {
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      progressHandler.setProgress(container.size / stream.length)
    }
    progressHandler.setTransferredSize(container.size)
  })

  // a readable only emits 'end', a duplex (throttled stream) emits both
  let isComplete = false
  const complete = () => {
    if (!isComplete) {
      isComplete = true
      progressHandler.setProgress(1)
      progressHandler.setTransferredSize(container.size, { isComplete: true })
    }
  }
  stream.on('end', complete)
  stream.on('finish', complete)
  stream.pause()
  return container
}
