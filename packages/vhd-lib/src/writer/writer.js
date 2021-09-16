// or just use writers of @xen-orchestra/backups/writer

export default class VHDWriter {
  constructor(vhd) {}
  /**
   * Write all the VHD to the destination
   */
  async write() {
    throw new Error('Not implemented')
  }
}
