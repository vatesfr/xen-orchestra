// XCP-ng only updates the import task progress for some formats (e.g. it does
// for VHD but not for qcow2). To get a consistent progress regardless of the
// format, we count the uploaded bytes ourselves and update the task.
const IMPORT_PROGRESS_MAX_INTERVAL = 5e3 // maximum delay in ms between two progress updates
const IMPORT_PROGRESS_MIN_DELTA = 0.01 // minimal progress increase (1%) required to emit

// Observe how much data flows through `stream` (which must expose its total
// `length`) and report the uploaded fraction (`0` → `1`) via `onProgress`,
// throttled to avoid spamming the XAPI task API.
export function watchUploadProgress(stream, length, onProgress) {
  let sent = 0
  let lastDate = 0
  let lastValue = -1

  const emit = (progress, force) => {
    const now = Date.now()
    if (!force && now - lastDate < IMPORT_PROGRESS_MAX_INTERVAL && progress - lastValue < IMPORT_PROGRESS_MIN_DELTA) {
      return
    }
    lastDate = now
    lastValue = progress
    onProgress(progress)
  }

  stream.on('data', chunk => {
    sent += chunk.length
    emit(length > 0 ? Math.min(sent / length, 1) : 1, false)
  })
  stream.on('end', () => emit(1, true))

  // adding a `data` listener switches the stream to flowing mode: pause it until
  // the actual consumer starts reading so that no chunk is lost in the meantime
  stream.pause()
}
