import { TaskProgressHandler } from './_runners/_vmRunners/_TaskProgressHandler.mjs'

/**
 * @param {import('node:stream').Readable} stream
 * @param {{ size: number, progressHandler?: TaskProgressHandler, readTask?: import('./_SourceReadTask.mjs').SourceReadTask }} [container]
 *   `readTask`: reports the reading of the stream in its own task
 */
export function watchStreamSize(stream, container = { size: 0 }) {
  const { progressHandler = new TaskProgressHandler(), readTask } = container
  stream.on('data', data => {
    if (container.size === 0) {
      // empty for xva exported by xapi
      readTask?.onStart({ bytesToRead: stream.length || undefined })
    }
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      progressHandler.setProgress(container.size / stream.length)
    }
    readTask?.onRead(data.length)
  })

  // a readable only emits 'end', a duplex (throttled stream) emits both
  let isComplete = false
  const complete = () => {
    if (!isComplete) {
      isComplete = true
      progressHandler.setProgress(1)
      readTask?.onEnd({ isComplete })
    }
  }
  stream.on('end', complete)
  stream.on('finish', complete)
  if (readTask !== undefined) {
    // no-op once the read task has ended
    stream.on('error', error => readTask.onEnd({ isComplete, error }))
    stream.on('close', () => readTask.onEnd({ isComplete }))
  }
  stream.pause()
  return container
}
