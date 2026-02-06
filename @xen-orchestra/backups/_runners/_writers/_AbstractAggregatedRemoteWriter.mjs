import { getOldEntries } from '../../_getOldEntries.mjs'
import { compareTimestamp } from '../../RemoteAdapter.mjs'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:backups:AbstractAggregatedRemoteWriter')

export class AbstractAggregatedRemoteWriter {
  #BackupWriter
  #adapters
  get adapters() {
    return this.#adapters
  }

  mainWriter
  #props
  get props() {
    return this.#props
  }
  #oldBackups

  #writers = []
  get writers() {
    return this.#writers
  }
  constructor({ adapters, BackupWriter, ...props }) {
    debug('instantiate AggregatedFullRemoteWriter')
    this.#props = props
    this.#adapters = adapters
    this.#BackupWriter = BackupWriter
  }

  getWriterByAdapter(adapter) {
    for (const writer of this.#writers) {
      if (writer._adapter === adapter) {
        return writer
      }
    }
    throw new Error("Can't find writer for adapter")
  }

  /**
   * select the best adapter candidate to write this backup
   *   if all the adapter infos expose an available info use the one with the more free space
   *   if none of the adapter exposes this info : choose at random
   *   if mixed : throw an error
   * @returns
   */
  async computeAdapterCandidate() {
    const adapters = Object.values(this.#adapters)
    const infos = await Promise.all(
      adapters.map(async adapter => {
        const infos = await adapter._handler.getInfo()
        return { adapter, infos }
      })
    )
    const withLimit = infos.filter(({ infos: { available } }) => available > 0).length
    if (withLimit !== 0 && withLimit !== infos.length) {
      throw new Error(`an Aggregate remote can't use a mix of limited and unlimited storages`)
    }
    let candidates
    if (withLimit === 0) {
      debug('no storage limit , choose at random')
      candidates = Object.values(this.adapters)
    } else {
      debug('storage limit , choose at random between those with the max space avilable')
      let maxSpace = 0
      infos.forEach(({ infos: { available } }) => {
        if (available > maxSpace) {
          maxSpace = available
        }
      })

      // candidates are the adapter with the same free space , equal to the max free space
      candidates = infos.filter(({ infos }) => infos.available === maxSpace).map(({ adapter }) => adapter)
    }
    const adapterCandidate = candidates[Math.floor(Math.random() * candidates.length)]
    debug('adapter candidate is selected ', adapterCandidate._handler._remote.id)
    return adapterCandidate
  }

  async setupWriters() {
    debug('Setup writers ')
    const settings = this.#props.settings
    const allSettings = this.#props.job.settings

    Object.entries(this.#adapters).forEach(([remoteId, adapter]) => {
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
        skipDeleteOldEntries: true, // delete is handled globally
      }
      if (targetSettings.exportRetention !== 0) {
        const writer = new this.#BackupWriter({
          ...this.#props,
          adapter,
          remoteId,
          settings: targetSettings,
        })
        this.#writers.push(writer)
      }
    })
  }

  async getEntriesPerAdapter(adapter) {
    const scheduleId = this.#props.scheduleId
    const vmUuid = this.#props.vmUuid
    return (await adapter.listVmBackups(vmUuid, _ => _.scheduleId === scheduleId)).map(entry => ({
      ...entry,
      adapter,
    }))
  }

  async setOldBackups() {
    const entriesPerAdapter = await Promise.all(
      Object.values(this.#adapters).map(adapter => this.getEntriesPerAdapter(adapter))
    )
    const entries = entriesPerAdapter
      .flat(1)
      .filter(_ => !!_)
      .sort(compareTimestamp)

    const settings = this.#props.settings
    this.#oldBackups = getOldEntries(settings.exportRetention - 1, entries, {
      longTermRetention: settings.longTermRetention,
      timezone: settings.timezone,
    })
    debug(`got ${this.#oldBackups.length} old backup(s) to delete `)
  }

  async deleteOldBackupsOnAdapter(adapter, backup) {
    throw new Error('not implemented')
  }

  async deleteOldBackups() {
    const byAdapters = new Map()
    this.#oldBackups.forEach(({ adapter, ...backup }) => {
      if (!byAdapters.has(adapter)) {
        byAdapters.set(adapter, [])
      }
      const current = byAdapters.get(adapter)
      current.push(backup)
      byAdapters.set(adapter, current)
    })
    for (const [adapter, backups] of byAdapters.entries()) {
      debug(`delete ${backups.length} old backup(s) to delete from ${adapter._handler._remote.id}`)
      await this.deleteOldBackupsOnAdapter(adapter, backups)
    }
  }
}
