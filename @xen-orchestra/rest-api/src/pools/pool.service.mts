import { XoHost, XoSr, type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { getTopPerProperty, isSrWritable } from '../helpers/utils.helper.mjs'

export class PoolService {
  #restApi: RestApi
  #hostService: HostService
  #vmService: VmService
  #alarmService: AlarmService

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = this.#restApi.ioc.get(HostService)
    this.#vmService = this.#restApi.ioc.get(VmService)
    this.#alarmService = this.#restApi.ioc.get(AlarmService)
  }

  #getHostsStatus(poolId: XoPool['id']) {
    const { running, disabled, halted, total } = this.#hostService.getHostsStatus({
      filter: host => host.$pool === poolId,
    })

    return { running, disabled, halted, total }
  }

  #getVmsStatus(poolId: XoPool['id']) {
    const { running, halted, paused, total, suspended } = this.#vmService.getVmsStatus({
      filter: vm => vm.$pool === poolId,
    })

    return {
      running,
      halted,
      paused,
      total,
      suspended,
    }
  }

  #getAlarms(poolId: XoPool['id']) {
    const alarms = this.#alarmService.getAlarms({ filter: alarm => alarm.$pool === poolId })
    return Object.values(alarms)
  }

  async #getMissingPatches(poolId: XoPool['id']) {
    const missingPatchesInfo = await this.#hostService.getMissingPatchesInfo({ filter: host => host.$pool === poolId })
    if (!missingPatchesInfo.hasAuthorization) {
      return {
        hasAuthorization: false,
      }
    }

    const { hasAuthorization, missingPatches } = missingPatchesInfo
    return {
      hasAuthorization,
      missingPatches,
    }
  }

  #getTopFiveSrsUsage(poolId: XoPool['id']) {
    const srs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: sr => sr.$pool === poolId && isSrWritable(sr),
      })
    )

    const topFive = getTopPerProperty(
      srs.map(({ name_label, id, physical_usage, size }) => ({
        name_label,
        id,
        percent: (physical_usage / size) * 100,
        physical_usage,
        size,
      })),
      { prop: 'percent', length: 5 }
    )

    return topFive
  }

  #getTopFiveHostsRamUsage(poolId: XoPool['id']) {
    const hosts = Object.values(
      this.#restApi.getObjectsByType<XoHost>('host', {
        filter: host => host.$pool === poolId && host.power_state === HOST_POWER_STATE.RUNNING,
      })
    )

    const topFive = getTopPerProperty(
      hosts.map(({ name_label, id, memory: { size, usage } }) => ({
        name_label,
        id,
        size,
        usage,
        percent: (usage / size) * 100,
      })),
      { length: 5, prop: 'percent' }
    )

    return topFive
  }

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)
    const vmsStatus = this.#getVmsStatus(id)
    const alarms = this.#getAlarms(id)
    const missingPatches = await this.#getMissingPatches(id)
    const storageUsage = this.#getTopFiveSrsUsage(id)
    const hostsRamUsage = this.#getTopFiveHostsRamUsage(id)

    return {
      hostStatus,
      vmsStatus,
      alarms,
      missingPatches,
      storageUsage,
      ramUsage: {
        hosts: hostsRamUsage,
      },
    }
  }
}
