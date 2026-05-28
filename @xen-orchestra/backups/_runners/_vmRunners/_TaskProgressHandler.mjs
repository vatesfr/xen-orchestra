import { Task } from '@vates/task'

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

export class TaskProgressHandler {
  #lastProgressDate
  #lastProgressValue
  async setProgress(progress) {
    if (progress < 0 || progress > 1) {
      return
    }
    if (
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
    // remove this before merging, it's only to have time
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  done() {}
}
