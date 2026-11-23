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
 * The current reading speed, in bytes per second, is reported in the `speed` property every 5 seconds: it is 0 when
 * the source is stalled
 *
 * Implements `ReadMeter` from `@xen-orchestra/disk-transform`
 */
export class SourceReadTask {
  #bytesRead = 0
  #lastSpeed
  #speedInterval
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
    if (this.#speedInterval === undefined) {
      this.#task.start()
      // on a timer instead of on read: a stalled source must report a speed of 0, not its last one
      this.#speedInterval = setInterval(() => this.#reportSpeed(), SPEED_INTERVAL)
      // must not keep the process alive if the source is never ended
      this.#speedInterval.unref()
    }

    // late reads, after the end, are never reported
    this.#bytesRead += length
  }

  #reportSpeed() {
    const speed = Math.round((this.#bytesRead * 1e3) / SPEED_INTERVAL)
    this.#bytesRead = 0
    // a source stalled for a long time must not emit an event every interval
    if (speed !== this.#lastSpeed) {
      this.#lastSpeed = speed
      this.#task.set('speed', speed)
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
    if (this.#speedInterval === undefined || task.status !== 'pending') {
      return
    }
    clearInterval(this.#speedInterval)
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
