import { Task } from '@vates/task'

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

export class TaskProgressHandler {
  #size
  #task
  #isTaskStarted = false
  #lastProgressDate
  #lastProgressValue
  #lastTransferredSizeDate

  /**
   * Reports the progress and the sizes of a source (a disk, a stream) in its own task, child of the current task
   *
   * A source is read once, even when it is consumed by multiple writers: its task is the only one holding
   * the sizes, whatever the async context it is read from (the writer pulling the next block)
   *
   * The task is started by the first update, `end()` must be called once the source has been consumed
   *
   * @param {Record<string, unknown>} properties of the task
   * @param {object} [opts]
   * @param {number} [opts.size] number of bytes to read, if known
   * @returns {TaskProgressHandler}
   */
  static forSource(properties, { size } = {}) {
    // created here to be a child of the current task, but only started on the first update:
    // a source never read (a step failing before the transfer) leaves no pending task
    return new TaskProgressHandler({ size, task: new Task({ properties }) })
  }

  /**
   * @param {object} [opts]
   * @param {number} [opts.size] number of bytes to read, only reported by a source handler
   * @param {Task} [opts.task] not started task to report in, use `forSource()`
   */
  constructor({ size, task } = {}) {
    this.#size = size
    this.#task = task
    if (task === undefined) {
      Task.set('progress', 0)
    }
  }

  #set(name, value) {
    const task = this.#task
    if (task === undefined) {
      Task.set(name, value)
      return
    }
    // already ended, by an abortion for example
    if (task.status !== 'pending') {
      return
    }
    if (!this.#isTaskStarted) {
      this.#isTaskStarted = true
      task.start()
      if (this.#size !== undefined) {
        task.set('size', this.#size)
      }
    }
    task.set(name, value)
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
    this.#set('progress', Math.round(progress * 100))
    if (this.#task !== undefined && this.#size !== undefined) {
      this.#set('transferredSize', Math.round(progress * this.#size))
    }
  }

  /**
   * For a source of unknown size (a XVA exported by XAPI): reports the number of bytes read
   *
   * No-op if this is not a source handler
   *
   * @param {number} transferredSize
   * @param {object} [opts]
   * @param {boolean} [opts.isComplete] always emit the last value
   */
  setTransferredSize(transferredSize, { isComplete = false } = {}) {
    if (this.#task === undefined) {
      return
    }
    if (
      !isComplete &&
      this.#lastTransferredSizeDate !== undefined &&
      Date.now() - this.#lastTransferredSizeDate < MAX_DURATION_BETWEEN_PROGRESS_EMIT
    ) {
      return
    }
    this.#lastTransferredSizeDate = Date.now()
    this.#set('transferredSize', transferredSize)
  }

  done() {}

  /**
   * Ends the task of a source handler
   *
   * No-op if this is not a source handler, or if its task has not been started or is already ended
   *
   * @param {unknown} [error] ends the task as failed
   */
  end(error) {
    const task = this.#task
    if (task === undefined || !this.#isTaskStarted || task.status !== 'pending') {
      return
    }
    if (error === undefined) {
      task.success()
    } else {
      task.failure(error)
    }
  }
}

/**
 * Runs `fn` (the transfer of the sources) then ends the tasks of their handlers accordingly
 *
 * @template T
 * @param {Iterable<TaskProgressHandler>} sourceProgressHandlers
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function runAndEndSourceTasks(sourceProgressHandlers, fn) {
  let result
  try {
    result = await fn()
  } catch (error) {
    for (const progressHandler of sourceProgressHandlers) {
      progressHandler.end(error)
    }
    throw error
  }
  for (const progressHandler of sourceProgressHandlers) {
    progressHandler.end()
  }
  return result
}
