import { AbstractAggregatedXapiWriter } from './_AbstractAggregatedXapiWriter.mjs'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:backups:AggregatedIncrementalXapiWriter')
export class AggregatedIncrementalXapiWriter extends AbstractAggregatedXapiWriter {
  /**
   *
   * @param {Map<string,string>} baseUuidToSrcVdi
   */
  async checkBaseVdis(baseUuidToSrcVdi) {
    debug('checkBaseVdis', { baseUuidToSrcVdi })
    let selectedCopy = new Map()
    for (const writer of this.writers) {
      const copy = new Map(baseUuidToSrcVdi)
      await writer.checkBaseVdis(copy)
      if (copy.size > 0) {
        debug('checkBaseVdis found a mainwriter candidate ', writer._sr.name_label)
        // there can be multiple candidates
        // we use the last one in this case
        this.mainWriter = writer
        selectedCopy = copy
      } else {
        debug(writer._sr.name_label, 'is not a delta candidate')
      }
    }
    // update the parameter with our best candidate
    // that can be an empty map
    baseUuidToSrcVdi.forEach(key => {
      if (!selectedCopy.has(key)) {
        baseUuidToSrcVdi.delete(key)
      }
    })
    debug('checkBaseVdis', { baseUuidToSrcVdi })
  }

  // take the lock on every adapters with this VM
  // cleanup if deleteFirst is selected
  async beforeBackup() {
    await this.setupWriters()
    await Promise.all(this.writers.map(writer => writer.beforeBackup()))
    this.setOldReplicaList()
    if (this.props.settings.deleteFirst) {
      await this.deleteOldReplicas()
    }
  }

  async prepare(args) {
    if (this.mainWriter === undefined) {
      debug('no mainwriter found, fallback to a new SR')
      // use the SR with the most empty space for starting a new chain
      const mainSr = await this.computeSRCandidate()
      this.mainWriter = this.getWriterBySr(mainSr)
    }
    await Promise.all(this.writers.map(writer => writer.prepare(args)))
  }

  // write only on the main writer
  transfer(args) {
    return this.mainWriter.transfer(args)
  }

  // chain only on the main writer
  updateUuidAndChain(args) {
    return this.mainWriter.updateUuidAndChain(args)
  }

  // remove the backups and remove the entries
  async cleanup() {
    debug('cleanup')
    if (!this.props.settings.deleteFirst) {
      await this.deleteOldReplicas()
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
