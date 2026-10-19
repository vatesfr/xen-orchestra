import { Task } from '@vates/task'

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

export class TaskProgressHandler {
  #size
  #lastProgressDate
  #lastProgressValue

  /**
   * @param {object} [opts]
   * @param {number} [opts.size] number of bytes to transfer, enables `transferredSize`
   */
  constructor({ size } = {}) {
    this.#size = size
    Task.set('progress', 0)
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
    // the sizes are emitted from the transfer context, the constructor may run in a parent task
    if (this.#lastProgressDate === undefined && this.#size !== undefined) {
      Task.set('size', this.#size)
    }
    this.#lastProgressDate = Date.now()
    this.#lastProgressValue = progress
    Task.set('progress', Math.round(progress * 100))
    if (this.#size !== undefined) {
      Task.set('transferredSize', Math.round(progress * this.#size))
    }
  }
  done() {}
}
