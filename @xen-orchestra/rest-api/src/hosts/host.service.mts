import { HOST_POWER_STATE, type XoHost } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

export class HostService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  getHostsStatus(opts?: { filter?: string | ((obj: XoHost) => boolean) }) {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host', opts)

    let nRunning = 0
    let nHalted = 0
    let nDisabled = 0
    let nUnknown = 0
    let total = 0

    for (const id in hosts) {
      total++
      const host = hosts[id as XoHost['id']]
      if (!host.enabled) {
        nDisabled++
        continue
      }
      switch (host.power_state) {
        case HOST_POWER_STATE.RUNNING:
          nRunning++
          break
        case HOST_POWER_STATE.HALTED:
          nHalted++
          break
        default:
          nUnknown++
          break
      }
    }

    return {
      disabled: nDisabled,
      running: nRunning,
      halted: nHalted,
      unknown: nUnknown,
      total,
    }
  }
}
