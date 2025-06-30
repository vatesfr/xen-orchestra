import { type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { VmService } from '../vms/vm.service.mjs'

export class PoolService {
  #restApi: RestApi
  #hostService: HostService
  #vmService: VmService

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = this.#restApi.ioc.get(HostService)
    this.#vmService = this.#restApi.ioc.get(VmService)
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

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)
    const vmsStatus = this.#getVmsStatus(id)

    return {
      hostStatus,
      vmsStatus,
    }
  }
}
