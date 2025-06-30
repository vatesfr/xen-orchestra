import { type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'

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

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)
    const vmsStatus = this.#getVmsStatus(id)
    const alarms = this.#getAlarms(id)
    const missingPatches = await this.#getMissingPatches(id)

    return {
      hostStatus,
      vmsStatus,
      alarms,
      missingPatches,
    }
  }
}
