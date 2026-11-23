import { Task } from '@vates/task'

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

export class TaskProgressHandler {
  #lastProgressDate
  #lastProgressValue
  constructor() {
    Task.set('progress', 0)
  }
  async setProgress(progress) {
    if (progress < 0 || progress > 1) {
      return
    }
    // the end is always emitted: throttled, a last step under the threshold would leave the task at 99%
    if (
      progress !== 1 &&
      this.#lastProgressDate !== undefined &&
      this.#lastProgressValue !== undefined &&
      Date.now() - this.#lastProgressDate < MAX_DURATION_BETWEEN_PROGRESS_EMIT &&
      progress - this.#lastProgressValue < MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT
    ) {
      return
    }
    this.#lastProgressDate = Date.now()
    this.#lastProgressValue = progress
    Task.set('progress', Math.round(progress * 100))
  }
  done() {}
}
