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
 * Reports a mount's cache-fill progress onto a dedicated `caching` subtask
 * (built by {@link createCachingTask}), independently of the mount's own
 * long-lived task: block materialization can happen off any call stack (an
 * on-demand SCSI read arrives from the network, with nothing ambient to pick
 * up through `AsyncLocalStorage`), and can go on long after the mount call
 * itself has returned — hence a *retained* reference, not `Task.set`'s usual
 * ambient convention.
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
 * mount's overall cache-fill progress for as long as the mount lives — not
 * just for the duration of one `hydrateDisk` call, since the same progress
 * can just as well come from a guest reading the whole disk on its own.
 * Ended in success by {@link CachingProgressHandler#done}, or, if the mount
 * is torn down first, by the caller.
 */
export function createCachingTask() {
  const task = new Task({ properties: { name: 'caching' } })
  task.start()
  return { task, progressHandler: new CachingProgressHandler(task) }
}
