// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').ProgressHandler} ProgressHandler
 */

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

/**
 * @implements {ProgressHandler}
 */

export class XapiProgressHandler {
  /**
   * @type {string}
   */
  #label
  /**
   * @type {number|undefined}
   */
  #lastProgressDate
  /**
   * @type {number|undefined}
   */
  #lastProgressValue

  /**
   * @type {number}
   */
  #maxDurationBetweenProgressEmit
  /**
   * @type {number}
   */
  #minThresholdPercentBetweenProgressEmit
  /**
   * @type {string|undefined}
   */
  #taskRef
  /**
   * the creation of the task, shared by the calls made while it is in progress
   * @type {Promise<void>|undefined}
   */
  #started
  /**
   * @type {any}
   */

  #xapi

  /**
   *
   * @param {any} xapi
   * @param {string} label
   * @param {object} options
   */
  constructor(
    xapi,
    label,
    {
      maxDurationBetweenProgressEmit = MAX_DURATION_BETWEEN_PROGRESS_EMIT,
      minThresholdPercentBetweenProgressEmit = MIN_THRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT,
    } = {}
  ) {
    this.#label = label
    this.#maxDurationBetweenProgressEmit = maxDurationBetweenProgressEmit
    this.#minThresholdPercentBetweenProgressEmit = minThresholdPercentBetweenProgressEmit
    this.#xapi = xapi
  }
  // creates the task once: progress is reported by several writers at a time, each call must not create its own
  // task, the others would never be ended
  start() {
    if (this.#started === undefined) {
      this.#started = this.#xapi.call('task_create', this.#label, '').then(
        taskRef => {
          this.#taskRef = taskRef
        },
        error => {
          // the next progress call tries again
          this.#started = undefined
          throw error
        }
      )
    }
    return this.#started
  }

  // the task may still be being created
  async #setStatus(status) {
    await this.#started?.catch(() => {})
    this.#taskRef && (await this.#xapi.call('task_set_status', this.#taskRef, status))
  }

  done() {
    return this.#setStatus('success')
  }

  fail() {
    return this.#setStatus('failure')
  }

  /**
   * avoid spamming the xapi task api
   * @param {number} progress number between 0 and 1
   * @returns {Promise<void>}
   */
  async setProgress(progress) {
    if (this.#taskRef === undefined) {
      // the data will be updated on next progress call
      return this.start()
    }
    if (progress < 0 || progress > 1) {
      return
    }
    if (
      this.#lastProgressDate !== undefined &&
      this.#lastProgressValue !== undefined &&
      Date.now() - this.#lastProgressDate < this.#maxDurationBetweenProgressEmit &&
      progress - this.#lastProgressValue < this.#minThresholdPercentBetweenProgressEmit
    ) {
      return
    }
    this.#lastProgressDate = Date.now()
    this.#lastProgressValue = progress
    return this.#xapi.call('task.set_progress', this.#taskRef, progress)
  }
}
