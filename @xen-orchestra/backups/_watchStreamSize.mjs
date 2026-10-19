import { Task } from '@vates/task'
import { TaskProgressHandler } from './_runners/_vmRunners/_TaskProgressHandler.mjs'

const MAX_DURATION_BETWEEN_SIZE_EMIT = 5e3

/**
 * @param {import('node:stream').Readable} stream
 * @param {{ size: number, progressHandler?: TaskProgressHandler, reportSize?: boolean }} [container]
 *   `reportSize`: emit `transferredSize` on the current task
 */
export function watchStreamSize(stream, container = { size: 0 }) {
  const { progressHandler = new TaskProgressHandler(), reportSize = false } = container
  let lastSizeDate
  stream.on('data', data => {
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      progressHandler.setProgress(container.size / stream.length)
    }
    if (reportSize && (lastSizeDate === undefined || Date.now() - lastSizeDate >= MAX_DURATION_BETWEEN_SIZE_EMIT)) {
      lastSizeDate = Date.now()
      Task.set('transferredSize', container.size)
    }
  })

  // a readable only emits 'end', a duplex (throttled stream) emits both
  let isComplete = false
  const complete = () => {
    if (!isComplete) {
      isComplete = true
      progressHandler.setProgress(1)
      if (reportSize) {
        Task.set('transferredSize', container.size)
      }
    }
  }
  stream.on('end', complete)
  stream.on('finish', complete)
  stream.pause()
  return container
}
