import { Task } from '@vates/task'
export function watchStreamSize(stream, container = { size: 0 }) {
  stream.on('data', data => {
    container.size += data.length
    if (stream.length) {
      // empty for xva exported by xapi
      Task.set('progress', (100 * container.size) / stream.length)
    }
  })
  stream.pause()
  return container
}
