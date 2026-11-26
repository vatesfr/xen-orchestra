import { Task } from '@vates/task'

import { AbstractAggregatedXapiWriter } from './_AbstractAggregatedXapiWriter.mjs'

export class AggregatedFullXapiWriter extends AbstractAggregatedXapiWriter {
  // delete replica if deleteFirst is selected
  async beforeBackup() {
    await this.setupWriters()
    await Promise.all(this.writers.map(writer => writer.beforeBackup()))
    this.setOldReplicaList()
    if (this.props.settings.deleteFirst) {
      await this.deleteOldReplicas()
    }
  }

  async run(props) {
    const mainSr = await this.computeSRCandidate()
    this.mainWriter = this.getWriterBySr(mainSr)
    await this.mainWriter.run(props)
  }

  // delete replica if not using deleteFirst, unless the cleanup has been skipped (level 2 abort): the next run does it
  async afterBackup() {
    if (!this.props.settings.deleteFirst && Task.cleanupSignal?.aborted !== true) {
      await this.deleteOldReplicas()
    }
    await Promise.all(this.writers.map(writer => writer.afterBackup()))
  }

  healthCheck() {
    return this.mainWriter.healthCheck()
  }
}
