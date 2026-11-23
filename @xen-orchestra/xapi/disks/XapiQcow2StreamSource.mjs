// @ts-check
/**
 * @typedef {import('stream').Readable} Readable
 */
import { RandomDiskPassthrough } from '@xen-orchestra/disk-transform'
import { QcowStream } from '@xen-orchestra/qcow2'

export class XapiQcow2StreamSource extends RandomDiskPassthrough {
  #xapi
  get xapi() {
    return this.#xapi
  }

  /** @type {string} */
  #ref
  /** @returns {string} */
  get ref() {
    return this.#ref
  }
  /** @type {string|undefined} */
  #baseRef
  /** @returns {string|undefined} */
  get baseRef() {
    return this.#baseRef
  }

  /**
   * @type {Readable|undefined}
   */
  #stream
  /**
   * @param {Object} params
   * @param {string} params.vdiRef
   * @param {string| undefined} params.baseRef
   * @param {any} params.xapi
   * @param {AbortSignal} [params.signal] stops the XAPI export once aborted
   */
  constructor({ vdiRef, baseRef, xapi, signal }) {
    super(undefined)
    this.#ref = vdiRef
    this.#baseRef = baseRef
    this.#signal = signal
    this.#xapi = xapi
  }

  /** @type {AbortSignal | undefined} */
  #signal

  async openSource() {
    const stream = await this.#xapi.VDI_exportContent(this.ref, {
      baseRef: this.#baseRef,
      format: 'qcow2',
      preferNbd: false,
      signal: this.#signal,
    })
    const disk = new QcowStream(stream)
    await disk.init()
    return disk
  }

  isDifferencing() {
    return !!this.#baseRef
  }
  async close() {
    this.#stream?.on('error', () => {})
    this.#stream?.destroy()
    return super.close()
  }
}
