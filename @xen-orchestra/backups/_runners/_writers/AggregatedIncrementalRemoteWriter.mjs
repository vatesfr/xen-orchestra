import { AbstractAggregatedRemoteWriter } from './_AbstractAggregatedRemoteWriter.mjs'
export class AggregatedIncrementalRemoteWriter extends AbstractAggregatedRemoteWriter {
  async deleteOldBackupsOnAdapter(adapter, backups) {
    await adapter.deleteDeltaVmBackups(backups)
  }

  /**
   *
   * @param {Map<string,string>} baseUuidToSrcVdi
   */
  async checkBaseVdis(baseUuidToSrcVdi) {
    let selectedCopy = new Map()
    for (const writer of this.writers) {
      const copy = new Map(baseUuidToSrcVdi)
      await writer.checkBaseVdis(copy)
      if (copy.size > 0) {
        // there can be multiple candidates
        // we use the last one in this case
        this.mainWriter = writer
        selectedCopy = copy
      }
    }
    // update the parameter with our best candidate
    // that can be an empty map
    baseUuidToSrcVdi.forEach(key => {
      if (!selectedCopy.has(key)) {
        baseUuidToSrcVdi.delete(key)
      }
    })
  }

  // take the lock on every adapters with this VM
  // cleanup if deleteFirst is selected
  async beforeBackup() {
    await this.setupWriters()
    await Promise.all(this.writers.map(writer => writer.beforeBackup()))

    await this.setOldBackups()
    if (this.props.settings.deleteFirst) {
      await this.deleteOldBackups()
    }
  }

  async prepare({ isFull }) {
    if (this.mainWriter === undefined) {
      // use the remote with the most empty space for starting a new chain
      const mainAdapter = await this.computeAdapterCandidate()
      this.mainWriter = this.getWriterByAdapter(mainAdapter)
    }
    await Promise.all(this.writers.map(writer => writer.prepare({ isFull })))
  }
  // write only on the main writer
  transfer({ isVhdDifferencing, timestamp, deltaExport, vm, vmSnapshot }) {
    return this.mainWriter.transfer({ isVhdDifferencing, timestamp, deltaExport, vm, vmSnapshot })
  }

  // chain only on the main writer
  updateUuidAndChain({ isVhdDifferencing, vdis }) {
    return this.mainWriter.updateUuidAndChain({ isVhdDifferencing, vdis })
  }

  // remove the backups and remove the entries
  async cleanup() {
    if (!this.props.settings.deleteFirst) {
      await this.deleteOldBackups()
    }
    await Promise.all(this.writers.map(writer => writer.cleanup()))
  }
  // cleanVM on all, since we may want to delete a chani
  // that is not on the main writer
  async afterBackup() {
    await Promise.all(this.writers.map(writer => writer.afterBackup()))
  }

  healthCheck() {
    return this.mainWriter.healthCheck()
  }
}
