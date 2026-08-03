import { Task } from '@vates/task'

// the LUN serves the *content* of the source disk, not its container format, so
// a label must not keep a `.vhd`/`.alias.vhd` suffix: it would suggest a format
// the storage layer would then read differently
export const cacheLabel = diskPath =>
  diskPath
    .split('/')
    .pop()
    .replace(/(\.alias)?\.vhd$/, '')

const PROGRESS_THROTTLE_MS = 5e3
const PROGRESS_THROTTLE_STEP = 0.01

/**
 * Reports cache-fill progress on a retained `caching` subtask rather than via
 * `Task.set`'s ambient convention: materialization can be triggered from an
 * arbitrary call stack (a raw SCSI read has no ambient task to attach to).
 */
class CachingProgressHandler {
  #task
  #lastDate
  #lastValue

  constructor(task) {
    this.#task = task
  }

  setProgress(fraction) {
    if (
      this.#lastDate !== undefined &&
      Date.now() - this.#lastDate < PROGRESS_THROTTLE_MS &&
      fraction - this.#lastValue < PROGRESS_THROTTLE_STEP
    ) {
      return
    }
    this.#report(() => this.#task.set('progress', Math.round(fraction * 100)))
    this.#lastDate = Date.now()
    this.#lastValue = fraction
  }

  done() {
    // every block is cached: this subtask's job is over, whether that came
    // from an explicit hydration or just from enough of the disk being read
    this.#report(() => this.#task.success())
  }

  // guards against the task having already ended — e.g. the mount was
  // unmounted (which also ends this task) while a block was in flight
  #report(fn) {
    if (this.#task.status === 'pending') {
      fn()
    }
  }
}

/**
 * A subtask, nested under whatever `@vates/task` is ambient, tracking one
 * mount's cache-fill progress for as long as the mount lives — not just one
 * {@link hydrateDisk} call, since progress can equally come from a guest
 * reading the disk on its own. Ended by {@link CachingProgressHandler#done},
 * or by the caller if the mount is torn down first.
 */
export function createCachingTask() {
  const task = new Task({ properties: { name: 'caching' } })
  task.start()
  return { task, progressHandler: new CachingProgressHandler(task) }
}
