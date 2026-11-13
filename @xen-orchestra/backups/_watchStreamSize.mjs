import { TaskProgressHandler } from './_runners/_vmRunners/_TaskProgressHandler.mjs'

/**
 * @param {import('node:stream').Readable} stream
 * @param {{ size: number, progressHandler?: TaskProgressHandler, readTask?: import('./_SourceReadTask.mjs').SourceReadTask }} [container]
 *   `readTask`: reports the reading of the stream in its own task
 */
export function watchStreamSize(stream, container = { size: 0 }) {
  const { progressHandler = new TaskProgressHandler(), readTask } = container
  stream.on('data', data => {
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      progressHandler.setProgress(container.size / stream.length)
    }
    readTask?.onRead(data.length)
  })

  stream.on('finish', () => {
    progressHandler.setProgress(1)
  })

  if (readTask !== undefined) {
    // no-op once the read task has ended
    stream.on('error', error => readTask.onEnd(error))
    stream.on('close', () => readTask.onEnd())
  }
  stream.pause()
  return container
}
