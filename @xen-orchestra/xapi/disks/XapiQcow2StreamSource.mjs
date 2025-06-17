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
   */
  constructor({ vdiRef, baseRef, xapi }) {
    super(undefined)
    this.#ref = vdiRef
    this.#baseRef = baseRef
    this.#xapi = xapi
  }

  async openSource() {
    const stream = await this.#xapi.VDI_exportContent(this.ref, {
      baseRef: this.#baseRef,
      format: 'qcow2',
      preferNbd: false,
    })
    const disk = new QcowStream(stream)
    await disk.init()
    return disk
  }

  async close() {
    this.#stream?.on('error', () => {})
    this.#stream?.destroy()
    return super.close()
  }
}
