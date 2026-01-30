import { getOldEntries } from '../../_getOldEntries.mjs'
import { compareTimestamp } from '../../RemoteAdapter.mjs'
import { FullRemoteWriter } from './FullRemoteWriter.mjs'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:backups:AggregatedFullRemoteWriter')

export class AggregatedFullRemoteWriter {
  #adapters
  #writers = []
  #mainWriter
  #props
  #oldBackups
  constructor({ adapters, ...props }) {
    debug('instantiate AggregatedFullRemoteWriter')
    this.#props = props
    this.#adapters = adapters
  }

  /**
   * select the best adapter candidate to write this backup
   *   if all the adapter infos expose an available info use the one with the more free space
   *   if none of the adapter exposes this info : choose at random
   *   if mixed : throw an error
   * @returns
   */
  async #computeAdapterCandidate() {
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
    let adapterCandidate
    if (withLimit === 0) {
      debug('no storage limit , choose at random')
      adapterCandidate = adapters[Math.floor(Math.random() * adapters.length)]
    } else {
      debug('storage limit , choose at random between those with the max space avilable')
      let maxSpace = 0
      infos.forEach(({ infos: { available } }) => {
        if (available > maxSpace) {
          maxSpace = available
        }
      })
      const candidates = infos.filter(({ infos }) => infos.available === maxSpace)
      adapterCandidate = candidates[Math.floor(Math.random() * candidates.length)].adapter
      debug(
        'candidates with max space : ',
        candidates.map(({ infos }) => infos),
        candidates.map(({ adapter }) => adapter._handler._remote.url),
        maxSpace
      )
    }
    debug('adapter candidate is selected ', adapterCandidate._handler._remote.id)
    return adapterCandidate
  }

  async #setupWriters() {
    debug('Setup writers ')
    const settings = this.#props.settings
    const allSettings = this.#props.job.settings
    const adapterCandidate = await this.#computeAdapterCandidate()

    Object.entries(this.#adapters).forEach(([remoteId, adapter]) => {
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
        skipDeleteOldEntries: true, // delete is handled globally
      }
      if (targetSettings.exportRetention !== 0) {
        const writer = new FullRemoteWriter({
          ...this.#props,
          adapter,
          remoteId,
          settings: targetSettings,
        })
        this.#writers.push(writer)
        if (adapter === adapterCandidate) {
          debug('Setup main writer ')
          this.#mainWriter = writer
        }
      }
    })
  }

  async #getEntriesPerAdapter(adapter) {
    const scheduleId = this.#props.scheduleId
    const vmUuid = this.#props.vmUuid
    return (await adapter.listVmBackups(vmUuid, _ => _.mode === 'full' && _.scheduleId === scheduleId)).map(entry => ({
      ...entry,
      adapter,
    }))
  }

  async #setOldBackups() {
    const entriesPerAdapter = await Promise.all(
      Object.values(this.#adapters).map(adapter => this.#getEntriesPerAdapter(adapter))
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

  async #deleteOldBackups() {
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
      await adapter.deleteFullVmBackups(backups)
    }
  }

  // take the lock on every adapters with this VM
  // cleanup if deleteFirst is selected
  async beforeBackup() {
    await this.#setupWriters()
    await Promise.all(this.#writers.map(writer => writer.beforeBackup()))
    await this.#setOldBackups()
    if (this.#props.settings.deleteFirst) {
      await this.#deleteOldBackups()
    }
  }

  async run(props) {
    return this.#mainWriter.run(props)
  }

  // cleanup if deleteFirst is NOT selected
  // release  the lock on every adapters with this VM
  async afterBackup() {
    if (!this.#props.settings.deleteFirst) {
      await this.#deleteOldBackups()
    }
    await Promise.all(this.#writers.map(writer => writer.afterBackup()))
  }

  healthCheck() {
    return this.#mainWriter.healthCheck()
  }
}
