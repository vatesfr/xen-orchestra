import { AbstractAggregatedRemoteWriter } from './_AbstractAggregatedRemoteWriter.mjs'

export class AggregatedFullRemoteWriter extends AbstractAggregatedRemoteWriter {
  async deleteOldBackupsOnAdapter(adapter, backups) {
    await adapter.deleteFullVmBackups(backups)
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

  async run(props) {
    const mainAdapter = await this.computeAdapterCandidate()
    this.mainWriter = this.getWriterByAdapter(mainAdapter)
    return this.mainWriter.run(props)
  }

  // cleanup if deleteFirst is NOT selected
  // release  the lock on every adapters with this VM
  async afterBackup() {
    if (!this.props.settings.deleteFirst) {
      await this.deleteOldBackups()
    }
    await Promise.all(this.writers.map(writer => writer.afterBackup()))
  }

  healthCheck() {
    return this.mainWriter.healthCheck()
  }
}
