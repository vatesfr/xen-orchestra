// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').ProgressHandler} ProgressHandler
 */

const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 0.01

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
  #minTresholdPercentBetweenProgressEmit
  /**
   * @type {string|undefined}
   */
  #taskRef
  /**
   * @type {boolean}
   */
  #starting = false
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
      minTresholdPercentBetweenProgressEmit = MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT,
    } = {}
  ) {
    this.#label = label
    this.#maxDurationBetweenProgressEmit = maxDurationBetweenProgressEmit
    this.#minTresholdPercentBetweenProgressEmit = minTresholdPercentBetweenProgressEmit
    this.#xapi = xapi
  }
  async start() {
    this.#starting = true
    this.#taskRef = await this.#xapi.call('task_create', this.#label, '')
    this.#starting = false
  }
  async done() {
    this.#taskRef && (await this.#xapi.call('task_destroy', this.#taskRef))
  }

  /**
   * avoid spamming the xapi task api
   * @param {number} progress number between 0 and 1
   * @returns {Promise<void>}
   */
  async setProgress(progress) {
    if (this.#taskRef === undefined) {
      await this.start()
      return
    }
    if (this.#starting === true) {
      // the data will be updated on next progress call
      return
    }
    if (progress < 0 || progress > 1) {
      return
    }
    if (
      this.#lastProgressDate !== undefined &&
      this.#lastProgressValue !== undefined &&
      Date.now() - this.#lastProgressDate < this.#maxDurationBetweenProgressEmit &&
      progress - this.#lastProgressValue < this.#minTresholdPercentBetweenProgressEmit
    ) {
      return
    }
    this.#lastProgressDate = Date.now()
    this.#lastProgressValue = progress
    return this.#xapi.call('task.set_progress', this.#taskRef, progress)
  }
}
