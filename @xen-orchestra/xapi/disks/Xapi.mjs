// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').RandomAccessDisk} RandomAccessDisk
 */

import { DiskLargerBlock, RandomDiskPassthrough, ReadAhead } from '@xen-orchestra/disk-transform'
import { XapiVhdCbtSource } from './XapiVhdCbt.mjs'
import { XapiStreamNbdSource } from './XapiStreamNbd.mjs'
import { XapiVhdStreamSource } from './XapiVhdStreamSource.mjs'
import { createLogger } from '@xen-orchestra/log'
import { XapiProgressHandler } from './XapiProgress.mjs'
import { XapiQcow2StreamSource } from './XapiQcow2StreamSource.mjs'

// @todo how to type this ?
const { info, warn } = createLogger('@xen-orchestra/xapi/disks/Xapi')

const VHD_MAX_SIZE = 2 * 1024 * 1024 * 1024 * 1024 /* 2TB */ - 8 * 1024 /* metadata */

/**
 * Meta class that handles the fallback logic when trying to export a disk from xapi.
 * Uses NBD, change block tracking, and stream export depending on capabilities.
 */
export class XapiDiskSource extends RandomDiskPassthrough {
  /** @type {string} */
  #vdiRef

  /** @type {string | undefined} */
  #baseRef

  /** @type {boolean} */
  #preferNbd

  /** @type {number} */
  #nbdConcurrency

  /** @type {any} */
  #xapi // @todo do a better type here

  /** @type {number} */
  #blockSize
  #useNbd = false
  #useCbt = false

  /**
   * @param {Object} params
   * @param {any} params.xapi
   * @param {string} params.vdiRef
   * @param {string} [params.baseRef]
   * @param {boolean} [params.preferNbd=true]
   * @param {number} [params.nbdConcurrency=2]
   * @param {number} [params.blockSize=2*1024*1024]
   */
  constructor({ xapi, vdiRef, baseRef, preferNbd = true, nbdConcurrency = 2, blockSize = 2 * 1024 * 1024 }) {
    super(undefined)
    this.#baseRef = baseRef
    this.#blockSize = blockSize
    this.#nbdConcurrency = nbdConcurrency
    this.#preferNbd = preferNbd
    this.#vdiRef = vdiRef
    this.#xapi = xapi
  }

  /**
   * Create a disk source using stream export + NBD.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<ReadAhead|XapiVhdStreamSource>}
   */
  async #openNbdStream() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef
    let source
    let streamSource
    try {
      streamSource = await this.#openExportStream()
      if (streamSource === undefined) {
        throw new Error(`Can't open open stream source`)
      }
      source = new XapiStreamNbdSource(streamSource, { vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency })
      await source.init()
    } catch (err) {
      await source?.close()
      if (err.code === 'NO_NBD_AVAILABLE') {
        warn(`can't connect through NBD, fallback to stream export`)
        if (streamSource === undefined) {
          throw new Error(`Can't open open stream source`)
        }
        return streamSource
      } else {
        await streamSource?.close()
        throw err
      }
    }
    this.#useNbd = true
    const readAhead = new ReadAhead(source)
    const label = await xapi.getField('VDI', vdiRef, 'name_label')
    readAhead.progressHandler = new XapiProgressHandler(xapi, `Exporting content of VDI ${label} through NBD`)
    return readAhead
  }

  /**
   * Create a disk source using stream export.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<XapiVhdStreamSource|XapiQcow2StreamSource | ReadAhead>}
   */
  async #openExportStream() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef

    let source
    try {
      const size = await xapi.getField('VDI', vdiRef, 'virtual_size')
      if (size < VHD_MAX_SIZE) {
        source = new XapiVhdStreamSource({ vdiRef, baseRef, xapi })
      } else {
        source = new XapiQcow2StreamSource({ vdiRef, baseRef, xapi })
      }
      await source.init()

      if (source.getBlockSize() < this.#blockSize) {
        source = new DiskLargerBlock(source, this.#blockSize)
      }
    } catch (err) {
      await source?.close()
      if (err.code === 'VDI_CANT_DO_DELTA') {
        warn(`can't compute delta of XapiVhdStreamSource ${vdiRef} from ${baseRef}, fallBack to a full`)
        // @todo : should clear CBT status since it probably a little broken
        source = new XapiVhdStreamSource({ vdiRef, baseRef: undefined, xapi })
        await source.init()
      } else {
        throw err
      }
    }
    return source
  }

  /**
   * Create a disk source using NBD and CBT.
   * On failure, fall back to stream + NBD.
   *
   * @returns {Promise<ReadAhead|XapiVhdStreamSource>}
   */
  async #openNbdCbt() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef
    const source = new XapiVhdCbtSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency })
    try {
      await source.init()
      this.#useNbd = true
      this.#useCbt = true
      const readAhead = new ReadAhead(source)
      const label = await xapi.getField('VDI', vdiRef, 'name_label')
      readAhead.progressHandler = new XapiProgressHandler(xapi, `Exporting content of VDI ${label} through NBD+CBT`)
      return readAhead
    } catch (error) {
      info('openNbdCBT', error)
      await source.close()
      // A lot of things can go wrong with CBT:
      // Not enabled on the baseRef,
      // Not enabled on the VDI,
      // Disabled/enabled in between,
      // SR not supporting it,
      // Plus the standard failures.

      // Try without CBT on failure.
      return this.#openNbdStream()
    }
  }

  /**
   *
   * @returns {Promise<XapiVhdStreamSource>}
   */
  async openSource() {
    let source
    if (this.#preferNbd) {
      if (this.#baseRef !== undefined) {
        source = await this.#openNbdCbt()
      } else {
        // Pure CBT/NBD is not available for base:
        // The base incremental needs the block list to work efficiently.
        source = await this.#openNbdStream()
      }
    } else {
      source = await this.#openExportStream()
    }
    return source
  }

  useNbd() {
    return this.#useNbd
  }

  useCbt() {
    return this.#useCbt
  }
}
