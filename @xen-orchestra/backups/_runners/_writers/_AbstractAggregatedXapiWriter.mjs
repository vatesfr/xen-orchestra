import { getOldEntries } from '../../_getOldEntries.mjs'
import { createLogger } from '@xen-orchestra/log'
import { compareReplicatedVmDatetime, listReplicatedVms } from './_listReplicatedVms.mjs'
import { asyncMapSettled } from '@xen-orchestra/async-map'

const { debug } = createLogger('xo:backups:AbstractAggregatedXapiWriter')
export class AbstractAggregatedXapiWriter {
  #ReplicationWriter
  #storageRepositories

  #writers = []
  get writers() {
    return this.#writers
  }
  mainWriter
  #props
  get props() {
    return this.#props
  }
  #oldVmReplicaList = []

  constructor({ srs, ReplicationWriter, ...props }) {
    debug('instantiate AbstractAggregatedXapiWriter')
    if (srs.length < 1) {
      throw new Error('AggregatedXapiWriter need at least one storage repository to work ')
    }
    this.#props = props
    this.#ReplicationWriter = ReplicationWriter
    this.#storageRepositories = srs
  }

  getWriterBySr(storageRepository) {
    for (const writer of this.#writers) {
      if (writer._sr === storageRepository) {
        return writer
      }
    }
    throw new Error("Can't find writer for storage repository")
  }

  async computeSRCandidate() {
    let maxSpace = 0
    this.#storageRepositories.forEach(({ physical_utilisation, physical_size }) => {
      if (physical_size - physical_utilisation > maxSpace) {
        maxSpace = physical_size - physical_utilisation
      }
    })
    debug(`computeSRCandidate found the max free space  ${maxSpace} for vm${this.#props.vmUuid}`)

    const srCandidates = this.#storageRepositories.filter(
      ({ physical_utilisation, physical_size }) => maxSpace === physical_size - physical_utilisation
    )
    // one at random from the sr with the most free space
    const candidate = srCandidates[Math.floor(Math.random() * srCandidates.length)]

    debug(
      `computeSRCandidate found ${srCandidates.length} sr with ${maxSpace} free size, and chose ${candidate.name_label} for vm${this.#props.vmUuid}`
    )
    return candidate
  }

  setOldReplicaList() {
    debug(`setOldReplicaList for vm ${this.#props.vmUuid}`)
    const scheduleId = this.#props.scheduleId
    const vmUuid = this.#props.vmUuid
    const settings = this.#props.settings

    const replicatedVms = this.#storageRepositories
      .map(sr => {
        return listReplicatedVms(sr.$xapi, scheduleId, sr.uuid, vmUuid)
      })
      .flat(1)
      .filter(_ => !!_)
      .sort(compareReplicatedVmDatetime)

    this.#oldVmReplicaList = getOldEntries(settings.copyRetention - 1, replicatedVms)

    debug(
      `setOldReplicaList found ${replicatedVms.length} replica, and will delete ${this.#oldVmReplicaList.length} (retention ${settings.copyRetention})  for vm ${this.#props.vmUuid}`
    )
  }

  /**
   * Deletes the old replicas computed by `setOldReplicaList`.
   *
   * @param {Object} [options]
   * @param {boolean} [options.keepMostRecent=false] - Keep the most recent old replica, which is the base of the
   *   next incremental replication (needed when copyRetention is 1 with deleteFirst). The kept replica stays in
   *   the list, so a later call without `keepMostRecent` (from `cleanup()`) deletes it once the transfer is done.
   */
  async deleteOldReplicas({ keepMostRecent = false } = {}) {
    let toDelete = this.#oldVmReplicaList
    let kept

    // the list is sorted by datetime (oldest first), so the last entry is the most recent replica,
    // which is the base of the next incremental replication
    if (keepMostRecent && toDelete.length > 0) {
      kept = toDelete[toDelete.length - 1]
      toDelete = toDelete.slice(0, -1)
    }

    debug(`deleteOldReplicas will delete ${toDelete.length} replicated vms  for vm ${this.#props.vmUuid}`)
    // destroy the VM on the right xapi
    await asyncMapSettled(toDelete, async vm => {
      debug('will delete old replica', vm.name_label)
      await vm.$xapi.VM_destroy(vm.$ref)
    })
    debug(`deleteOldReplicas deleted  ${toDelete.length} replicated vms  for vm ${this.#props.vmUuid}`)

    // whatever is left (the kept base, if any) will be deleted by the next call, from cleanup()
    this.#oldVmReplicaList = kept !== undefined ? [kept] : []
  }

  async setupWriters() {
    debug('Setup writers ')
    const settings = this.#props.settings
    const allSettings = this.#props.job.settings

    this.#storageRepositories.forEach(storageRepository => {
      const targetSettings = {
        ...settings,
        ...allSettings[storageRepository.uuid],
        skipDeleteOldEntries: true, // delete is handled globally
      }
      if (targetSettings.copyRetention !== 0) {
        const writer = new this.#ReplicationWriter({
          ...this.#props,
          sr: storageRepository,
          settings: targetSettings,
        })
        this.#writers.push(writer)
      }
    })
  }
}
