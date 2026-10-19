import { Task } from '@vates/task'

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

export class TaskProgressHandler {
  #estimatedSize
  #lastProgressDate
  #lastProgressValue

  /**
   * @param {object} [opts]
   * @param {number} [opts.estimatedSize] expected number of bytes to transfer, enables `transferredSize`
   */
  constructor({ estimatedSize } = {}) {
    this.#estimatedSize = estimatedSize
    Task.set('progress', 0)
    if (estimatedSize !== undefined) {
      Task.set('estimatedSize', estimatedSize)
      Task.set('transferredSize', 0)
    }
  }
  async setProgress(progress) {
    if (progress < 0 || progress > 1) {
      return
    }
    if (
      progress !== 1 && // always emit completion
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
    if (this.#estimatedSize !== undefined) {
      Task.set('transferredSize', Math.round(progress * this.#estimatedSize))
    }
  }
  done() {}
}
