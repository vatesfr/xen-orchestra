import { Task } from '@vates/task'
import { TaskMetrics } from '@vates/task/metrics'
import { MeteredDisk } from '@xen-orchestra/disk-transform'

const MAX_DURATION_BETWEEN_EMIT = 5e3

/**
 * Reports the reading of a source (a disk, a XVA) in its own task, child of the current task
 *
 * A source is read once, even when it is consumed by multiple writers, but from the async context of the writer
 * pulling the next block: the task is held here instead of relying on the current task
 *
 * Its lifecycle follows the source: started before the first read, ended when the source is exhausted, fails or is
 * closed early. A source never read (a step failing before the transfer, a disk without blocks) leaves no task
 *
 * The bytes read are reported in the `bytesRead` metric (`metrics` property, see `@vates/task/metrics`), with the
 * number of bytes to read as total, and the `progress` property when this number is known
 *
 * Implements `ReadMeter` from `@xen-orchestra/disk-transform`
 */
export class SourceReadTask {
  #isStarted = false
  #lastProgressDate = 0
  #bytesToRead
  #bytesRead = 0
  #metrics
  #task

  /**
   * @param {Record<string, unknown>} properties of the task, must not contain `type` or `id`: xo-web would display it
   *   as a VM/SR/remote task
   */
  constructor(properties) {
    // created here to be a child of the current task, only started on the first read
    this.#task = new Task({ properties })
    this.#metrics = new TaskMetrics(this.#task, { minEmitInterval: MAX_DURATION_BETWEEN_EMIT })
    this.#metrics.define('bytesRead', { unit: 'bytes' })
  }

  get bytesRead() {
    return this.#bytesRead
  }

  #setProgress() {
    this.#lastProgressDate = Date.now()
    if (this.#bytesToRead > 0) {
      this.#task.set('progress', Math.min(100, Math.round((this.#bytesRead * 100) / this.#bytesToRead)))
    }
  }

  /**
   * No-op once started
   *
   * @param {object} [opts]
   * @param {number} [opts.bytesToRead] number of bytes to read, if known
   */
  onStart({ bytesToRead } = {}) {
    if (this.#isStarted) {
      return
    }
    this.#isStarted = true
    this.#bytesToRead = bytesToRead
    this.#task.start()
    this.#metrics.setTotal('bytesRead', bytesToRead)
  }

  /**
   * @param {number} length number of bytes read
   */
  onRead(length) {
    this.onStart()
    if (this.#task.status !== 'pending') {
      // already ended, late reads are ignored
      return
    }
    this.#bytesRead += length
    this.#metrics.add('bytesRead', length)
    if (Date.now() - this.#lastProgressDate >= MAX_DURATION_BETWEEN_EMIT) {
      this.#setProgress()
    }
  }

  /**
   * A source closed early is not a failure: its consumers stopped, they report their own errors
   *
   * @param {{ isComplete: boolean, error?: unknown }} result
   */
  onEnd({ isComplete, error }) {
    const task = this.#task
    if (!this.#isStarted || task.status !== 'pending') {
      return
    }
    this.#metrics.flush()
    this.#setProgress()
    if (error !== undefined) {
      task.failure(error)
    } else {
      task.success({ isComplete })
    }
  }
}

/**
 * Reports the reading of each disk of an incremental export in its own task, child of the current task
 *
 * Each disk is replaced by a `MeteredDisk`, which only exposes the generic `Disk` interface: source specific methods
 * (`useNbd()` for example) must be called before
 *
 * @param {{ disks: Record<string, import('@xen-orchestra/disk-transform').Disk>, vdis: Record<string, { name_label: string, uuid: string }> }} incrementalExport
 */
export function meterIncrementalExport({ disks, vdis }) {
  for (const [key, disk] of Object.entries(disks)) {
    const vdi = vdis[key]
    disks[key] = new MeteredDisk(disk, new SourceReadTask({ name: `read disk ${vdi.name_label}`, vdiUuid: vdi.uuid }))
  }
}
