import { type XoPool } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { HostService } from '../hosts/host.service.mjs'

export class PoolService {
  #restApi: RestApi
  #hostService: HostService

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#hostService = this.#restApi.ioc.get(HostService)
  }

  #getHostsStatus(poolId: XoPool['id']) {
    const { running, disabled, halted, total } = this.#hostService.getHostsStatus({
      filter: host => host.$pool === poolId,
    })

    return { running, disabled, halted, total }
  }

  async getDashboard(id: XoPool['id']) {
    const hostStatus = this.#getHostsStatus(id)

    return {
      hostStatus,
    }
  }
}
