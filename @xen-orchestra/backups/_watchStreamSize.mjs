import { TaskProgressHandler } from './_runners/_vmRunners/_TaskProgressHandler.mjs'
export function watchStreamSize(stream, container = { size: 0 }) {
  const progressHandler = container.progressHandler ?? new TaskProgressHandler()
  stream.on('data', data => {
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      progressHandler.setProgress(container.size / stream.length)
    }
  })

  stream.on('finish', () => {
    progressHandler.setProgress(1)
  })
  stream.pause()
  return container
}
