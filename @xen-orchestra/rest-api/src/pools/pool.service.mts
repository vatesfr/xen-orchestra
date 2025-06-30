import { XoSr, type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { isSrWritable } from '../helpers/utils.helper.mjs'

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
    const srs = this.#restApi.getObjectsByType<XoSr>('SR', {
      filter: sr => sr.$pool === poolId && isSrWritable(sr),
    })

    const writableSrs = Object.values(srs)

    const sortedSrs = writableSrs
      .map(sr => ({ ...sr, percent: (sr.physical_usage / sr.size) * 100 }))
      .sort(({ percent: prevPercent }, { percent: nextPercent }) => {
        if (isNaN(prevPercent) && isNaN(nextPercent)) {
          return 0
        }

        if (isNaN(prevPercent)) {
          return 1
        }

        if (isNaN(nextPercent)) {
          return -1
        }

        return nextPercent - prevPercent
      })

    if (sortedSrs.length > 5) {
      sortedSrs.length = 5
    }

    return sortedSrs.map(({ name_label, id, physical_usage, size, percent }) => ({
      name_label,
      id,
      percent,
      physical_usage,
      size,
    }))
  }

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)
    const vmsStatus = this.#getVmsStatus(id)
    const alarms = this.#getAlarms(id)
    const missingPatches = await this.#getMissingPatches(id)
    const storageUsage = this.#getTopFiveSrsUsage(id)

    return {
      hostStatus,
      vmsStatus,
      alarms,
      missingPatches,
      storageUsage,
    }
  }
}
