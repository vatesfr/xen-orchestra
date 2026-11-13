import { Task } from '@vates/task'
import { MeteredDisk } from '@xen-orchestra/disk-transform'

const SPEED_INTERVAL = 5e3

/**
 * Reports the reading of a source (a disk, a XVA) in its own task, child of the current task
 *
 * A source is read once, even when it is consumed by multiple writers, but from the async context of the writer
 * pulling the next block: the task is held here instead of relying on the current task
 *
 * Its lifecycle follows the source: started on the first read, ended when the source is exhausted, fails or is closed
 * early. A source never read (a step failing before the transfer, a disk without blocks) leaves no task
 *
 * The current reading speed, in bytes per second, is reported in the `speed` property
 *
 * Implements `ReadMeter` from `@xen-orchestra/disk-transform`
 */
export class SourceReadTask {
  #bytesRead = 0
  #lastSpeedDate
  #task

  /**
   * @param {string} name of the task
   */
  constructor(name) {
    // created here to be a child of the current task, only started on the first read
    this.#task = new Task({ properties: { name } })
  }

  /**
   * @param {number} length number of bytes read
   */
  onRead(length) {
    const task = this.#task
    const now = Date.now()
    if (this.#lastSpeedDate === undefined) {
      this.#lastSpeedDate = now
      task.start()
    } else if (task.status !== 'pending') {
      // already ended, late reads are ignored
      return
    }

    this.#bytesRead += length
    const elapsed = now - this.#lastSpeedDate
    if (elapsed >= SPEED_INTERVAL) {
      task.set('speed', Math.round((this.#bytesRead * 1e3) / elapsed))
      this.#bytesRead = 0
      this.#lastSpeedDate = now
    }
  }

  /**
   * A source closed early is not a failure: its consumers stopped, they report their own errors
   *
   * @param {unknown} [error]
   */
  onEnd(error) {
    const task = this.#task
    // never started or already ended
    if (this.#lastSpeedDate === undefined || task.status !== 'pending') {
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
 * Reports the reading of a disk of an incremental export in its own task, child of the current task
 *
 * The returned `MeteredDisk` only exposes the generic `Disk` interface: source specific methods (`useNbd()` for
 * example) must be called before
 *
 * @param {import('@xen-orchestra/disk-transform').Disk} disk
 * @param {{ name_label: string }} vdi
 */
export function meterDisk(disk, vdi) {
  return new MeteredDisk(disk, new SourceReadTask(`read disk ${vdi.name_label}`))
}
