import { getOldEntries } from '../../_getOldEntries.mjs'
import { createLogger } from '@xen-orchestra/log'
import { FullXapiWriter } from './FullXapiWriter.mjs'
import { compareReplicatedVmDatetime, listReplicatedVms } from './_listReplicatedVms.mjs'
import { asyncMapSettled } from '@xen-orchestra/async-map'

const { debug } = createLogger('xo:backups:AggregatedFullXapiWriter')
export class AggregatedFullXapiWriter {
  #storageRepositories

  #writers = []
  #mainWriter
  #props
  #oldVmReplicaList = []

  constructor({ srs, ...props }) {
    debug('instantiate AggregatedFullRemoteWriter')
    this.#props = props
    this.#storageRepositories = srs
  }

  async #computeAdapterCandidate() {
    let maxSpace = 0
    this.#storageRepositories.forEach(({ physical_utilisation, physical_size }) => {
      if (physical_size - physical_utilisation > maxSpace) {
        maxSpace = physical_size - physical_utilisation
      }
    })
    debug(`computeAdapterCandidate found the max free space  ${maxSpace} for vm${this.#props.vmUuid}`)

    const srCandidates = this.#storageRepositories.filter(
      ({ physical_utilisation, physical_size }) => maxSpace === physical_size - physical_utilisation
    )
    // one at random from the sr with the most free space
    const candidate = srCandidates[Math.floor(Math.random() * srCandidates.length)]

    debug(
      `computeAdapterCandidate found ${srCandidates.length} sr with ${maxSpace} free size, and choose ${candidate.name_label}  for vm${this.#props.vmUuid}`
    )
    return candidate
  }

  #setOldReplicaList() {
    debug(`etOldReplicaList  for vm ${this.#props.vmUuid}`)
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

  async #deleteOldReplicas() {
    debug(`deleteOldReplicas will delete ${this.#oldVmReplicaList.length} replicated vms  for vm ${this.#props.vmUuid}`)
    // destroy the VM on the right xapi
    await asyncMapSettled(this.#oldVmReplicaList, async vm => {
      await vm.$xapi.VM_destroy(vm.$ref)
    })
    debug(`deleteOldReplicas deleted  ${this.#oldVmReplicaList.length} replicated vms  for vm ${this.#props.vmUuid}`)
  }
  async #setupWriters() {
    debug('Setup writers ')
    const settings = this.#props.settings
    const allSettings = this.#props.job.settings
    const storageCandidate = await this.#computeAdapterCandidate()

    this.#storageRepositories.forEach(storageRepository => {
      const targetSettings = {
        ...settings,
        ...allSettings[storageRepository.uuid],
        skipDeleteOldEntries: true, // delete is handled globally
      }
      if (targetSettings.copyRetention !== 0) {
        const writer = new FullXapiWriter({
          ...this.#props,
          sr: storageCandidate,
          settings: targetSettings,
        })
        this.#writers.push(writer)
        if (storageRepository === storageCandidate) {
          debug(`Setup main writer on ${storageRepository.name_label} for vm ${this.#props.vmUuid}`)
          this.#mainWriter = writer
        }
      }
    })
  }

  // delete replica if deleteFirst is selected
  async beforeBackup() {
    await this.#setupWriters()
    await Promise.all(this.#writers.map(writer => writer.beforeBackup()))
    this.#setOldReplicaList()
    if (this.#props.settings.deleteFirst) {
      await this.#deleteOldReplicas()
    }
  }

  async run(props) {
    await this.#mainWriter.run(props)
  }

  // delete replica if not using deleteFirst
  async afterBackup() {
    if (!this.#props.settings.deleteFirst) {
      await this.#deleteOldReplicas()
    }
    await Promise.all(this.#writers.map(writer => writer.afterBackup()))
  }

  healthCheck() {
    return this.#mainWriter.healthCheck()
  }
}
