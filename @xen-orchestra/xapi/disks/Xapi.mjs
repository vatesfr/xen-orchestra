// @ts-check
/**
 * @typedef {import('../../disk-transform/dist/Disk.mjs').DiskBlock} DiskBlock
 */
 
import { Disk } from '../../disk-transform/dist/Disk.mjs';
import { XapiVhdCbtSource }  from  './XapiVhdCbt.mjs'
import { XapiVhdStreamNbdSource }  from './XapiVhdStreamNbd.mjs'
import { XapiVhdStreamSource } from  './XapiVhdStreamSource.mjs'

// const { createLogger } = require('@xen-orchestra/log');

// @todo : I can't find the right type for createLogger with it's dynamic properties
const warn = console.error;

/**
 * Meta class that handles the fallback logic when trying to export a disk from xapi.
 * Uses NBD, change block tracking, and stream export depending on capabilities.
 */
export class XapiDiskSource extends Disk {
  /** @type {string} */
  #vdiRef;

  /** @type {string | undefined} */
  #baseRef;

  /** @type {boolean} */
  #preferNbd;

  /** @type {number} */
  #nbdConcurrency;

  /** @type {any} */
  #xapi; // @todo do a better type here

  /** @type {XapiVhdCbtSource | XapiVhdStreamNbdSource | XapiVhdStreamSource | undefined} */
  #source;

  /**
   * @param {Object} params
   * @param {any} params.xapi
   * @param {string} params.vdiRef
   * @param {string} [params.baseRef]
   * @param {boolean} [params.preferNbd=true]
   * @param {number} [params.nbdConcurrency=2]
   */
  constructor({ xapi, vdiRef, baseRef, preferNbd = true, nbdConcurrency = 2 }) {
    super();
    this.#vdiRef = vdiRef;
    this.#baseRef = baseRef;
    this.#preferNbd = preferNbd;
    this.#nbdConcurrency = nbdConcurrency;
    this.#xapi = xapi;
  }

  /** @returns {number} */
  getVirtualSize() {
    if(this.#source === undefined){
      throw new Error(`Can't get the virtual size of a Xapi disk before init`)
    }
    return this.#source.getVirtualSize();
  }

  /** @returns {number} */
  getBlockSize() {
    if(this.#source === undefined){
      throw new Error(`Can't get the block size of a Xapi disk before init`)
    }
    return this.#source.getBlockSize();
  }

  /**
   * Create a disk source using stream export + NBD.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<XapiVhdStreamNbdSource>}
   */
  async #openNbdStream() {
    const xapi = this.#xapi;
    const baseRef = this.#baseRef;
    const vdiRef = this.#vdiRef;
    let source = new XapiVhdStreamNbdSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency });
    try {
      await source.init();
    } catch (err) {
      await source.close();
      if (err.code === 'VDI_CANT_DO_DELTA') {
        warn(`can't compute delta of XapiVhdStreamNbdSource ${vdiRef} from ${baseRef}, fallBack to a full`);
        source = new XapiVhdStreamNbdSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency });
        await source.init();
      } else {
        throw err;
      }
    }
    return source;
  }

  /**
   * Create a disk source using stream export.
   * On failure, fall back to a full export.
   *
   * @returns {Promise<XapiVhdStreamSource>}
   */
  async #openExportStream() {
    const xapi = this.#xapi;
    const baseRef = this.#baseRef;
    const vdiRef = this.#vdiRef;
    let source = new XapiVhdStreamSource({ vdiRef, baseRef, xapi });
    try {
      await source.init();
    } catch (err) {
      await source.close();
      if (err.code === 'VDI_CANT_DO_DELTA') {
        warn(`can't compute delta of XapiVhdStreamSource ${vdiRef} from ${baseRef}, fallBack to a full`);
        source = new XapiVhdStreamSource({ vdiRef, baseRef, xapi });
        await source.init();
      } else {
        throw err;
      }
    }
    return source;
  }

  /**
   * Create a disk source using NBD and CBT.
   * On failure, fall back to stream + NBD.
   *
   * @returns {Promise<XapiVhdCbtSource | XapiVhdStreamNbdSource>}
   */
  async #openNbdCbt() {
    const xapi = this.#xapi;
    const baseRef = this.#baseRef;
    const vdiRef = this.#vdiRef;
    const source = new XapiVhdCbtSource({ vdiRef, baseRef, xapi, nbdConcurrency: this.#nbdConcurrency });
    try {
      await source.init();
      return source;
    } catch (error) {
      warn('opennbdCBT', error);
      await source.close();
      // A lot of things can go wrong with CBT:
      // Not enabled on the baseRef,
      // Not enabled on the VDI,
      // Disabled/enabled in between,
      // SR not supporting it,
      // Plus the standard failures.

      // Try without CBT on failure.
      return this.#openNbdStream();
    }
  }

  /** @returns {Promise<void>} */
  async init() {
    if (this.#preferNbd) {
      if (this.#baseRef !== undefined) {
        this.#source = await this.#openNbdCbt();
      } else {
        // Pure CBT/NBD is not available for base:
        // The base incremental needs the block list to work efficiently.
        this.#source = await this.#openNbdStream();
      }
    } else {
      this.#source = await this.#openExportStream();
    }
  }

  /** @returns {Promise<void>} */
  async close() {
    return this.#source?.close();
  }

  /** @returns {boolean} */
  isDifferencing() {
    if(this.#source === undefined){
      throw new Error(`Can't get isDifferencing of a Xapi disk before init`)
    }
    return this.#source.isDifferencing();
  }

  /** @returns {Promise<Disk>} */
  openParent() {
    if(this.#source === undefined){
      throw new Error(`Can't open parent of a Xapi disk before init`)
    }
    return this.#source.openParent();
  }

  /** @returns {Array<number>} */
  getBlockIndexes() {
    if(this.#source === undefined){
      throw new Error(`Can't getBlockIndexes a Xapi disk before init`)
    }
    return this.#source.getBlockIndexes();
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if(this.#source === undefined){
      throw new Error(`Can't hasBlock of a Xapi disk before init`)
    }
    return this.#source.hasBlock(index);
  }

  /** @returns {Promise<AsyncGenerator<DiskBlock> | AsyncGenerator<DiskBlock>} */
  async buildDiskBlockGenerator() {
    if(this.#source === undefined){
      throw new Error(`Can't buildDiskBlockGenerator of  a Xapi disk before init`)
    }
    return this.#source.buildDiskBlockGenerator();
  }
}