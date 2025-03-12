// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

import { DiskPassthrough } from '@xen-orchestra/disk-transform'
import { XapiVhdCbtSource } from './XapiVhdCbt.mjs'
import { XapiVhdStreamNbdSource } from './XapiVhdStreamNbd.mjs'
import { XapiVhdStreamSource } from './XapiVhdStreamSource.mjs'

// const { createLogger } = require('@xen-orchestra/log');

// @todo : I can't find the right type for createLogger with it's dynamic properties
const warn = console.error

/**
 * Meta class that handles the fallback logic when trying to export a disk from xapi.
 * Uses NBD, change block tracking, and stream export depending on capabilities.
 */
export class XapiDiskSource extends DiskPassthrough {
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

  /**
   * @param {Object} params
   * @param {any} params.xapi
   * @param {string} params.vdiRef
   * @param {string} [params.baseRef]
   * @param {boolean} [params.preferNbd=true]
   * @param {number} [params.nbdConcurrency=2]
   */
  constructor({ xapi, vdiRef, baseRef, preferNbd = true, nbdConcurrency = 2 }) {
    super()
    this.#vdiRef = vdiRef
    this.#baseRef = baseRef
    this.#preferNbd = preferNbd
    this.#nbdConcurrency = nbdConcurrency
    this.#xapi = xapi
  }

  /**
   * Create a disk source using stream export + NBD.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<XapiVhdStreamNbdSource>}
   */
  async #openNbdStream() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef
    let source = new XapiVhdStreamNbdSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency })
    try {
      await source.init()
    } catch (err) {
      await source.close()
      if (err.code === 'VDI_CANT_DO_DELTA') {
        warn(`can't compute delta of XapiVhdStreamNbdSource ${vdiRef} from ${baseRef}, fallBack to a full`)
        source = new XapiVhdStreamNbdSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency })
        await source.init()
      } else {
        throw err
      }
    }
    return source
  }

  /**
   * Create a disk source using stream export.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<XapiVhdStreamSource>}
   */
  async #openExportStream() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef
    let source = new XapiVhdStreamSource({ vdiRef, baseRef, xapi })
    try {
      await source.init()
    } catch (err) {
      await source.close()
      if (err.code === 'VDI_CANT_DO_DELTA') {
        warn(`can't compute delta of XapiVhdStreamSource ${vdiRef} from ${baseRef}, fallBack to a full`)
        // @todo : should clear CBT status since it probably a little broken
        source = new XapiVhdStreamSource({ vdiRef, baseRef, xapi })
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
   * @returns {Promise<XapiVhdCbtSource | XapiVhdStreamNbdSource>}
   */
  async #openNbdCbt() {
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const vdiRef = this.#vdiRef
    const source = new XapiVhdCbtSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency })
    try {
      await source.init()
      return source
    } catch (error) {
      warn('opennbdCBT', error)
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
   * @returns {Promise<XapiVhdCbtSource | XapiVhdStreamNbdSource | XapiVhdStreamSource>}
   */
  openSource() {
    if (this.#preferNbd) {
      if (this.#baseRef !== undefined) {
        return this.#openNbdCbt()
      } else {
        // Pure CBT/NBD is not available for base:
        // The base incremental needs the block list to work efficiently.
        return this.#openNbdStream()
      }
    } else {
      return this.#openExportStream()
    }
  }
}
